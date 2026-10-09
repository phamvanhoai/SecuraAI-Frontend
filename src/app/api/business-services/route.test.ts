import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("@/lib/api/backend-proxy", () => ({
  proxyAuthenticatedRequest: vi.fn(),
}));
import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";
import { GET, POST } from "./route";
import { GET as detail } from "./[serviceId]/route";
import { PATCH } from "./[serviceId]/route";
import { GET as assets } from "./[serviceId]/assets/route";
const id = "00000000-0000-4000-8000-000000000001";
describe("Business service BFF read routes", () => {
  it("protects and validates PATCH before forwarding", async () => {
    const context = { params: Promise.resolve({ serviceId: id }) };
    const body = {
      name: " Updated ",
      expectedUpdatedAt: "2026-10-07T00:00:00.000Z",
    };
    expect(
      (
        await PATCH(
          new Request("http://localhost/api/business-services", {
            method: "PATCH",
            headers: { origin: "http://evil.test" },
            body: JSON.stringify(body),
          }),
          context,
        )
      ).status,
    ).toBe(403);
    expect(
      (
        await PATCH(
          new Request("http://localhost/api/business-services", {
            method: "PATCH",
            headers: { origin: "http://localhost" },
            body: JSON.stringify({ ...body, status: "inactive" }),
          }),
          context,
        )
      ).status,
    ).toBe(422);
    expect(proxyAuthenticatedRequest).not.toHaveBeenCalled();
    const request = new Request("http://localhost/api/business-services", {
      method: "PATCH",
      headers: { origin: "http://localhost" },
      body: JSON.stringify(body),
    });
    await PATCH(request, context);
    expect(proxyAuthenticatedRequest).toHaveBeenCalledWith(
      `/business-services/${id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Updated",
          expectedUpdatedAt: body.expectedUpdatedAt,
        }),
        signal: request.signal,
      },
    );
  });
  it("rejects cross-origin or malformed creates without forwarding", async () => {
    expect(
      (
        await POST(
          new Request("http://localhost/api/business-services", {
            method: "POST",
            headers: { origin: "http://evil.test" },
            body: JSON.stringify({ name: "Support" }),
          }),
        )
      ).status,
    ).toBe(403);
    expect(
      (
        await POST(
          new Request("http://localhost/api/business-services", {
            method: "POST",
            headers: { origin: "http://localhost" },
            body: "not-json",
          }),
        )
      ).status,
    ).toBe(422);
    expect(
      (
        await POST(
          new Request("http://localhost/api/business-services", {
            method: "POST",
            headers: { origin: "http://localhost" },
            body: JSON.stringify({ name: " " }),
          }),
        )
      ).status,
    ).toBe(422);
    expect(proxyAuthenticatedRequest).not.toHaveBeenCalled();
  });
  it("forwards only validated normalized create payload", async () => {
    const request = new Request("http://localhost/api/business-services", {
      method: "POST",
      headers: { origin: "http://localhost" },
      body: JSON.stringify({ name: " Support  Service ", ownerUserId: null }),
    });
    await POST(request);
    expect(proxyAuthenticatedRequest).toHaveBeenCalledWith(
      "/business-services",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Support Service", ownerUserId: null }),
        signal: request.signal,
      },
    );
  });
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(proxyAuthenticatedRequest).mockResolvedValue(
      new Response(null, { status: 200 }),
    );
  });
  it("encodes bounded filters and propagates cancellation", async () => {
    const request = new Request(
      "http://localhost/api/business-services?q=Support%20%26%20CRM&status=inactive",
    );
    await GET(request);
    expect(proxyAuthenticatedRequest).toHaveBeenCalledWith(
      "/business-services?page=1&limit=10&q=Support+%26+CRM&status=inactive",
      { signal: request.signal },
    );
  });
  it.each([
    "?limit=101",
    "?status=archived",
    "?q=%20",
    "?page=0",
    "?unsupported=yes",
  ])("rejects %s before proxy", async (query) => {
    expect(
      (await GET(new Request(`http://localhost/api/business-services${query}`)))
        .status,
    ).toBe(422);
    expect(proxyAuthenticatedRequest).not.toHaveBeenCalled();
  });
  it("validates detail ID", async () => {
    expect(
      (
        await detail(new Request("http://localhost"), {
          params: Promise.resolve({ serviceId: "invalid" }),
        })
      ).status,
    ).toBe(422);
    expect(proxyAuthenticatedRequest).not.toHaveBeenCalled();
  });
  it("proxies detail and linked assets without mutation", async () => {
    const request = new Request(
      "http://localhost/api/business-services?page=2",
    );
    await detail(request, { params: Promise.resolve({ serviceId: id }) });
    await assets(request, { params: Promise.resolve({ serviceId: id }) });
    expect(proxyAuthenticatedRequest).toHaveBeenCalledWith(
      `/business-services/${id}`,
      { signal: request.signal },
    );
    expect(proxyAuthenticatedRequest).toHaveBeenCalledWith(
      `/business-services/${id}/assets?page=2&limit=10`,
      { signal: request.signal },
    );
  });
  it("rejects unbounded linked assets", async () => {
    expect(
      (
        await assets(new Request("http://localhost?limit=101"), {
          params: Promise.resolve({ serviceId: id }),
        })
      ).status,
    ).toBe(422);
    expect(proxyAuthenticatedRequest).not.toHaveBeenCalled();
  });
});
