import { ApiError } from "@/lib/api/api-error";
import { apiRequest } from "@/lib/api/api-client";
import { linkedAssetContextSchema, type LinkedAssetContext, type LinkAssetContextRequest } from "../schemas/link-asset-context-schema";

export async function linkAssetContext(assetId: string, input: LinkAssetContextRequest): Promise<LinkedAssetContext> {
  const data = await apiRequest<unknown>(`/api/assets/${assetId}/context`, { method: "PUT", target: "same-origin", body: input });
  const parsed = linkedAssetContextSchema.safeParse(data);
  if (!parsed.success) throw new ApiError("Invalid asset context response.", 502, "UNKNOWN_ERROR", parsed.error.flatten());
  return parsed.data;
}
