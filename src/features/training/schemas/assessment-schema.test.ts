import { describe, expect, it } from "vitest";
import { assessmentDetailSchema } from "./assessment-schema";

describe("assessmentDetailSchema", () => {
  it("accepts a backend assessment without requiring answer keys", () => {
    const result = assessmentDetailSchema.safeParse({
      enrollmentId: "25f1b839-abd4-4c68-8ca4-7ae422457729",
      courseTitle: "Phishing awareness",
      campaignTitle: "September training",
      dueDate: "2026-09-30T00:00:00.000Z",
      assessment: {
        id: "46881eea-4364-46d9-acf5-dd61314f0fa8",
        title: "Post-training assessment",
        passingScore: 80,
        maxAttempts: 2,
        attemptsUsed: 0,
        availability: "available",
        attempts: [],
        questions: [
          {
            id: "5ba7b932-11ed-4bb4-a813-1ba9e34a2f95",
            text: "Which link is safest?",
            type: "single_choice",
            points: 1,
            options: [
              {
                id: "e52400f2-87d5-456e-8efd-6e4d833068be",
                text: "The verified company portal",
              },
            ],
          },
        ],
      },
    });
    expect(result.success).toBe(true);
  });

  it("rejects assessments without selectable options", () => {
    const result = assessmentDetailSchema.safeParse({
      enrollmentId: "25f1b839-abd4-4c68-8ca4-7ae422457729",
      courseTitle: "Phishing awareness",
      campaignTitle: "September training",
      dueDate: "2026-09-30T00:00:00.000Z",
      assessment: {
        id: "46881eea-4364-46d9-acf5-dd61314f0fa8",
        title: "Post-training assessment",
        passingScore: 80,
        maxAttempts: 2,
        attemptsUsed: 0,
        availability: "available",
        attempts: [],
        questions: [
          {
            id: "5ba7b932-11ed-4bb4-a813-1ba9e34a2f95",
            text: "Which link is safest?",
            type: "single_choice",
            points: 1,
            options: [],
          },
        ],
      },
    });
    expect(result.success).toBe(false);
  });
});
