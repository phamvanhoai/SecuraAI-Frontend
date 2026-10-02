import { z } from "zod";
import { assetListItemSchema } from "./asset-list-schema";

const optionalUuid = z
  .union([z.literal(""), z.uuid()])
  .optional()
  .transform((value) => value || undefined);
const optionalText = (maximum: number) =>
  z
    .string()
    .trim()
    .max(maximum)
    .optional()
    .transform((value) => value || undefined);

export const createAssetSchema = z
  .object({
    assetCode: z
      .string()
      .trim()
      .min(1, "Asset code is required")
      .max(100)
      .regex(/^[A-Za-z0-9][A-Za-z0-9._/-]*$/, "Asset code format is invalid")
      .transform((value) => value.toUpperCase()),
    name: z.string().trim().min(1, "Asset name is required").max(255),
    assetType: z.string().trim().min(1, "Asset type is required").max(100),
    businessServiceId: optionalUuid,
    ownerUserId: optionalUuid,
    criticality: z.enum(["low", "medium", "high", "critical"]),
    dataClassification: z.string().pipe(z.enum(["public", "internal", "confidential", "restricted"], { error: "Select a valid data classification" })),
    description: optionalText(10_000),
    dependencyIds: z.array(z.uuid()).max(50).default([]),
    eventSourceIds: z.array(z.uuid()).max(50).default([]),
  })
  .strict();

export const assetCreateOptionsSchema = z.object({
  owners: z.array(
    z.object({
      id: z.uuid(),
      fullName: z.string(),
      role: z.string(),
      employeeCode: z.string().nullable().optional(),
    }),
  ),
  businessServices: z.array(z.object({ id: z.uuid(), name: z.string() })),
  assets: z.array(
    z.object({ id: z.uuid(), assetCode: z.string(), name: z.string() }),
  ),
  eventSources: z.array(
    z.object({ id: z.uuid(), name: z.string(), sourceType: z.string() }),
  ),
  departments: z
    .array(z.object({ id: z.uuid(), code: z.string(), name: z.string() }))
    .default([]),
  truncated: z
    .object({ departments: z.boolean(), owners: z.boolean() })
    .default({ departments: false, owners: false }),
});

export const createdAssetSchema = assetListItemSchema;
export const createAssetRequestSchema = z.object({
  assetCode: z.string().trim().min(1).max(100),
  name: z.string().trim().min(1).max(255),
  assetType: z.string().trim().min(1).max(100),
  businessServiceId: z.uuid().optional(),
  ownerUserId: z.uuid().optional(),
  criticality: z.enum(["low", "medium", "high", "critical"]),
  dataClassification: z.enum(["public", "internal", "confidential", "restricted"]),
  description: z.string().trim().max(10_000).optional(),
  dependencies: z.array(z.object({ assetId: z.uuid() })).max(50),
  eventSourceIds: z.array(z.uuid()).max(50),
}).strict();
export const assetDetailSchema = assetListItemSchema.extend({
  description: z.string().nullable(),
  hostname: z.string().nullable().optional(),
  ipAddress: z.string().nullable().optional(),
  createdAt: z.iso.datetime({ offset: true }),
});
export type CreateAssetInput = z.input<typeof createAssetSchema>;
export type CreateAssetOutput = z.output<typeof createAssetSchema>;
export type CreateAssetRequest = z.infer<typeof createAssetRequestSchema>;
export type CreatedAsset = z.infer<typeof createdAssetSchema>;
export type AssetDetail = z.infer<typeof assetDetailSchema>;
export type AssetCreateOptions = z.infer<typeof assetCreateOptionsSchema>;
