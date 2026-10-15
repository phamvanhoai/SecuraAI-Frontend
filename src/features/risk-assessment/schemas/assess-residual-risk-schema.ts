import { z } from "zod";
const level = z.enum(["low", "medium", "high", "critical"]);
export const assessResidualRiskSchema = z
  .object({
    likelihood: z.number().int().min(1).max(5),
    impact: z.number().int().min(1).max(5),
    targetRisk: level,
    riskAppetite: level,
    riskTolerance: level,
    assessmentReason: z.string().trim().min(10).max(3000),
  })
  .refine(
    (input) => {
      const rank = { low: 1, medium: 2, high: 3, critical: 4 };
      return rank[input.riskAppetite] <= rank[input.riskTolerance];
    },
    {
      path: ["riskTolerance"],
      message: "Risk tolerance must be at least the risk appetite",
    },
  );
export const residualRiskResultSchema = z.object({
  assessmentId: z.uuid(),
  riskId: z.uuid(),
  riskCode: z.string(),
  likelihood: z.number(),
  impact: z.number(),
  score: z.number(),
  rating: level,
  controlEffectiveness: z.number(),
  withinAppetite: z.boolean(),
  withinTolerance: z.boolean(),
  assessedAt: z.iso.datetime({ offset: true }),
});
export type AssessResidualRiskInput = z.infer<typeof assessResidualRiskSchema>;
