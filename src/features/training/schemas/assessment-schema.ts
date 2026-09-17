import { z } from "zod";

const assessmentSummarySchema = z.object({
  id: z.uuid(),
  title: z.string(),
  passingScore: z.number().min(0).max(100),
  maxAttempts: z.number().int().min(1),
  attemptsUsed: z.number().int().min(0),
  latestScore: z.number().min(0).max(100).nullable(),
  passed: z.boolean(),
  lastSubmittedAt: z.iso.datetime({ offset: true }).nullable(),
  availability: z.enum([
    "available",
    "upcoming",
    "overdue",
    "passed",
    "attempts_exhausted",
  ]),
});

export const assignedAssessmentSchema = z.object({
  enrollmentId: z.uuid(),
  courseTitle: z.string(),
  courseDescription: z.string().nullable(),
  campaignTitle: z.string(),
  startDate: z.iso.datetime({ offset: true }),
  dueDate: z.iso.datetime({ offset: true }),
  enrollmentStatus: z.string(),
  progressPercent: z.number().int().min(0).max(100),
  assessment: assessmentSummarySchema,
});

export const assignedAssessmentListSchema = z.object({
  items: z.array(assignedAssessmentSchema),
  pagination: z.object({
    page: z.number().int().min(1),
    limit: z.number().int().min(1).max(50),
    total: z.number().int().min(0),
    totalPages: z.number().int().min(0),
  }),
});

export const assessmentDetailSchema = z.object({
  enrollmentId: z.uuid(),
  courseTitle: z.string(),
  campaignTitle: z.string(),
  dueDate: z.iso.datetime({ offset: true }),
  assessment: z.object({
    id: z.uuid(),
    title: z.string(),
    passingScore: z.number().min(0).max(100),
    maxAttempts: z.number().int().min(1),
    attemptsUsed: z.number().int().min(0),
    availability: z.enum([
      "available",
      "upcoming",
      "overdue",
      "passed",
      "attempts_exhausted",
    ]),
    attempts: z.array(
      z.object({
        id: z.uuid(),
        score: z.number().min(0).max(100).nullable(),
        passed: z.boolean(),
        submittedAt: z.iso.datetime({ offset: true }).nullable(),
      }),
    ),
    questions: z.array(
      z.object({
        id: z.uuid(),
        text: z.string(),
        type: z.string(),
        points: z.number().min(0),
        options: z.array(z.object({ id: z.uuid(), text: z.string() })).min(1),
      }),
    ),
  }),
});

export const assessmentSubmissionSchema = z.object({
  attemptId: z.uuid(),
  score: z.number().min(0).max(100),
  passed: z.boolean(),
  submittedAt: z.iso.datetime({ offset: true }),
  passingScore: z.number().min(0).max(100),
  attemptsUsed: z.number().int().min(1),
  maxAttempts: z.number().int().min(1),
  correctCount: z.number().int().min(0),
  totalQuestions: z.number().int().min(1),
});

export type AssignedAssessment = z.infer<typeof assignedAssessmentSchema>;
export type AssessmentDetail = z.infer<typeof assessmentDetailSchema>;
export type AssessmentSubmission = z.infer<typeof assessmentSubmissionSchema>;
export type AssessmentAnswer = { questionId: string; optionIds: string[] };
