import { describe, expect, it } from "vitest";

import {
  completionCampaignDetailSchema,
  completionCampaignListSchema,
} from "./completion-schema";

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

  it("accepts lesson and final assessment progress in campaign details", () => {
    const result = completionCampaignDetailSchema.safeParse({
      campaign: {
        id: "6c28fbc0-53d1-4f26-8db5-e2dc198a32d1",
        title: "September awareness",
        courseTitle: "Recognize phishing",
        startDate: "2026-09-01T00:00:00.000Z",
        dueDate: "2026-09-30T00:00:00.000Z",
        requiredLessonCount: 2,
        hasFinalAssessment: true,
      },
      summary: {
        assigned: 1,
        completed: 0,
        inProgress: 1,
        notStarted: 0,
        overdue: 0,
        withdrawn: 0,
        completionRate: 0,
        averageProgress: 50,
      },
      items: [
        {
          id: "7b2ce479-ef23-44f2-b9d0-a3cc83c4ff4d",
          user: {
            id: "c6ab2179-b422-4c50-b530-657bc8fe328c",
            name: "Alex Morgan",
            email: "alex@example.com",
            employeeCode: "EMP-001",
          },
          status: "in_progress",
          progressPercent: 50,
          requiredLessons: { completed: 1, total: 2 },
          finalAssessment: {
            required: true,
            passed: false,
            latestScore: 60,
            lastSubmittedAt: "2026-09-15T00:00:00.000Z",
          },
          startedAt: "2026-09-10T00:00:00.000Z",
          completedAt: null,
          lastAccessedAt: "2026-09-15T00:00:00.000Z",
          certificateNumber: null,
        },
      ],
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
    });

    expect(result.success).toBe(true);
  });
});
