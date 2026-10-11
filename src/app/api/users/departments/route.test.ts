import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api/backend-proxy", () => ({
  proxyAuthenticatedRequest: vi.fn(),
}));

import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";
import { GET } from "./route";

describe("GET /api/users/departments", () => {
  beforeEach(() => vi.clearAllMocks());

  it("proxies the authenticated request to the backend department endpoint", async () => {
    const response = new Response(null, { status: 200 });
    vi.mocked(proxyAuthenticatedRequest).mockResolvedValue(response);

    await expect(GET()).resolves.toBe(response);
    expect(proxyAuthenticatedRequest).toHaveBeenCalledWith("/users/departments");
  });
});
