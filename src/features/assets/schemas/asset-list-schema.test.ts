import { describe, expect, it } from "vitest";
import {
  assetListQuerySchema,
  assetListResponseSchema,
} from "./asset-list-schema";

describe("asset list contracts", () => {
  it("normalizes query defaults and supported filters", () => {
    expect(
      assetListQuerySchema.parse({
        page: "2",
        q: " server ",
        status: "active",
      }),
    ).toEqual({
      page: 2,
      limit: 20,
      q: "server",
      status: "active",
      sortBy: "assetCode",
      sortOrder: "asc",
    });
  });

  it.each([
    { limit: "101" },
    { status: "deleted" },
    { criticality: "urgent" },
    { departmentId: "invalid" },
  ])("rejects invalid filters: %o", (query) =>
    expect(assetListQuerySchema.safeParse(query).success).toBe(false),
  );

  it("accepts the backend asset response and rejects leaked or malformed values", () => {
    const response = {
      items: [
        {
          id: "00000000-0000-4000-8000-000000000001",
          assetCode: "AST-001",
          name: "Server",
          assetType: "server",
          criticality: "medium",
          status: "active",
          location: null,
          department: null,
          owner: null,
          updatedAt: "2026-09-10T00:00:00.000Z",
        },
      ],
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
    };
    expect(assetListResponseSchema.safeParse(response).success).toBe(true);
    expect(
      assetListResponseSchema.safeParse({
        ...response,
        items: [{ ...response.items[0], status: "deleted" }],
      }).success,
    ).toBe(false);
  });
});
