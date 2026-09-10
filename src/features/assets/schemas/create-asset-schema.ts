import { z } from "zod";
import { assetCriticalities, assetListItemSchema } from "./asset-list-schema";

const optionalText = (maximum: number) =>
  z
    .string()
    .trim()
    .max(maximum)
    .transform((value) => (value === "" ? undefined : value));

export const createAssetSchema = z.object({
  assetCode: z
    .string()
    .trim()
    .min(1, "Mã tài sản là bắt buộc")
    .max(50)
    .regex(/^[A-Za-z0-9][A-Za-z0-9._/-]*$/, "Mã tài sản không đúng định dạng")
    .transform((value) => value.toUpperCase()),
  name: z.string().trim().min(1, "Tên tài sản là bắt buộc").max(150),
  assetType: z.string().trim().min(1, "Loại tài sản là bắt buộc").max(50),
  description: optionalText(10_000),
  criticality: z.enum(assetCriticalities).default("medium"),
  hostname: optionalText(255),
  ipAddress: z
    .string()
    .trim()
    .transform((value) => (value === "" ? undefined : value))
    .pipe(z.union([z.ipv4(), z.ipv6()]).optional()),
  location: optionalText(255),
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
