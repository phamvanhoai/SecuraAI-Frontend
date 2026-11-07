import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("@/lib/api/backend-proxy", () => ({
  proxyAuthenticatedRequest: vi.fn(),
}));
import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";
import { POST } from "./route";

const id = "9fca888f-1dfc-448a-b9b7-98d7065892e3";
beforeEach(() => vi.clearAllMocks());

describe("evidence upload origin", () => {
  it("accepts browser origin when standalone uses an internal request hostname", async () => {
    vi.mocked(proxyAuthenticatedRequest).mockResolvedValue(
      Response.json({ success: true }),
    );
    const request = new Request(
      `http://0.0.0.0:3001/api/compliance/controls/${id}/evidence-files`,
      {
        method: "POST",
        headers: {
          host: "localhost:3001",
          origin: "http://localhost:3001",
          "content-type": "multipart/form-data; boundary=test",
        },
        body: "test",
      },
    );
    expect(
      (await POST(request, { params: Promise.resolve({ controlId: id }) }))
        .status,
    ).toBe(200);
    expect(proxyAuthenticatedRequest).toHaveBeenCalledOnce();
  });
  it.each([
    { origin: "http://evil.example" },
    { origin: "http://localhost:3002" },
    { origin: "https://localhost:3001" },
    { origin: "http://localhost:3001", "sec-fetch-site": "cross-site" },
    {},
  ])("rejects mismatched or missing origins %j", async (headers) => {
    const request = new Request(
      `http://0.0.0.0:3001/api/compliance/controls/${id}/evidence-files`,
      {
        method: "POST",
        headers: { host: "localhost:3001", ...headers },
      },
    );
    expect(
      (await POST(request, { params: Promise.resolve({ controlId: id }) }))
        .status,
    ).toBe(403);
    expect(proxyAuthenticatedRequest).not.toHaveBeenCalled();
  });
});
