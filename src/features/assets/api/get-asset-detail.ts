import { ApiError } from "@/lib/api/api-error";
import { apiRequest } from "@/lib/api/api-client";
import {
  assetDetailSchema,
  type AssetDetail,
} from "../schemas/create-asset-schema";

export async function getAssetDetail(
  assetId: string,
  signal?: AbortSignal,
): Promise<AssetDetail> {
  const data = await apiRequest<unknown>(`/api/assets/${assetId}`, {
    method: "GET",
    target: "same-origin",
    ...(signal ? { signal } : {}),
  });
  const parsed = assetDetailSchema.safeParse(data);
  if (!parsed.success) {
    throw new ApiError(
      "Phản hồi chi tiết tài sản không đúng định dạng.",
      502,
      "UNKNOWN_ERROR",
      parsed.error.flatten(),
    );
  }
  return parsed.data;
}
