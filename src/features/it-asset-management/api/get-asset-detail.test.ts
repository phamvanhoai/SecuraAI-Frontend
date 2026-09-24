import { afterEach, describe, expect, it, vi } from "vitest";
import { getAssetDetail } from "./get-asset-detail";

afterEach(() => vi.restoreAllMocks());

describe("getAssetDetail", () => {
  it("loads and validates asset details through the same-origin BFF", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: {
            id: "00000000-0000-4000-8000-000000000001",
            assetCode: "AST-001",
            name: "Frontend Test Server",
            assetType: "server",
            criticality: "medium",
            status: "active",
            location: "Server Room",
            department: null,
            owner: null,
            updatedAt: "2026-09-10T08:30:00.000Z",
            description: "Test server",
            hostname: "fe-test-server",
            ipAddress: "192.168.1.50",
            createdAt: "2026-09-10T08:00:00.000Z",
          },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );

    const result = await getAssetDetail("00000000-0000-4000-8000-000000000001");

    expect(result.hostname).toBe("fe-test-server");
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/assets/00000000-0000-4000-8000-000000000001",
      expect.objectContaining({ method: "GET", credentials: "include" }),
    );
  });

  it("rejects an invalid backend contract", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: { id: "invalid" } }), {
        status: 200,
      }),
    );

    await expect(getAssetDetail("asset-1")).rejects.toMatchObject({ status: 502 });
  });
});
