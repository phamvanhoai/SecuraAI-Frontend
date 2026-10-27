import { ApiError } from "@/lib/api/api-error";
import { apiRequest } from "@/lib/api/api-client";
import {
  assetClassificationHistorySchema,
  type AssetClassificationHistory,
} from "../schemas/asset-classification-history-schema";

export async function getAssetClassificationHistory(
  assetId: string,
  page: number,
  signal?: AbortSignal,
): Promise<AssetClassificationHistory> {
  const search = new URLSearchParams({ page: String(page), limit: "10" });
  const data = await apiRequest<unknown>(
    `/api/assets/${assetId}/classify-criticality/history?${search}`,
    {
      method: "GET",
      target: "same-origin",
      cache: "no-store",
      ...(signal ? { signal } : {}),
    },
  );
  const parsed = assetClassificationHistorySchema.safeParse(data);
  if (!parsed.success)
    throw new ApiError(
      "Invalid asset classification history response.",
      502,
      "UNKNOWN_ERROR",
      parsed.error.flatten(),
    );
  return parsed.data;
}
