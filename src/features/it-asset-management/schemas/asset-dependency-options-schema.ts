import { z } from "zod";
export const assetDependencyOptionsQuerySchema = z.object({ q: z.string().trim().max(100).default("") }).strict();
export const assetDependencyOptionsSchema = z.object({ items: z.array(z.object({
  id: z.uuid(), assetCode: z.string(), name: z.string(), status: z.string(),
  canSelect: z.boolean(), blockedReason: z.string().nullable(), cyclePath: z.array(z.string()),
})).max(10) });
