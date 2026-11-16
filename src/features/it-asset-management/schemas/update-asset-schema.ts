import { z } from "zod";
import { assetTypeSchema } from "./asset-type-schema";

export const updateAssetSchema = z.object({
  name: z.string().trim().min(3, "Enter at least 3 characters.").max(100, "Use at most 100 characters."),
  assetType: z.string().pipe(assetTypeSchema),
  description: z.string().trim().max(2000).refine((value) => value.length === 0 || value.length >= 20, "Enter at least 20 characters or leave blank.").transform((value) => value || null),
}).strict();
export type UpdateAssetInput = z.input<typeof updateAssetSchema>;
export type UpdateAssetRequest = z.output<typeof updateAssetSchema>;
