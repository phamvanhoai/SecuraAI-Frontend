import { z } from "zod";
import { assetTypeSchema } from "./asset-type-schema";

export const updateAssetSchema = z.object({
  name: z.string().trim().min(1, "Asset name is required").max(255),
  assetType: z.string().pipe(assetTypeSchema),
  description: z.string().trim().max(10_000).transform((value) => value || null),
}).strict();
export type UpdateAssetInput = z.input<typeof updateAssetSchema>;
export type UpdateAssetRequest = z.output<typeof updateAssetSchema>;
