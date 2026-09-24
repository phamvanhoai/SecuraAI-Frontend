import { ApiError } from "@/lib/api/api-error";
import { apiRequest } from "@/lib/api/api-client";
import { assetHistoryResponseSchema, type AssetHistoryQuery, type AssetHistoryResponse } from "../schemas/asset-history-schema";

export async function getAssetHistory(assetId: string, query: AssetHistoryQuery): Promise<AssetHistoryResponse> {
  const data = await apiRequest<unknown>(`/api/assets/${assetId}/history`, { query, target: "same-origin" });
  const parsed = assetHistoryResponseSchema.safeParse(data);
  if (!parsed.success) throw new ApiError("Phản hồi lịch sử tài sản không đúng định dạng.", 502, "UNKNOWN_ERROR", parsed.error.flatten());
  return parsed.data;
}
