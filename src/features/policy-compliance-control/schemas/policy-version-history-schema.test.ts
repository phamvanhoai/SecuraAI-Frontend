import { describe, expect, it } from "vitest";
import { policyVersionHistoryListSchema } from "./policy-version-history-schema";

describe("policyVersionHistoryListSchema", () => {
  it("accepts a backend version-history page", () => {
    const parsed = policyVersionHistoryListSchema.parse({
      canViewDrafts: false,
      items: [
        {
          policyId: "11111111-1111-4111-8111-111111111111",
          policyCode: "ISP-001",
          title: "Policy",
          description: null,
          versionId: "22222222-2222-4222-8222-222222222222",
          versionNumber: "1.0",
          changeSummary: null,
          status: "published",
          effectiveDate: null,
          createdAt: "2026-09-17T00:00:00.000Z",
          publishedAt: null,
          createdBy: null,
          publishedBy: null,
        },
      ],
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
    });
    expect(parsed.items[0]?.policyCode).toBe("ISP-001");
  });
});
