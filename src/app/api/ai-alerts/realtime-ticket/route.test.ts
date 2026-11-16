import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api/backend-proxy", () => ({
  proxyAuthenticatedRequest: vi.fn(),
}));

import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";
import { POST } from "./route";

describe("AI alert realtime ticket BFF route", () => {
  beforeEach(() => vi.resetAllMocks());

  it("forwards ticket creation through the authenticated backend proxy", async () => {
    const response = Response.json({
      success: true,
      data: { ticket: "ticket" },
    });
    vi.mocked(proxyAuthenticatedRequest).mockResolvedValue(response);

    await expect(POST()).resolves.toBe(response);
    expect(proxyAuthenticatedRequest).toHaveBeenCalledWith(
      "/ai-alerts/realtime-ticket",
      { method: "POST" },
    );
  });
});
