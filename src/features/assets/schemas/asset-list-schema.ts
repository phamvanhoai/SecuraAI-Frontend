import { z } from "zod";

export const assetCriticalities = [
  "low",
  "medium",
  "high",
  "critical",
] as const;
export const assetStatuses = [
  "active",
  "inactive",
  "retired",
  "disposed",
] as const;
export const assetSortFields = [
  "assetCode",
  "name",
  "createdAt",
  "updatedAt",
] as const;

export const assetListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().min(1).max(100).optional(),
  assetType: z.string().trim().min(1).max(50).optional(),
  criticality: z.enum(assetCriticalities).optional(),
  status: z.enum(assetStatuses).optional(),
  departmentId: z.uuid().optional(),
  ownerUserId: z.uuid().optional(),
  sortBy: z.enum(assetSortFields).default("assetCode"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

const departmentSchema = z.object({
  id: z.uuid(),
  code: z.string(),
  name: z.string(),
});
const ownerSchema = z.object({ id: z.uuid(), fullName: z.string() });

export const assetListItemSchema = z.object({
  id: z.uuid(),
  assetCode: z.string(),
  name: z.string(),
  assetType: z.string(),
  criticality: z.enum(assetCriticalities),
  status: z.enum(assetStatuses),
  location: z.string().nullable(),
  department: departmentSchema.nullable(),
  owner: ownerSchema.nullable(),
  updatedAt: z.iso.datetime({ offset: true }),
});

export const assetListResponseSchema = z.object({
  items: z.array(assetListItemSchema),
  pagination: z.object({
    page: z.number().int().min(1),
    limit: z.number().int().min(1).max(100),
    total: z.number().int().min(0),
    totalPages: z.number().int().min(0),
  }),
});

export type AssetListQuery = z.infer<typeof assetListQuerySchema>;
export type AssetListItem = z.infer<typeof assetListItemSchema>;
export type AssetListResponse = z.infer<typeof assetListResponseSchema>;
