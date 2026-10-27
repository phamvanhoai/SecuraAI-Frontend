import { z } from "zod";

export const assetContextHistoryQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).max(100000).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
  })
  .strict();
const reference = z.object({ id: z.uuid(), name: z.string() });
export const assetContextSnapshotSchema = z.object({
  businessService: reference.nullable(),
  dependencies: z.array(reference.extend({ assetCode: z.string() })),
  eventSources: z.array(reference),
});
export const assetContextHistorySchema = z.object({
  items: z.array(
    z.object({
      id: z.uuid(),
      occurredAt: z.iso.datetime({ offset: true }),
      actor: z.object({ id: z.uuid(), fullName: z.string() }).nullable(),
      before: assetContextSnapshotSchema.nullable(),
      after: assetContextSnapshotSchema.nullable(),
    }),
  ),
  pagination: z.object({
    page: z.number().int().min(1),
    limit: z.number().int().min(1).max(100),
    total: z.number().int().min(0),
    totalPages: z.number().int().min(0),
  }),
});
export type AssetContextHistory = z.infer<typeof assetContextHistorySchema>;
export type AssetContextSnapshot = z.infer<typeof assetContextSnapshotSchema>;
