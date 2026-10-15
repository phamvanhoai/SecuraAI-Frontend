import { z } from "zod";

export const archiveAssetSchema = z.object({
  reason: z.string().trim().min(1, "Enter an archive reason.").max(1000),
}).strict();
export type ArchiveAssetRequest = z.infer<typeof archiveAssetSchema>;
