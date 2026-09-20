import { describe, expect, it } from "vitest";
import {
  assignCourseSchema,
  courseDraftSchema,
  createCourseSchema,
} from "./course-schema";

describe("courseDraftSchema", () => {
  it("accepts a draft with an existing private video for editing", () => {
    const result = courseDraftSchema.safeParse({
      id: "e2ef8324-9ac0-4e7f-b16d-50050274a72e",
      title: "Security basics",
      description: null,
      content: "Learn safe daily practices.",
      status: "draft",
      updatedAt: "2026-09-19T08:00:00.000Z",
      lessons: [
        {
          title: "Passwords",
          isRequired: true,
          materials: [
            {
              title: "Video guide",
              type: "video",
              existingFileId: "8aa86891-5d1d-4053-9859-2934f886476e",
              existingFile: {
                name: "guide.mp4",
                mimeType: "video/mp4",
                sizeBytes: 100,
              },
            },
          ],
        },
      ],
      assessment: null,
    });
    expect(result.success).toBe(true);
  });
});

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
