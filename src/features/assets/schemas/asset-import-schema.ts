import { z } from "zod";

const importErrorSchema = z.object({
  row: z.number().int().positive(),
  code: z.string(),
  field: z.string().nullable().optional(),
  message: z.string(),
  assetCode: z.string().nullable().optional(),
});

export const assetImportResultSchema = z.object({
  id: z.uuid(),
  importType: z.literal("assets"),
  status: z.enum(["pending", "processing", "completed", "failed"]),
  totalRows: z.number().int().nonnegative(),
  successRows: z.number().int().nonnegative(),
  failedRows: z.number().int().nonnegative(),
  errors: z.array(importErrorSchema),
  createdAt: z.string(),
  completedAt: z.string().nullable(),
});

export type AssetImportResult = z.infer<typeof assetImportResultSchema>;
