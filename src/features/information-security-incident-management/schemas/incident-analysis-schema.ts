import { z } from "zod";
const text = z
  .string()
  .trim()
  .min(20, "Enter at least 20 characters.")
  .max(4000);
export const analysisFormSchema = z.object({
  rootCause: text,
  lessonsLearned: text,
  improvementActions: text,
});
export type AnalysisForm = z.infer<typeof analysisFormSchema>;
export const findingsSchema = z.object({
  rootCause: z.string().nullable(),
  lessonsLearned: z.string().nullable(),
  improvementActions: z.string().nullable(),
});
export const incidentAnalysisSchema = findingsSchema.extend({
  id: z.uuid(),
  analyzedAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  createdAt: z.iso.datetime(),
  analyzedBy: z.object({ id: z.uuid(), name: z.string() }),
});
export const currentAnalysisSchema = z.object({
  analysis: incidentAnalysisSchema.nullable(),
  canEdit: z.boolean(),
  editRestriction: z.string().nullable(),
});
export const analysisHistorySchema = z.object({
  items: z.array(
    z.object({
      id: z.uuid(),
      savedAt: z.iso.datetime(),
      savedBy: z.object({ id: z.uuid(), name: z.string() }).nullable(),
      before: findingsSchema.nullable(),
      findings: findingsSchema.nullable(),
    }),
  ),
  pagination: z.object({
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  }),
});
