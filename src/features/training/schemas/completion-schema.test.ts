import { describe, expect, it } from "vitest";

import { completionCampaignListSchema } from "./completion-schema";

describe("completionCampaignListSchema", () => {
  it("accepts a paginated completion summary", () => {
    const result = completionCampaignListSchema.safeParse({
      items: [
        {
          id: "6c28fbc0-53d1-4f26-8db5-e2dc198a32d1",
          title: "Phishing awareness",
          courseTitle: "Recognize phishing",
          startDate: "2026-09-01T00:00:00.000Z",
          dueDate: "2026-09-30T00:00:00.000Z",
          status: "active",
          assigned: 20,
          completed: 12,
          inProgress: 5,
          notStarted: 3,
          overdue: 0,
          completionRate: 60,
          averageProgress: 73,
        },
      ],
      pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
    });

    expect(result.success).toBe(true);
  });
});
