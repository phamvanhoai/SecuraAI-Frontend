import { describe, expect, it } from "vitest";
import { assignCourseSchema, createCourseSchema } from "./course-schema";

describe("createCourseSchema", () => {
  it("accepts a course draft", () => {
    expect(
      createCourseSchema.parse({
        title: "Phishing basics",
        description: "",
        content: "Learn to identify phishing emails.",
        status: "draft",
      }).title,
    ).toBe("Phishing basics");
  });
  it("rejects empty content", () => {
    expect(
      createCourseSchema.safeParse({
        title: "Phishing",
        description: "",
        content: " ",
        status: "draft",
      }).success,
    ).toBe(false);
  });
  it("validates the post-training assessment and its correct answer", () => {
    const course = {
      title: "Phishing basics",
      description: "",
      content: "Learn to identify phishing emails.",
      status: "published" as const,
      assessment: {
        title: "Phishing assessment",
        passingScore: 80,
        maxAttempts: 3,
        questions: [
          {
            text: "Which message is suspicious?",
            options: [
              { text: "Unexpected reset link", isCorrect: true },
              { text: "Expected notice", isCorrect: false },
            ],
          },
        ],
      },
    };
    expect(createCourseSchema.safeParse(course).success).toBe(true);
    course.assessment.questions[0]!.options[1]!.isCorrect = true;
    expect(createCourseSchema.safeParse(course).success).toBe(false);
  });
});

describe("assignCourseSchema", () => {
  it("accepts a department assignment with a valid date range", () => {
    expect(
      assignCourseSchema.safeParse({
        title: "Quarterly awareness",
        startDate: "2026-09-15",
        dueDate: "2026-09-30",
        userIds: [],
        departmentIds: ["e2ef8324-9ac0-4e7f-b16d-50050274a72e"],
      }).success,
    ).toBe(true);
  });

  it("rejects an empty target set and an inverted date range", () => {
    expect(
      assignCourseSchema.safeParse({
        title: "Quarterly awareness",
        startDate: "2026-09-30",
        dueDate: "2026-09-15",
        userIds: [],
        departmentIds: [],
      }).success,
    ).toBe(false);
  });
});
