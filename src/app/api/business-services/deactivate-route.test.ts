import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("@/lib/api/backend-proxy", () => ({
  proxyAuthenticatedRequest: vi.fn(),
}));
import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";
import { POST } from "./[serviceId]/deactivate/route";
import { GET } from "./[serviceId]/deactivation-check/route";
const id = "00000000-0000-4000-8000-000000000001";
const context = { params: Promise.resolve({ serviceId: id }) };
const input = {
  expectedUpdatedAt: "2026-10-07T00:00:00Z",
  confirmationName: " Support ",
  reason: " Retired ",
};
const request = (body: unknown, origin = "http://localhost") =>
  new Request(`http://localhost/api/business-services/${id}/deactivate`, {
    method: "POST",
    headers: { origin },
    body: JSON.stringify(body),
  });
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(proxyAuthenticatedRequest).mockResolvedValue(
    Response.json({ success: true }),
  );
});
describe("Deactivate BFF", () => {
  it("forwards validated input and abort signal", async () => {
    const req = request(input);
    await POST(req, context);
    expect(proxyAuthenticatedRequest).toHaveBeenCalledWith(
      `/business-services/${id}/deactivate`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...input,
          confirmationName: "Support",
          reason: "Retired",
        }),
        signal: req.signal,
      },
    );
  });
  it.each(["http://evil.test", ""])(
    "rejects foreign/missing Origin %s",
    async (origin) => {
      expect((await POST(request(input, origin), context)).status).toBe(403);
      expect(proxyAuthenticatedRequest).not.toHaveBeenCalled();
    },
  );
  it.each([
    { ...input, status: "inactive" },
    { ...input, reason: " " },
    { ...input, expectedUpdatedAt: "today" },
  ])("rejects invalid body %j", async (body) => {
    expect((await POST(request(body), context)).status).toBe(422);
    expect(proxyAuthenticatedRequest).not.toHaveBeenCalled();
  });
  it("rejects malformed JSON and invalid UUID", async () => {
    expect(
      (
        await POST(
          new Request("http://localhost", {
            method: "POST",
            headers: { origin: "http://localhost" },
            body: "{",
          }),
          context,
        )
      ).status,
    ).toBe(422);
    expect(
      (
        await POST(request(input), {
          params: Promise.resolve({ serviceId: "bad" }),
        })
      ).status,
    ).toBe(422);
    expect(
      (
        await GET(new Request("http://localhost"), {
          params: Promise.resolve({ serviceId: "bad" }),
        })
      ).status,
    ).toBe(422);
    expect(proxyAuthenticatedRequest).not.toHaveBeenCalled();
  });
  it("forwards readonly check", async () => {
    const req = new Request("http://localhost");
    await GET(req, context);
    expect(proxyAuthenticatedRequest).toHaveBeenCalledWith(
      `/business-services/${id}/deactivation-check`,
      { signal: req.signal },
    );
  });
});
