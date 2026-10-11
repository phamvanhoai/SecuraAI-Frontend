import { z } from "zod";

export const businessServicePageQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).max(100000).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
  })
  .strict();
export const businessServiceListQuerySchema =
  businessServicePageQuerySchema.extend({
    q: z.string().trim().min(1).max(100).optional(),
    status: z.enum(["active", "inactive"]).optional(),
  });
const pagination = z.object({
  page: z.number().int().min(1),
  limit: z.number().int().min(1).max(100),
  total: z.number().int().min(0),
  totalPages: z.number().int().min(0),
});
export const businessServiceSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  description: z.string().nullable(),
  status: z.enum(["active", "inactive"]),
  owner: z
    .object({ id: z.uuid(), fullName: z.string(), inactive: z.boolean() })
    .nullable(),
  linkedAssetsCount: z.number().int().min(0),
  createdAt: z.iso.datetime({ offset: true }),
  updatedAt: z.iso.datetime({ offset: true }),
});
export const businessServiceListSchema = z.object({
  items: z.array(businessServiceSchema),
  pagination,
});
export const businessServiceAssetsSchema = z.object({
  items: z.array(
    z.object({
      id: z.uuid(),
      assetCode: z.string(),
      name: z.string(),
      assetType: z.string(),
      status: z.enum(["active", "archived"]),
    }),
  ),
  pagination,
});
export type BusinessService = z.infer<typeof businessServiceSchema>;
export type BusinessServiceListQuery = z.infer<
  typeof businessServiceListQuerySchema
>;
export type BusinessServiceAsset = z.infer<
  typeof businessServiceAssetsSchema
>["items"][number];
