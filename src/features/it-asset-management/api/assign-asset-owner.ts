import { ApiError } from "@/lib/api/api-error";
import { apiRequest } from "@/lib/api/api-client";
import {
  assetOwnerAssignmentSchema,
  type AssetOwnerAssignment,
  type AssignAssetOwnerRequest,
} from "../schemas/assign-asset-owner-schema";

export async function assignAssetOwner(
  assetId: string,
  input: AssignAssetOwnerRequest,
): Promise<AssetOwnerAssignment> {
  const data = await apiRequest<unknown>(`/api/assets/${assetId}/owner`, {
    method: "PUT",
    target: "same-origin",
    body: input,
  });
  const parsed = assetOwnerAssignmentSchema.safeParse(data);
  if (!parsed.success) {
    throw new ApiError(
      "Phản hồi gán chủ sở hữu không đúng định dạng.",
      502,
      "UNKNOWN_ERROR",
      parsed.error.flatten(),
    );
  }
  return parsed.data;
}
