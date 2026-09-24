import { z } from "zod";

export const assignAssetOwnerSchema = z
  .object({
    ownerUserId: z
      .union([z.literal(""), z.uuid(), z.null()])
      .transform((value) => (value === "" ? null : value)),
    reason: z.string().trim().min(1, "Lý do thay đổi chủ sở hữu là bắt buộc").max(1000),
  })
  .strict();

const ownerSchema = z.object({ id: z.uuid(), fullName: z.string() });

export const assetOwnerAssignmentSchema = z.object({
  assetId: z.uuid(),
  previousOwner: ownerSchema.nullable(),
  owner: ownerSchema.nullable(),
  changed: z.boolean(),
  assignedAt: z.iso.datetime({ offset: true }).nullable(),
});

export type AssignAssetOwnerInput = z.input<typeof assignAssetOwnerSchema>;
export type AssignAssetOwnerRequest = z.output<typeof assignAssetOwnerSchema>;
export type AssetOwnerAssignment = z.infer<typeof assetOwnerAssignmentSchema>;
