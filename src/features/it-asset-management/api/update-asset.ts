import { ApiError } from "@/lib/api/api-error";
import { apiRequest } from "@/lib/api/api-client";
import {
  assetDetailSchema,
  type AssetDetail,
} from "../schemas/create-asset-schema";
import type { UpdateAssetRequest } from "../schemas/update-asset-schema";

export async function updateAsset(
  assetId: string,
  input: UpdateAssetRequest,
): Promise<AssetDetail> {
  const data = await apiRequest<unknown>(`/api/assets/${assetId}`, {
    method: "PATCH",
    target: "same-origin",
    body: input,
  });
  const parsed = assetDetailSchema.safeParse(data);
  if (!parsed.success) {
    throw new ApiError(
      "Phản hồi cập nhật tài sản không đúng định dạng.",
      502,
      "UNKNOWN_ERROR",
      parsed.error.flatten(),
    );
  }
  return parsed.data;
}
