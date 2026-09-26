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
export type DetectionThresholdFormInput = z.input<typeof detectionThresholdFormSchema>;
export type DetectionThresholdFormValues = z.output<typeof detectionThresholdFormSchema>;
export type ConfigureDetectionThresholdRequest = { threshold: number };
