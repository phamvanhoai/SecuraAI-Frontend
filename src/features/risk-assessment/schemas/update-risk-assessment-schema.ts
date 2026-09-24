import { z } from "zod";
import { riskDetailSchema } from "./risk-detail-schema";

const optionalUuid = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.uuid().optional(),
);
export const updateRiskAssessmentFormSchema = z
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
    description: z.string().trim().max(5_000),
    likelihood: z.coerce.number().int().min(1).max(5),
    impact: z.coerce.number().int().min(1).max(5),
    threatIds: z.array(z.uuid()).min(1, "Select at least one threat.").max(50),
    vulnerabilityIds: z
      .array(z.uuid())
      .min(1, "Select at least one vulnerability.")
      .max(50),
    expectedUpdatedAt: z.iso.datetime({ offset: true }),
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
export const updateRiskAssessmentRequestSchema = z
  .object({
    assetId: z.uuid().optional(),
    businessProcessId: z.uuid().optional(),
    title: z
      .string()
      .trim()
      .min(3)
      .max(255)
      .transform((value) => value.normalize("NFKC").replace(/\s+/gu, " ")),
    description: z.string().trim().max(5_000).nullable(),
    likelihood: z.number().int().min(1).max(5),
    impact: z.number().int().min(1).max(5),
    threats: z
      .array(
        z
          .object({
            threatId: z.uuid(),
            notes: z.string().trim().max(1_000).nullable().optional(),
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
            notes: z.string().trim().max(1_000).nullable().optional(),
          })
          .strict(),
      )
      .min(1)
      .max(50),
    expectedUpdatedAt: z.iso.datetime({ offset: true }),
  })
  .strict()
  .refine(
    (value) =>
      Number(Boolean(value.assetId)) +
        Number(Boolean(value.businessProcessId)) ===
      1,
    { path: ["assetId"], message: "Select exactly one target." },
  );
export type UpdateRiskAssessmentInput = z.input<
  typeof updateRiskAssessmentFormSchema
>;
export type UpdateRiskAssessmentForm = z.infer<
  typeof updateRiskAssessmentFormSchema
>;
export type UpdateRiskAssessmentRequest = z.infer<
  typeof updateRiskAssessmentRequestSchema
>;
export const updatedRiskAssessmentSchema = riskDetailSchema;
