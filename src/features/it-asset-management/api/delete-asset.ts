import { apiRequest } from "@/lib/api/api-client";
import { archiveAssetSchema, type ArchiveAssetRequest } from "../schemas/archive-asset-schema";

export async function deleteAsset(assetId: string, input: ArchiveAssetRequest): Promise<void> {
  await apiRequest<void>(`/api/assets/${assetId}`, {
    method: "DELETE",
    target: "same-origin",
    body: archiveAssetSchema.parse(input),
  });
}
