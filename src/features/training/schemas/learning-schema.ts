import { z } from "zod";
const pagination = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  totalPages: z.number(),
});
export const learningListSchema = z.object({
  items: z.array(
    z.object({
      id: z.uuid(),
      status: z.string(),
      progressPercent: z.number(),
      startedAt: z.string().nullable(),
      completedAt: z.string().nullable(),
      campaignTitle: z.string(),
      startDate: z.string(),
      dueDate: z.string(),
      course: z.object({
        title: z.string(),
        description: z.string().nullable(),
      }),
    }),
  ),
  pagination,
});
const assessment = z.object({
  id: z.uuid(),
  title: z.string(),
  passed: z.boolean(),
});
export const learningDetailSchema = z.object({
  id: z.uuid(),
  status: z.string(),
  progressPercent: z.number(),
  campaignTitle: z.string(),
  startDate: z.string(),
  dueDate: z.string(),
  course: z.object({
    id: z.uuid(),
    title: z.string(),
    description: z.string().nullable(),
    objectives: z.string(),
    finalAssessment: assessment.nullable(),
    lessons: z.array(
      z.object({
        id: z.uuid(),
        title: z.string(),
        description: z.string().nullable(),
        order: z.number(),
        required: z.boolean(),
        status: z.string(),
        assessment: assessment.nullable(),
        materials: z.array(
          z.object({
            id: z.uuid(),
            title: z.string(),
            type: z.string(),
            content: z.string().nullable(),
            externalUrl: z.string().nullable(),
            file: z
              .object({
                name: z.string(),
                mimeType: z.string(),
                sizeBytes: z.number(),
              })
              .nullable(),
          }),
        ),
      }),
    ),
  }),
});
export const lessonCompletionSchema = z.object({
  kind: z.literal("completed"),
  progress: z.number(),
  courseCompleted: z.boolean(),
});
export type LearningItem = z.infer<typeof learningListSchema>["items"][number];
