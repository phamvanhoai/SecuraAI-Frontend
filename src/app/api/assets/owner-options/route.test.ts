import { beforeEach, expect, it, vi } from "vitest";
const proxy = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api/backend-proxy", () => ({ proxyAuthenticatedRequest: proxy }));
import { GET } from "./route";
beforeEach(() => { vi.clearAllMocks(); proxy.mockResolvedValue(Response.json({ success: true, data: { items: [] } })); });
it("validates and forwards search with private caching", async () => {
  const request = new Request("http://localhost/api/assets/owner-options?q=owner%40");
  const response = await GET(request);
  expect(proxy).toHaveBeenCalledWith("/assets/owner-options?q=owner%40", { signal: request.signal });
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
});
it.each(["q=" + "x".repeat(101), "actorId=forged"])("rejects unsafe query %s", async (query) => {
  expect((await GET(new Request(`http://localhost/api/assets/owner-options?${query}`))).status).toBe(422);
  expect(proxy).not.toHaveBeenCalled();
});
