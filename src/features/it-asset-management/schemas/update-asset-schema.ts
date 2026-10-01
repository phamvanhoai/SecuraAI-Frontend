import { z } from "zod";

export const updateAssetSchema = z.object({
  name: z.string().trim().min(1, "Asset name is required").max(255),
  assetType: z.string().trim().min(1, "Asset type is required").max(100),
  description: z.string().trim().max(10_000).transform((value) => value || null),
}).strict();
export type UpdateAssetInput = z.input<typeof updateAssetSchema>;
export type UpdateAssetRequest = z.output<typeof updateAssetSchema>;
