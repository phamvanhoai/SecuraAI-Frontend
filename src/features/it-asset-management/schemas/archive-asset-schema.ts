import { z } from "zod";

export const archiveAssetSchema = z.object({
  reason: z.string().trim().min(20, "Enter at least 20 characters.").max(1000, "Use at most 1,000 characters."),
}).strict();
export type ArchiveAssetRequest = z.infer<typeof archiveAssetSchema>;
