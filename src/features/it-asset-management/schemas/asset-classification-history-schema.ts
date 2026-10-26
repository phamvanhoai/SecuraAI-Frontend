import { z } from "zod";

export const assetClassificationHistoryQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).max(100000).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
  })
  .strict();
const impact = z.number().int().min(1).max(5).nullable();
export const assetClassificationSnapshotSchema = z.object({
  confidentialityImpact: impact,
  integrityImpact: impact,
  availabilityImpact: impact,
  businessImpact: impact,
  criticality: z.string().nullable(),
  dataClassification: z.string().nullable(),
  rationale: z.string().nullable(),
  dataClassificationBasis: z.string().nullable(),
  methodVersion: z.string().nullable(),
  dataClassificationMethodVersion: z.string().nullable(),
  assessedBy: z.uuid().nullable(),
  assessedAt: z.iso.datetime({ offset: true }).nullable(),
});
export const assetClassificationHistorySchema = z.object({
  items: z.array(
    z.object({
      id: z.uuid(),
      occurredAt: z.iso.datetime({ offset: true }),
      actor: z.object({ id: z.uuid(), fullName: z.string() }).nullable(),
      before: assetClassificationSnapshotSchema.nullable(),
      after: assetClassificationSnapshotSchema.nullable(),
    }),
  ),
  pagination: z.object({
    page: z.number().int().min(1),
    limit: z.number().int().min(1).max(100),
    total: z.number().int().min(0),
    totalPages: z.number().int().min(0),
  }),
});
export type AssetClassificationHistory = z.infer<
  typeof assetClassificationHistorySchema
>;
export type AssetClassificationSnapshot = z.infer<
  typeof assetClassificationSnapshotSchema
>;
