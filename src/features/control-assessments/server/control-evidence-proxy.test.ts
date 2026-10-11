import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const { proxy } = vi.hoisted(() => ({ proxy: vi.fn() }));
vi.mock("@/lib/api/backend-proxy", () => ({
  proxyAuthenticatedRequest: proxy,
}));
import { proxyEvidence } from "./control-evidence-proxy";
const id = "00000000-0000-4000-8000-000000000001";
const body = {
  requestId: id,
  name: "MFA test",
  source: "MFA test report",
  description: "Ten administrative accounts were tested",
  documentUrl: "https://docs.example.test/mfa",
  collectedAt: "2020-01-01T00:00:00Z",
  validUntil: null,
};
const req = (value: unknown, origin = "http://localhost:3001") =>
  new Request(`http://localhost:3001/api/compliance/controls/${id}/evidence`, {
    method: "POST",
    headers: { origin, "content-type": "application/json" },
    body: JSON.stringify(value),
  });
beforeEach(() => {
  vi.clearAllMocks();
  proxy.mockResolvedValue(new Response("{}", { status: 201 }));
});
describe("Control Evidence BFF", () => {
  it("blocks cross-site writes and unknown fields", async () => {
    expect(
      (await proxyEvidence(req(body, "https://other.example"), id, "add"))
        .status,
    ).toBe(403);
    const request = req(body);
    request.headers.delete("origin");
    expect((await proxyEvidence(request, id, "add")).status).toBe(403);
    expect(
      (
        await proxyEvidence(
          req({ ...body, reviewedAt: body.collectedAt }),
          id,
          "add",
        )
      ).status,
    ).toBe(400);
    expect(proxy).not.toHaveBeenCalled();
  });
  it("checks IDs, JSON and document URL before forwarding", async () => {
    expect((await proxyEvidence(req(body), "invalid", "add")).status).toBe(400);
    expect(
      (
        await proxyEvidence(
          req({ ...body, documentUrl: "javascript:alert(1)" }),
          id,
          "add",
        )
      ).status,
    ).toBe(400);
    const malformed = new Request(`http://localhost:3001/api/${id}`, {
      method: "POST",
      headers: {
        origin: "http://localhost:3001",
        "content-type": "application/json",
      },
      body: "not json",
    });
    expect((await proxyEvidence(malformed, id, "add")).status).toBe(400);
    expect(proxy).not.toHaveBeenCalled();
  });
  it("passes validated Add metadata with requestId and abort signal", async () => {
    const request = req(body);
    await proxyEvidence(request, id, "add");
    expect(proxy).toHaveBeenCalledWith(
      `/compliance/controls/${id}/evidence`,
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(body),
        signal: request.signal,
      }),
    );
  });
  it("passes only the selected ID and reason for Link", async () => {
    const link = {
      evidenceId: id,
      reason: "Supports the administrative MFA control",
    };
    await proxyEvidence(req(link), id, "link");
    expect(proxy).toHaveBeenCalledWith(
      `/compliance/controls/${id}/evidence-links`,
      expect.objectContaining({ method: "POST", body: JSON.stringify(link) }),
    );
  });
  it("bounds search and defaults pagination at ten", async () => {
    const request = new Request(
      `http://localhost:3001/api/${id}?view=available&q=MFA`,
    );
    await proxyEvidence(request, id, "list");
    expect(proxy).toHaveBeenCalledWith(
      `/compliance/controls/${id}/evidence?q=MFA&view=available&page=1&limit=10`,
      { signal: request.signal },
    );
    proxy.mockClear();
    expect(
      (
        await proxyEvidence(
          new Request(`http://localhost:3001/api/${id}?limit=11`),
          id,
          "list",
        )
      ).status,
    ).toBe(400);
    expect(proxy).not.toHaveBeenCalled();
  });
});
