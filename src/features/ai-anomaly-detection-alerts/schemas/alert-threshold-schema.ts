import { z } from "zod";

export const detectionThresholdSchema = z.object({
  modelVersionId: z.uuid(),
  modelName: z.string().min(1),
  version: z.string().min(1),
  status: z.literal("deployed"),
  threshold: z.number().min(0.5).max(1),
  deployedAt: z.iso.datetime({ offset: true }).nullable(),
});

export const detectionThresholdFormSchema = z.object({
  thresholdPercent: z.coerce
    .number()
    .min(50, "Threshold must be at least 50%.")
    .max(100, "Threshold cannot exceed 100%."),
});

export type DetectionThreshold = z.infer<typeof detectionThresholdSchema>;
export type DetectionThresholdFormInput = z.input<
  typeof detectionThresholdFormSchema
>;
export type DetectionThresholdFormValues = z.output<
  typeof detectionThresholdFormSchema
>;
export type ConfigureDetectionThresholdRequest = { threshold: number };

export const thresholdRiskLevels = [
  "low",
  "medium",
  "high",
  "critical",
] as const;
export const alertThresholdSchema = z.object({
  id: z.uuid(),
  asset: z.object({ id: z.uuid(), assetCode: z.string(), name: z.string() }),
  threshold: z.number().min(0.01).max(1),
  riskLevelMin: z.enum(thresholdRiskLevels).nullable(),
  enabled: z.boolean(),
  updatedByUserId: z.uuid().nullable(),
  updatedAt: z.iso.datetime({ offset: true }),
});
export const alertThresholdListSchema = z.object({
  items: z.array(alertThresholdSchema),
  pagination: z.object({
    page: z.number().int(),
    limit: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
  }),
});
export const alertThresholdFormSchema = z.object({
  assetId: z.uuid("Select an asset."),
  thresholdPercent: z.coerce.number().min(1).max(100),
  riskLevelMin: z.union([z.enum(thresholdRiskLevels), z.literal("")]),
  enabled: z.boolean(),
});
export type AlertThreshold = z.infer<typeof alertThresholdSchema>;
export type AlertThresholdList = z.infer<typeof alertThresholdListSchema>;
export type AlertThresholdFormInput = z.input<typeof alertThresholdFormSchema>;
export type AlertThresholdFormValues = z.output<
  typeof alertThresholdFormSchema
>;
export type SetAlertThresholdRequest = {
  threshold: number;
  riskLevelMin: (typeof thresholdRiskLevels)[number] | null;
  enabled: boolean;
};
