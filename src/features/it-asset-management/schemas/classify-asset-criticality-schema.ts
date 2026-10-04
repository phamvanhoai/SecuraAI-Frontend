import { z } from "zod";
import { assetCriticalities } from "./asset-list-schema";

const impactScoreSchema = z.coerce.number().int().min(1).max(5);

export const classifyAssetCriticalitySchema = z
  .object({
    confidentialityImpact: impactScoreSchema,
    integrityImpact: impactScoreSchema,
    availabilityImpact: impactScoreSchema,
    businessImpact: impactScoreSchema,
    dataClassificationBasis: z
      .string()
      .trim()
      .min(20, "Explain the data classification basis (at least 20 characters)")
      .max(2000),
    rationale: z
      .string()
      .trim()
      .min(20, "Explain the assessment basis (at least 20 characters)")
      .max(2000),
    dataClassification: z.string().pipe(
      z.enum(["public", "internal", "confidential", "restricted"], {
        error: "Select a valid data classification",
      }),
    ),
  })
  .strict();

export const assetCriticalityClassificationSchema = z.object({
  assetId: z.uuid(),
  previousCriticality: z.enum(assetCriticalities).nullable(),
  criticality: z.enum(assetCriticalities),
  previousDataClassification: z.string().nullable(),
  dataClassification: z.enum([
    "public",
    "internal",
    "confidential",
    "restricted",
  ]),
  score: z.number().int().min(1).max(5),
  methodVersion: z.literal("SECURAAI-ASSET-IMPACT-v1"),
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
