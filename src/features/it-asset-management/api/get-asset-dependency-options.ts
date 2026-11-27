import { apiRequest } from "@/lib/api/api-client";
import { ApiError } from "@/lib/api/api-error";
import { assetDependencyOptionsSchema } from "../schemas/asset-dependency-options-schema";
export async function getAssetDependencyOptions(assetId: string, q: string, signal: AbortSignal) {
  const data = await apiRequest<unknown>(`/api/assets/${encodeURIComponent(assetId)}/dependency-options`, {
    target: "same-origin", query: { q }, signal, cache: "no-store",
  });
  const parsed = assetDependencyOptionsSchema.safeParse(data);
  if (!parsed.success) throw new ApiError("Invalid dependency search response.", 502, "UNKNOWN_ERROR");
  return parsed.data;
}
