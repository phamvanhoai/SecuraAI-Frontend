import { z } from "zod";

export const thresholdRiskLevels = ["low", "medium", "high", "critical"] as const;

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
    page: z.number().int().min(1),
    limit: z.number().int().min(1).max(100),
    total: z.number().int().min(0),
    totalPages: z.number().int().min(0),
  }),
});

export const alertThresholdFormSchema = z.object({
  assetId: z.uuid("Select an asset."),
  thresholdPercent: z.coerce
    .number()
    .min(1, "Threshold must be at least 1%.")
    .max(100, "Threshold cannot exceed 100%."),
  riskLevelMin: z.union([z.enum(thresholdRiskLevels), z.literal("")]),
  enabled: z.boolean(),
});

export type AlertThreshold = z.infer<typeof alertThresholdSchema>;
export type AlertThresholdList = z.infer<typeof alertThresholdListSchema>;
export type AlertThresholdFormInput = z.input<typeof alertThresholdFormSchema>;
export type AlertThresholdFormValues = z.output<typeof alertThresholdFormSchema>;

export type SetAlertThresholdRequest = {
  threshold: number;
  riskLevelMin: (typeof thresholdRiskLevels)[number] | null;
  enabled: boolean;
};
