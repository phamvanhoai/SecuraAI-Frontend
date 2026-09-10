import { afterEach, describe, expect, it, vi } from "vitest";
import { createAsset } from "./create-asset";

afterEach(() => vi.unstubAllGlobals());

describe("createAsset", () => {
  it("posts to the same-origin BFF and validates the created asset", async () => {
    const created = {
      id: "00000000-0000-4000-8000-000000000001",
      assetCode: "AST-002",
      name: "Server",
      assetType: "server",
      criticality: "medium",
      status: "active",
      location: null,
      department: null,
      owner: null,
      updatedAt: "2026-09-10T00:00:00.000Z",
      description: null,
      hostname: null,
      ipAddress: null,
      createdAt: "2026-09-10T00:00:00.000Z",
    };
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: created }), {
        status: 201,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      createAsset({
        assetCode: "AST-002",
        name: "Server",
        assetType: "server",
        criticality: "medium",
        description: undefined,
        hostname: undefined,
        location: undefined,
      }),
    ).resolves.toEqual(created);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/assets",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          assetCode: "AST-002",
          name: "Server",
          assetType: "server",
          criticality: "medium",
        }),
      }),
    );
  });

  it("propagates backend business errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            success: false,
            error: {
              code: "ASSET_CODE_EXISTS",
              message: "Asset code already exists",
            },
          }),
          { status: 409 },
        ),
      ),
    );
    await expect(
      createAsset({
        assetCode: "AST-002",
        name: "Server",
        assetType: "server",
        criticality: "medium",
        description: undefined,
        hostname: undefined,
        location: undefined,
      }),
    ).rejects.toMatchObject({
      status: 409,
      code: "CONFLICT",
      message: "Asset code already exists",
    });
  });
});
