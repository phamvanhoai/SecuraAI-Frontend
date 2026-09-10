import { z } from "zod";
import { assetListItemSchema } from "./asset-list-schema";

const optionalText = (maximum: number) =>
  z
    .string()
    .trim()
    .max(maximum)
    .optional()
    .transform((value) => (value === "" ? undefined : value));

const optionalUuid = z
  .union([z.literal(""), z.uuid()])
  .optional()
  .transform((value) => (value === "" ? undefined : value))
  .pipe(z.uuid().optional());

export const createAssetSchema = z.object({
  assetCode: z
    .string()
    .trim()
    .min(1, "Asset code is required")
    .max(50)
    .regex(/^[A-Za-z0-9][A-Za-z0-9._/-]*$/, "Asset code format is invalid")
    .transform((value) => value.toUpperCase()),
  name: z.string().trim().min(1, "Asset name is required").max(150),
  assetType: z.string().trim().min(1, "Asset type is required").max(50),
  description: optionalText(10_000),
  hostname: optionalText(255),
  ipAddress: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value === "" ? undefined : value))
    .pipe(z.union([z.ipv4(), z.ipv6()]).optional()),
  location: optionalText(255),
  departmentId: optionalUuid,
  ownerUserId: optionalUuid,
}).strict();

export const assetCreateOptionsSchema = z.object({
  departments: z.array(
    z.object({ id: z.uuid(), code: z.string(), name: z.string() }),
  ),
  owners: z.array(
    z.object({
      id: z.uuid(),
      fullName: z.string(),
      employeeCode: z.string().nullable(),
    }),
  ),
  truncated: z.object({ departments: z.boolean(), owners: z.boolean() }),
});

export const assetDetailSchema = assetListItemSchema.extend({
  description: z.string().nullable(),
  hostname: z.string().nullable(),
  ipAddress: z.string().nullable(),
  createdAt: z.iso.datetime({ offset: true }),
});

export type CreateAssetInput = z.input<typeof createAssetSchema>;
export type CreateAssetRequest = z.output<typeof createAssetSchema>;
export type AssetDetail = z.infer<typeof assetDetailSchema>;
export type AssetCreateOptions = z.infer<typeof assetCreateOptionsSchema>;
