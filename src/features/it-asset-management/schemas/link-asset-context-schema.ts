import { z } from "zod";

const optionalUuid = z.union([z.uuid(), z.literal("")]).transform((value) => value || null);
export const linkAssetContextSchema = z.object({
  businessServiceId: optionalUuid,
  dependencyIds: z.array(z.uuid()).max(50).refine((ids) => new Set(ids).size === ids.length, "Duplicate dependencies are not allowed"),
  eventSourceIds: z.array(z.uuid()).max(50).refine((ids) => new Set(ids).size === ids.length, "Duplicate event sources are not allowed"),
}).strict();
export const linkedAssetContextSchema = z.object({
  assetId: z.uuid(), businessServiceId: z.uuid().nullable(), dependencyIds: z.array(z.uuid()), eventSourceIds: z.array(z.uuid()), linkedAt: z.iso.datetime({ offset: true }),
});
export type LinkAssetContextInput = z.input<typeof linkAssetContextSchema>;
export type LinkAssetContextRequest = z.output<typeof linkAssetContextSchema>;
export type LinkedAssetContext = z.infer<typeof linkedAssetContextSchema>;
