import { z } from "zod";

const level = z.enum(["low", "medium", "high", "critical"]);
const score = z.coerce.number().int().min(1).max(5);
const optionalText = (max: number) => z.preprocess((value) => value === "" ? undefined : value, z.string().trim().max(max).optional());

export const createRiskAssessmentSchema = z.object({
  scopeType: z.enum(["asset", "business_service"]),
  scopeId: z.string().uuid("Select an assessment scope."),
  title: z.string().trim().min(3, "Enter at least 3 characters.").max(255),
  description: z.string().trim().min(3, "Describe the risk context.").max(5000),
  ownerUserId: z.string().uuid("Select a risk owner."),
  reviewDate: z.string().date("Select a valid review date."),
  threatName: z.string().trim().min(2, "Enter a threat.").max(255),
  threatDescription: optionalText(2000),
  vulnerabilityName: z.string().trim().min(2, "Enter a vulnerability.").max(255),
  vulnerabilityDescription: optionalText(2000),
  inherentLikelihood: score,
  inherentImpact: score,
  controlEffectiveness: z.coerce.number().min(0).max(100),
  residualLikelihood: score,
  residualImpact: score,
  targetRisk: level,
  riskAppetite: level.optional(),
  riskTolerance: level.optional(),
  assessmentReason: z.string().trim().min(3, "Explain the assessment basis.").max(3000),
});
export type CreateRiskAssessmentForm = z.infer<typeof createRiskAssessmentSchema>;
export type CreateRiskAssessmentInput = z.input<typeof createRiskAssessmentSchema>;

const namedItem = z.object({ name: z.string().trim().min(2).max(255), description: z.string().trim().max(2000).optional() });
export const createRiskAssessmentRequestSchema = z.object({
  title: z.string().trim().min(3).max(255), description: z.string().trim().min(3).max(5000),
  ownerUserId: z.uuid(), reviewDate: z.string().date(),
  scope: z.discriminatedUnion("type", [z.object({ type: z.literal("asset"), assetId: z.uuid() }), z.object({ type: z.literal("business_service"), businessServiceId: z.uuid() })]),
  threats: z.array(namedItem).min(1).max(20), vulnerabilities: z.array(namedItem).min(1).max(20),
  inherentLikelihood: score, inherentImpact: score, controlEffectiveness: z.coerce.number().min(0).max(100),
  residualLikelihood: score, residualImpact: score, targetRisk: level,
  riskAppetite: level.optional(), riskTolerance: level.optional(),
  assessmentReason: z.string().trim().min(3).max(3000),
}).strict();
export type CreateRiskAssessmentRequest = z.infer<typeof createRiskAssessmentRequestSchema>;

export const createdRiskAssessmentSchema = z.object({ id: z.uuid(), riskCode: z.string(), title: z.string(), status: z.enum(["open", "under_treatment", "accepted", "closed", "archived"]), createdAt: z.iso.datetime({ offset: true }) });
export type CreatedRiskAssessment = z.infer<typeof createdRiskAssessmentSchema>;
export const riskCreateOptionsSchema = z.object({
  assets: z.array(z.object({ id: z.uuid(), code: z.string(), name: z.string(), criticality: z.string() })),
  businessServices: z.array(z.object({ id: z.uuid(), name: z.string(), description: z.string().nullable(), assetCount: z.number().int().nonnegative() })),
  owners: z.array(z.object({ id: z.uuid(), fullName: z.string(), email: z.string().email(), role: z.string() })),
});
export type RiskCreateOptions = z.infer<typeof riskCreateOptionsSchema>;
