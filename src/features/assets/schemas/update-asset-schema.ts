import { z } from "zod";
import { assetStatuses } from "./asset-list-schema";

const nullableText = (maximum: number) =>
  z
    .string()
    .trim()
    .max(maximum)
    .transform((value) => (value === "" ? null : value));

const nullableUuid = z
  .union([z.literal(""), z.uuid(), z.null()])
  .transform((value) => (value === "" ? null : value));

export const updateAssetSchema = z.object({
  name: z.string().trim().min(1, "Tên tài sản là bắt buộc").max(150),
  assetType: z.string().trim().min(1, "Loại tài sản là bắt buộc").max(50),
  description: nullableText(10_000),
  departmentId: nullableUuid,
  hostname: nullableText(255),
  ipAddress: z
    .string()
    .trim()
    .transform((value) => (value === "" ? null : value))
    .pipe(z.union([z.ipv4(), z.ipv6()]).nullable()),
  location: nullableText(255),
  status: z.enum(assetStatuses),
}).strict();

export type UpdateAssetInput = z.input<typeof updateAssetSchema>;
export type UpdateAssetRequest = z.output<typeof updateAssetSchema>;
