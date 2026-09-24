import { z } from "zod";
import { riskLevels, riskStatuses } from "./risk-list-schema";

const optionalText = (max: number) =>
  z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() === "" ? undefined : value,
    z.string().trim().max(max).optional(),
  );
const optionalUuid = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.uuid().optional(),
);
export const createRiskAssessmentSchema = z
  .object({
    targetType: z.enum(["asset", "business_process"]),
    assetId: optionalUuid,
    businessProcessId: optionalUuid,
    title: z
      .string()
      .trim()
      .min(3, "Title must contain at least 3 characters.")
      .max(255)
      .transform((value) => value.normalize("NFKC").replace(/\s+/gu, " ")),
    description: optionalText(5_000),
    likelihood: z.coerce.number().int().min(1).max(5),
    impact: z.coerce.number().int().min(1).max(5),
    threatIds: z.array(z.uuid()).min(1, "Select at least one threat.").max(50),
    vulnerabilityIds: z
      .array(z.uuid())
      .min(1, "Select at least one vulnerability.")
      .max(50),
  })
  .superRefine((value, context) => {
    if (value.targetType === "asset" && !value.assetId)
      context.addIssue({
        code: "custom",
        path: ["assetId"],
        message: "Select an asset.",
      });
    if (value.targetType === "business_process" && !value.businessProcessId)
      context.addIssue({
        code: "custom",
        path: ["businessProcessId"],
        message: "Select a business process.",
      });
  });
export type CreateRiskAssessmentInput = z.input<
  typeof createRiskAssessmentSchema
>;
export type CreateRiskAssessmentForm = z.infer<
  typeof createRiskAssessmentSchema
>;
export type CreateRiskAssessmentRequest = {
  assetId?: string;
  businessProcessId?: string;
  title: string;
  description?: string;
  likelihood: number;
  impact: number;
  threats: { threatId: string; notes?: string }[];
  vulnerabilities: { vulnerabilityId: string; notes?: string }[];
};
export const createRiskAssessmentRequestSchema = z
  .object({
    assetId: z.uuid().optional(),
    businessProcessId: z.uuid().optional(),
    title: z
      .string()
      .trim()
      .min(3)
      .max(255)
      .transform((value) => value.normalize("NFKC").replace(/\s+/gu, " ")),
    description: z.string().trim().max(5_000).optional(),
    likelihood: z.number().int().min(1).max(5),
    impact: z.number().int().min(1).max(5),
    threats: z
      .array(
        z
          .object({
            threatId: z.uuid(),
            notes: z.string().trim().max(1000).optional(),
          })
          .strict(),
      )
      .min(1)
      .max(50),
    vulnerabilities: z
      .array(
        z
          .object({
            vulnerabilityId: z.uuid(),
            notes: z.string().trim().max(1000).optional(),
          })
          .strict(),
      )
      .min(1)
      .max(50),
  })
  .strict()
  .refine(
    (value) =>
      Number(Boolean(value.assetId)) +
        Number(Boolean(value.businessProcessId)) ===
      1,
    { path: ["assetId"], message: "Select exactly one target." },
  );

export const createdRiskAssessmentSchema = z.object({
  id: z.uuid(),
  riskCode: z.string(),
  title: z.string(),
  status: z.enum(riskStatuses),
  riskScore: z.number().int(),
  riskLevel: z.enum(riskLevels),
  assessedAt: z.iso.datetime({ offset: true }).nullable(),
});
const option = z.object({ id: z.uuid(), code: z.string(), name: z.string() });
export const riskCreateOptionsSchema = z.object({
  type: z.enum(["assets", "businessProcesses", "threats", "vulnerabilities"]),
  items: z.array(option.extend({ severity: z.string().nullable().optional() })),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});
export type CreatedRiskAssessment = z.infer<typeof createdRiskAssessmentSchema>;
export type RiskCreateOptions = z.infer<typeof riskCreateOptionsSchema>;
