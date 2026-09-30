import { z } from "zod";
const assessment = z.object({
  id: z.uuid(),
  testMethod: z.string().nullable(),
  result: z
    .enum(["effective", "partially_effective", "ineffective"])
    .nullable(),
  effectiveness: z.number().nullable(),
  notes: z.string().nullable(),
  assessedAt: z.iso.datetime({ offset: true }),
  assessor: z.object({ id: z.uuid(), fullName: z.string() }),
});
export const controlAssessmentListSchema = z.object({
  items: z.array(
    z.object({
      id: z.uuid(),
      controlCode: z.string(),
      name: z.string(),
      description: z.string().nullable(),
      applicability: z.string(),
      implementationStatus: z.string(),
      owner: z.object({ id: z.uuid(), fullName: z.string() }).nullable(),
      evidence: z.array(
        z.object({
          id: z.uuid(),
          name: z.string(),
          source: z.string(),
          collectedAt: z.iso.datetime({ offset: true }),
          reviewedAt: z.iso.datetime({ offset: true }).nullable(),
        }),
      ),
      assessments: z.array(assessment),
    }),
  ),
  pagination: z.object({
    page: z.number().int(),
    limit: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
  }),
});
export const createAssessmentSchema = z.object({
  testMethod: z.string().trim().min(3).max(1000),
  result: z.enum(["effective", "partially_effective", "ineffective"]),
  effectiveness: z.number().min(0).max(100),
  notes: z.string().trim().min(10).max(5000),
});
export type ControlAssessmentList = z.infer<typeof controlAssessmentListSchema>;
export type ControlAssessmentItem = ControlAssessmentList["items"][number];
export type CreateAssessment = z.infer<typeof createAssessmentSchema>;
