import { beforeEach, expect, it, vi } from "vitest";
const proxy = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api/backend-proxy", () => ({ proxyAuthenticatedRequest: proxy }));
import { GET } from "./route";
const id = "00000000-0000-4000-8000-000000000001";
const context = (assetId = id) => ({ params: Promise.resolve({ assetId }) });
beforeEach(() => { vi.clearAllMocks(); proxy.mockResolvedValue(Response.json({ success: true, data: { items: [] } })); });
it("forwards scoped search with private caching", async () => {
 const request = new Request("http://localhost/api/assets/" + id + "/dependency-options?q=Server");
 const response = await GET(request, context());
 expect(proxy).toHaveBeenCalledWith(`/assets/${id}/dependency-options?q=Server`, { signal: request.signal });
 expect(response.headers.get("Cache-Control")).toBe("private, no-store");
});
it.each(["q=" + "x".repeat(101), "actorId=forged"])("rejects invalid query %s", async query => {
 expect((await GET(new Request(`http://localhost/api/assets/${id}/dependency-options?${query}`), context())).status).toBe(422);
 expect(proxy).not.toHaveBeenCalled();
});
it("rejects invalid asset ID", async () => {
 expect((await GET(new Request("http://localhost/api/assets/bad/dependency-options"), context("bad"))).status).toBe(422);
 expect(proxy).not.toHaveBeenCalled();
});
