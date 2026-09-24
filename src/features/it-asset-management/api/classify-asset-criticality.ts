import { ApiError } from "@/lib/api/api-error";
import { apiRequest } from "@/lib/api/api-client";
import {
  assetCriticalityClassificationSchema,
  type AssetCriticalityClassification,
  type ClassifyAssetCriticalityRequest,
} from "../schemas/classify-asset-criticality-schema";

export async function classifyAssetCriticality(
  assetId: string,
  input: ClassifyAssetCriticalityRequest,
): Promise<AssetCriticalityClassification> {
  const data = await apiRequest<unknown>(
    `/api/assets/${assetId}/classify-criticality`,
    { method: "POST", target: "same-origin", body: input },
  );
  const parsed = assetCriticalityClassificationSchema.safeParse(data);
  if (!parsed.success) {
    throw new ApiError(
      "Phản hồi phân loại tài sản không đúng định dạng.",
      502,
      "UNKNOWN_ERROR",
      parsed.error.flatten(),
    );
  }
  return parsed.data;
}
