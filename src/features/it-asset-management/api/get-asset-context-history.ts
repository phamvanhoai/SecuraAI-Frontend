import { ApiError } from "@/lib/api/api-error";
import { apiRequest } from "@/lib/api/api-client";
import {
  assetContextHistorySchema,
  type AssetContextHistory,
} from "../schemas/asset-context-history-schema";

export async function getAssetContextHistory(
  assetId: string,
  page: number,
  signal?: AbortSignal,
): Promise<AssetContextHistory> {
  const query = new URLSearchParams({ page: String(page), limit: "10" });
  const data = await apiRequest<unknown>(
    `/api/assets/${assetId}/context/history?${query}`,
    {
      method: "GET",
    cache: "no-store",
      target: "same-origin",
      ...(signal ? { signal } : {}),
    },
  );
  const parsed = assetContextHistorySchema.safeParse(data);
  if (!parsed.success)
    throw new ApiError(
      "Invalid asset context history response.",
      502,
      "UNKNOWN_ERROR",
      parsed.error.flatten(),
    );
  return parsed.data;
}
