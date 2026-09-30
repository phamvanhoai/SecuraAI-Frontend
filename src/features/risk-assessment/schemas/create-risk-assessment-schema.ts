import { z } from "zod";

export const createRiskAssessmentSchema = z.object({
  scopeType: z.enum(["asset", "business_service"]),
  scopeId: z.string().uuid("Select an assessment scope."),
  title: z.string().trim().min(3, "Enter at least 3 characters.").max(255),
  description: z.string().trim().min(3, "Describe the risk context.").max(5000),
  ownerUserId: z.string().uuid("Select a risk owner."),
  reviewDate: z.string().date("Select a valid review date."),
});
export type CreateRiskAssessmentForm = z.infer<typeof createRiskAssessmentSchema>;
export type CreateRiskAssessmentInput = z.input<typeof createRiskAssessmentSchema>;

export const createRiskAssessmentRequestSchema = z.object({
  title: z.string().trim().min(3).max(255), description: z.string().trim().min(3).max(5000),
  ownerUserId: z.uuid(), reviewDate: z.string().date(),
  scope: z.discriminatedUnion("type", [z.object({ type: z.literal("asset"), assetId: z.uuid() }), z.object({ type: z.literal("business_service"), businessServiceId: z.uuid() })]),
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
