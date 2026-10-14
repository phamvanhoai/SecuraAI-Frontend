import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ cookieGet: vi.fn(), refresh: vi.fn(), setCookies: vi.fn(), clearCookies: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: mocks.cookieGet }) }));
vi.mock("@/lib/auth/auth-cookies", () => ({ authCookieNames: { access: "access", refresh: "refresh" }, setAuthCookies: mocks.setCookies, clearAuthCookies: mocks.clearCookies }));
vi.mock("@/lib/auth/backend-auth", () => ({ requestTokenPair: mocks.refresh }));
vi.mock("@/lib/env", () => ({ env: { NEXT_PUBLIC_API_BASE_URL: "http://backend.test/api/v1" } }));
import { DELETE } from "./route";
const id = "00000000-0000-4000-8000-000000000001";
const context = () => ({ params: Promise.resolve({ assetId: id }) });
const request = (body: unknown) => new Request(`http://frontend.test/api/assets/${id}`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
beforeEach(() => {
  vi.restoreAllMocks(); vi.clearAllMocks();
  mocks.cookieGet.mockImplementation((name: string) => name === "access" ? { value: "token" } : undefined);
});
describe("archive BFF", () => {
  it.each([{}, { reason: " " }, { reason: "Retired", archivedBy: id }])("rejects invalid/forged metadata %j", async (body) => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    expect((await DELETE(request(body), context())).status).toBe(422);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("forwards only normalized reason with server-side authentication", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 204 }));
    expect((await DELETE(request({ reason: " Retired " }), context())).status).toBe(204);
    expect(fetchMock.mock.calls[0]?.[0].toString()).toBe(`http://backend.test/api/v1/assets/${id}`);
    expect(fetchMock).toHaveBeenCalledWith(expect.any(URL), expect.objectContaining({ method: "DELETE", body: JSON.stringify({ reason: "Retired" }), headers: expect.objectContaining({ Authorization: "Bearer token", "Content-Type": "application/json" }) }));
  });
  it("requires authentication", async () => {
    mocks.cookieGet.mockReturnValue(undefined);
    const fetchMock = vi.spyOn(globalThis, "fetch");
    expect((await DELETE(request({ reason: "Retired" }), context())).status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
