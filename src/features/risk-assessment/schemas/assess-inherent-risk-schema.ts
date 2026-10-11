import { z } from "zod";
export const assessInherentRiskSchema = z.object({
  likelihood: z.number().int().min(1).max(5),
  impact: z.number().int().min(1).max(5),
  assessmentReason: z
    .string()
    .trim()
    .min(10, "Enter at least 10 characters.")
    .max(3000),
});
export const inherentRiskResultSchema = z.object({
  assessmentId: z.uuid(),
  riskId: z.uuid(),
  riskCode: z.string(),
  title: z.string(),
  likelihood: z.number().int(),
  impact: z.number().int(),
  score: z.number().int(),
  rating: z.enum(["low", "medium", "high", "critical"]),
  assessedAt: z.iso.datetime({ offset: true }),
});
export type AssessInherentRiskInput = z.infer<typeof assessInherentRiskSchema>;
export type InherentRiskResult = z.infer<typeof inherentRiskResultSchema>;
