import { apiRequest } from "@/lib/api/api-client";
import { ApiError } from "@/lib/api/api-error";
import { assetOwnerOptionsSchema } from "../schemas/asset-owner-options-schema";
export async function getAssetOwnerOptions(q: string, signal: AbortSignal) {
  const result = assetOwnerOptionsSchema.safeParse(await apiRequest<unknown>("/api/assets/owner-options", {
    target: "same-origin", query: { q }, signal, cache: "no-store",
  }));
  if (!result.success) throw new ApiError("Invalid owner search response.", 502, "UNKNOWN_ERROR");
  return result.data;
}
