import { z } from "zod";

const nullableUuid = z.union([z.literal(""), z.uuid(), z.null()]).transform((value) => value || null);
export const updateAssetSchema = z.object({
  name: z.string().trim().min(1, "Asset name is required").max(255),
  assetType: z.string().trim().min(1, "Asset type is required").max(100),
  ownerUserId: nullableUuid,
  businessServiceId: nullableUuid,
  criticality: z.enum(["low", "medium", "high", "critical"]),
  dataClassification: z.string().trim().min(1, "Data classification is required").max(50),
  description: z.string().trim().max(10_000).transform((value) => value || null),
  dependencyIds: z.array(z.uuid()).max(50),
  eventSourceIds: z.array(z.uuid()).max(50),
}).strict();
export type UpdateAssetInput = z.input<typeof updateAssetSchema>;
export type UpdateAssetRequest = z.output<typeof updateAssetSchema>;
