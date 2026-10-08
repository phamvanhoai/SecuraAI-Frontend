import { describe, expect, it } from "vitest";
import { userActivityAuditResponseSchema } from "./user-activity-audit-schema";

describe("user activity audit contract", () => {
  it("accepts a paginated safe audit record", () => {
    expect(
      userActivityAuditResponseSchema.safeParse({
        items: [
          {
            id: "00000000-0000-4000-8000-000000000001",
            actor: { id: null, name: "Unknown user", email: null },
            action: "USER_UPDATED",
            resource: { type: "USER", id: null },
            occurredAt: "2026-10-08T08:00:00.000Z",
            outcome: "SUCCESS",
            source: "API",
            sourceIp: null,
            errorCode: null,
          },
        ],
        pagination: { page: 1, limit: 20, total: 1, pageCount: 1 },
      }).success,
    ).toBe(true);
  });
});
