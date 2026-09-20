import { describe, expect, it } from "vitest";
import {
  assignCourseSchema,
  courseDraftDetailSchema,
  createCourseSchema,
  updateCourseDraftSchema,
} from "./course-schema";

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
            type: "single_choice" as const,
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
  it("accepts multiple-answer questions with at least two correct options", () => {
    const result = createCourseSchema.safeParse({
      title: "Password security",
      description: "",
      content: "Learn how to protect corporate accounts.",
      status: "published",
      assessment: {
        title: "Password security assessment",
        passingScore: 80,
        maxAttempts: 3,
        questions: [
          {
            type: "multiple_choice",
            text: "Which practices protect an account?",
            options: [
              { text: "Use MFA", isCorrect: true },
              { text: "Use a password manager", isCorrect: true },
              { text: "Reuse passwords", isCorrect: false },
            ],
          },
        ],
      },
    });
    expect(result.success).toBe(true);
  });
});

describe("updateCourseDraftSchema", () => {
  it("accepts editable draft fields without a status transition", () => {
    expect(
      updateCourseDraftSchema.safeParse({
        title: "Updated phishing basics",
        description: "Updated course",
        content: "Updated learning objectives and training material.",
      }).success,
    ).toBe(true);
  });

  it("loads a legacy multiple-choice draft so its invalid answers can be corrected", () => {
    const result = courseDraftDetailSchema.safeParse({
      id: "17afbe84-38a1-409e-846c-b3f4f3b3cced",
      title: "TEST",
      description: null,
      content: "Course content",
      status: "draft",
      createdByUserId: "141f5699-9b20-42aa-8c7f-6e887565e9d5",
      createdAt: "2026-09-17T16:26:35.391Z",
      updatedAt: "2026-09-17T16:26:35.391Z",
      assessment: {
        title: "Post-training assessment",
        passingScore: 80,
        maxAttempts: 3,
        questions: [
          {
            type: "multiple_choice",
            text: "1 + 1 =",
            options: [
              { text: "3", isCorrect: true },
              { text: "2", isCorrect: false },
            ],
          },
        ],
      },
    });

    expect(result.success).toBe(true);
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
