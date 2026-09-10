import { z } from "zod";
import { assetCriticalities } from "./asset-list-schema";

const impactScoreSchema = z.coerce.number().int().min(1).max(5);

export const classifyAssetCriticalitySchema = z
  .object({
    confidentialityImpact: impactScoreSchema,
    integrityImpact: impactScoreSchema,
    availabilityImpact: impactScoreSchema,
    businessImpact: impactScoreSchema,
    reason: z.string().trim().min(1, "Lý do phân loại là bắt buộc").max(1000),
  })
  .strict();

export const assetCriticalityClassificationSchema = z.object({
  assetId: z.uuid(),
  previousCriticality: z.enum(assetCriticalities),
  criticality: z.enum(assetCriticalities),
  score: z.number().min(1).max(5),
  changed: z.boolean(),
  classifiedAt: z.iso.datetime({ offset: true }),
});

export type ClassifyAssetCriticalityInput = z.input<
  typeof classifyAssetCriticalitySchema
>;
export type ClassifyAssetCriticalityRequest = z.output<
  typeof classifyAssetCriticalitySchema
>;
export type AssetCriticalityClassification = z.infer<
  typeof assetCriticalityClassificationSchema
>;
