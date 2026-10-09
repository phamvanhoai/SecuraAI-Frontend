import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const { proxy } = vi.hoisted(() => ({ proxy: vi.fn() }));
vi.mock("@/lib/api/backend-proxy", () => ({
  proxyAuthenticatedRequest: proxy,
}));
import {
  proxyControlWrite,
  proxyControlRead,
  proxyControlOwners,
} from "./control-catalog-proxy";
const body = {
  controlCode: "CTRL-MFA",
  name: "Administrator MFA",
  description: "Require MFA for privileged access",
  ownerUserId: null,
  applicability: "under_review",
  implementationStatus: "not_implemented",
};
const req = (data: unknown, origin = "http://localhost:3001") =>
  new Request("http://localhost:3001/api/compliance/controls", {
    method: "POST",
    headers: { origin, "content-type": "application/json" },
    body: JSON.stringify(data),
  });
beforeEach(() => {
  vi.clearAllMocks();
  proxy.mockResolvedValue(new Response("{}", { status: 201 }));
});
describe("Control catalog BFF", () => {
  it("rejects cross-origin writes without reaching BE", async () => {
    expect(
      (await proxyControlWrite(req(body, "https://other.example"))).status,
    ).toBe(403);
    expect(proxy).not.toHaveBeenCalled();
  });
  it("rejects missing Origin and unknown payload fields", async () => {
    const request = req(body);
    request.headers.delete("origin");
    expect((await proxyControlWrite(request)).status).toBe(403);
    expect(
      (await proxyControlWrite(req({ ...body, effectiveness: 100 }))).status,
    ).toBe(400);
  });
  it("forwards validated creation with cancellation and no credentials in JS", async () => {
    const request = req(body);
    await proxyControlWrite(request);
    expect(proxy).toHaveBeenCalledWith(
      "/compliance/controls",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(body),
        signal: request.signal,
      }),
    );
  });
  it("rejects invalid IDs and excessive owner search", async () => {
    expect(
      (await proxyControlRead(new Request("http://localhost/test"), "invalid"))
        .status,
    ).toBe(400);
    expect(
      (
        await proxyControlOwners(
          new Request(`http://localhost/test?q=${"a".repeat(101)}`),
        )
      ).status,
    ).toBe(400);
    expect(proxy).not.toHaveBeenCalled();
  });
});
