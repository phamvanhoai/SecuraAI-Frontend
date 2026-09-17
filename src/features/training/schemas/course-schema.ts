import { z } from "zod";

const assessmentQuestionSchema = z
  .object({
    type: z.enum(["single_choice", "multiple_choice"]),
    text: z.string().trim().min(3, "Enter the question.").max(2000),
    options: z
      .array(
        z.object({
          text: z.string().trim().min(1, "Enter the answer.").max(1000),
          isCorrect: z.boolean(),
        }),
      )
      .min(2)
      .max(6),
  })
  .superRefine((value, context) => {
    const correctAnswers = value.options.filter(
      (option) => option.isCorrect,
    ).length;
    const valid =
      value.type === "single_choice"
        ? correctAnswers === 1
        : correctAnswers >= 2;
    if (!valid) {
      context.addIssue({
        code: "custom",
        path: ["options"],
        message:
          value.type === "single_choice"
            ? "Select exactly one correct answer."
            : "Select at least two correct answers.",
      });
    }
  });

export const createCourseSchema = z
  .object({
    title: z.string().trim().min(3, "Enter at least 3 characters.").max(255),
    description: z.string().trim().max(2000),
    content: z
      .string()
      .trim()
      .min(10, "Enter at least 10 characters.")
      .max(50000),
    status: z.enum(["draft", "published"]),
    assessment: z
      .object({
        title: z
          .string()
          .trim()
          .min(3, "Enter at least 3 characters.")
          .max(255),
        passingScore: z.number().min(0).max(100),
        maxAttempts: z.number().int().min(1).max(10),
        questions: z.array(assessmentQuestionSchema).min(1).max(50),
      })
      .optional(),
  })
  .superRefine((value, context) => {
    if (value.status === "published" && !value.assessment) {
      context.addIssue({
        code: "custom",
        path: ["assessment"],
        message: "A published course requires an assessment.",
      });
    }
  });

export const courseSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  description: z.string().nullable(),
  content: z.string().nullable(),
  status: z.enum(["draft", "published", "archived"]),
  createdByUserId: z.uuid().nullable(),
  createdAt: z.iso.datetime({ offset: true }),
  updatedAt: z.iso.datetime({ offset: true }),
});

export const courseListSchema = z.object({
  items: z.array(courseSchema),
  pagination: z.object({
    page: z.number().int().min(1),
    limit: z.number().int().min(1).max(100),
    total: z.number().int().min(0),
    totalPages: z.number().int().min(0),
  }),
});

export const assignmentOptionsSchema = z.object({
  users: z.array(
    z.object({
      id: z.uuid(),
      name: z.string(),
      email: z.email(),
      departmentId: z.uuid().nullable(),
    }),
  ),
  departments: z.array(
    z.object({ id: z.uuid(), code: z.string(), name: z.string() }),
  ),
  hasMore: z.object({ users: z.boolean(), departments: z.boolean() }),
});

export const assignCourseSchema = z
  .object({
    title: z.string().trim().min(3, "Enter at least 3 characters.").max(255),
    startDate: z.iso.date(),
    dueDate: z.iso.date(),
    userIds: z.array(z.uuid()).max(200),
    departmentIds: z.array(z.uuid()).max(200),
    changeReason: z.string().trim().max(500).optional(),
  })
  .superRefine((value, context) => {
    if (
      value.userIds.length === 0 &&
      value.departmentIds.length === 0 &&
      !value.changeReason?.trim()
    ) {
      context.addIssue({
        code: "custom",
        path: ["userIds"],
        message: "Select at least one user or department.",
      });
    }
    if (value.dueDate < value.startDate) {
      context.addIssue({
        code: "custom",
        path: ["dueDate"],
        message: "Due date must be on or after the start date.",
      });
    }
  });

export const courseAssignmentSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  startDate: z.iso.datetime({ offset: true }),
  dueDate: z.iso.datetime({ offset: true }),
  enrollmentCount: z.number().int().min(0),
  removedCount: z.number().int().min(0),
  retainedStartedCount: z.number().int().min(0),
  retainedCompletedCount: z.number().int().min(0),
  createdAt: z.iso.datetime({ offset: true }),
});

export const courseAssignmentDetailSchema = z
  .object({
    id: z.uuid(),
    title: z.string(),
    startDate: z.iso.datetime({ offset: true }),
    dueDate: z.iso.datetime({ offset: true }),
    userIds: z.array(z.uuid()),
    departmentIds: z.array(z.uuid()),
  })
  .nullable();

export type Course = z.infer<typeof courseSchema>;
export type CourseStatusFilter = "all" | "draft" | "published" | "archived";
export type CreateCourseInput = z.infer<typeof createCourseSchema>;
export type AssignmentOptions = z.infer<typeof assignmentOptionsSchema>;
export type AssignCourseInput = z.infer<typeof assignCourseSchema>;
