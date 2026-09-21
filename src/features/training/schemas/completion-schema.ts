import { z } from "zod";

export const completionCampaignSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  courseTitle: z.string(),
  startDate: z.iso.datetime({ offset: true }),
  dueDate: z.iso.datetime({ offset: true }),
  status: z.enum(["upcoming", "active", "ended"]),
  assigned: z.number().int().min(0),
  completed: z.number().int().min(0),
  inProgress: z.number().int().min(0),
  notStarted: z.number().int().min(0),
  overdue: z.number().int().min(0),
  completionRate: z.number().int().min(0).max(100),
  averageProgress: z.number().int().min(0).max(100),
});

const paginationSchema = z.object({
  page: z.number().int().min(1),
  limit: z.number().int().min(1),
  total: z.number().int().min(0),
  totalPages: z.number().int().min(0),
});

export const completionCampaignListSchema = z.object({
  items: z.array(completionCampaignSchema),
  pagination: paginationSchema,
});

export const completionCampaignDetailSchema = z.object({
  campaign: z.object({
    id: z.uuid(),
    title: z.string(),
    courseTitle: z.string(),
    startDate: z.iso.datetime({ offset: true }),
    dueDate: z.iso.datetime({ offset: true }),
    requiredLessonCount: z.number().int().min(0),
    hasFinalAssessment: z.boolean(),
  }),
  summary: z.object({
    assigned: z.number().int().min(0),
    completed: z.number().int().min(0),
    inProgress: z.number().int().min(0),
    notStarted: z.number().int().min(0),
    overdue: z.number().int().min(0),
    withdrawn: z.number().int().min(0),
    completionRate: z.number().int().min(0).max(100),
    averageProgress: z.number().int().min(0).max(100),
  }),
  items: z.array(
    z.object({
      id: z.uuid(),
      user: z.object({
        id: z.uuid(),
        name: z.string(),
        email: z.email(),
        employeeCode: z.string().nullable(),
      }),
      status: z.enum([
        "assigned",
        "in_progress",
        "completed",
        "overdue",
        "withdrawn",
      ]),
      progressPercent: z.number().int().min(0).max(100),
      requiredLessons: z.object({
        completed: z.number().int().min(0),
        total: z.number().int().min(0),
      }),
      finalAssessment: z.object({
        required: z.boolean(),
        passed: z.boolean(),
        latestScore: z.number().min(0).max(100).nullable(),
        lastSubmittedAt: z.iso.datetime({ offset: true }).nullable(),
      }),
      startedAt: z.iso.datetime({ offset: true }).nullable(),
      completedAt: z.iso.datetime({ offset: true }).nullable(),
      lastAccessedAt: z.iso.datetime({ offset: true }).nullable(),
      certificateNumber: z.string().nullable(),
    }),
  ),
  pagination: paginationSchema,
});

export type CompletionCampaign = z.infer<typeof completionCampaignSchema>;
export type CompletionStatus =
  "all" | "assigned" | "in_progress" | "completed" | "overdue" | "withdrawn";
