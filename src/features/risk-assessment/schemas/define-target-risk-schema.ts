import { z } from "zod";
const level = z.enum(["low", "medium", "high", "critical"]);
export const defineTargetRiskSchema = z.object({
  treatmentPlanId: z.uuid("Select a treatment plan."),
  targetRisk: level,
  rationale: z
    .string()
    .trim()
    .min(10, "Enter at least 10 characters.")
    .max(3000),
});
export const targetRiskResultSchema = z.object({
  assessmentId: z.uuid(),
  riskId: z.uuid(),
  riskCode: z.string(),
  treatmentPlan: z.object({
    id: z.uuid(),
    title: z.string(),
    strategy: z.string(),
  }),
  targetRisk: level,
  residualRisk: level,
  withinAppetite: z.boolean().nullable(),
  withinTolerance: z.boolean().nullable(),
  definedAt: z.iso.datetime({ offset: true }),
});
export type DefineTargetRiskInput = z.infer<typeof defineTargetRiskSchema>;
