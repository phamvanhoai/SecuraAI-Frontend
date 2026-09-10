import { z } from "zod";

export const assetHistoryActions = [
  "created", "imported", "updated", "classified", "owner_assigned",
  "owner_reassigned", "owner_unassigned", "deleted",
] as const;

export const assetHistoryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  action: z.enum(assetHistoryActions).optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

const historyItemSchema = z.object({
  id: z.uuid(),
  action: z.enum(assetHistoryActions),
  changedBy: z.object({ id: z.uuid(), fullName: z.string() }).nullable(),
  before: z.record(z.string(), z.unknown()).nullable(),
  after: z.record(z.string(), z.unknown()).nullable(),
  changedAt: z.string(),
});

export const assetHistoryResponseSchema = z.object({
  asset: z.object({ id: z.uuid(), assetCode: z.string(), name: z.string(), deleted: z.boolean() }),
  items: z.array(historyItemSchema),
  pagination: z.object({ page: z.number().int(), limit: z.number().int(), total: z.number().int(), totalPages: z.number().int() }),
});

export type AssetHistoryQuery = z.infer<typeof assetHistoryQuerySchema>;
export type AssetHistoryResponse = z.infer<typeof assetHistoryResponseSchema>;
