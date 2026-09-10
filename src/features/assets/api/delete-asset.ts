import { apiRequest } from "@/lib/api/api-client";

export async function deleteAsset(assetId: string): Promise<void> {
  await apiRequest<void>(`/api/assets/${assetId}`, {
    method: "DELETE",
    target: "same-origin",
  });
}
