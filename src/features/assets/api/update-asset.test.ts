import { afterEach, describe, expect, it, vi } from "vitest";
import { updateAsset } from "./update-asset";

afterEach(() => vi.restoreAllMocks());

describe("updateAsset", () => {
  it("sends PATCH through the same-origin BFF and validates the response", async () => {
    const data = {
      id: "00000000-0000-4000-8000-000000000001",
      assetCode: "AST-001",
      name: "Updated Server",
      assetType: "server",
      criticality: "medium",
      status: "active",
      location: "New Server Room",
      department: null,
      owner: null,
      updatedAt: "2026-09-10T09:00:00.000Z",
      description: null,
      hostname: "fe-test-server-02",
      ipAddress: "192.168.1.51",
      createdAt: "2026-09-10T08:00:00.000Z",
    };
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ success: true, data }), { status: 200 }),
    );

    const result = await updateAsset(data.id, {
      name: data.name,
      assetType: data.assetType,
      description: null,
      hostname: data.hostname,
      ipAddress: data.ipAddress,
      location: data.location,
      status: "active",
    });

    expect(result.name).toBe("Updated Server");
    expect(fetchMock).toHaveBeenCalledWith(
      `/api/assets/${data.id}`,
      expect.objectContaining({ method: "PATCH", credentials: "include" }),
    );
  });
});
