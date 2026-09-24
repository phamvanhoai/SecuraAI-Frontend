import { ApiError } from "@/lib/api/api-error";
import { apiRequest } from "@/lib/api/api-client";
import {
  assetListResponseSchema,
  type AssetListQuery,
  type AssetListResponse,
} from "../schemas/asset-list-schema";

export async function listAssets(
  query: AssetListQuery,
  signal?: AbortSignal,
): Promise<AssetListResponse> {
  const data = await apiRequest<unknown>("/api/assets", {
    method: "GET",
    target: "same-origin",
    query,
    ...(signal ? { signal } : {}),
  });
  const parsed = assetListResponseSchema.safeParse(data);
  if (!parsed.success) {
    throw new ApiError(
      "Phản hồi danh sách tài sản không đúng định dạng.",
      502,
      "UNKNOWN_ERROR",
      parsed.error.flatten(),
    );
  }
  return parsed.data;
}
