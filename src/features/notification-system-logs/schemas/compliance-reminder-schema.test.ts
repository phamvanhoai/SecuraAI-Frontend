import { describe, expect, it } from "vitest";
import { complianceReminderListSchema } from "./compliance-reminder-schema";
describe("complianceReminderListSchema", () => {
  it("accepts a compliance reminder page", () => {
    const result = complianceReminderListSchema.parse({
      items: [
        {
          notificationId: "11111111-1111-4111-8111-111111111111",
          enrollmentId: null,
          entityId: "22222222-2222-4222-8222-222222222222",
          kind: "control_review",
          title: "Review due",
          message: "Review A.5.1",
          isRead: false,
          readAt: null,
          createdAt: "2026-09-17T00:00:00.000Z",
        },
      ],
      pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
    });
    expect(result.items[0]?.kind).toBe("control_review");
  });
});
