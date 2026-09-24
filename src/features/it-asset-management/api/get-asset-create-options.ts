import { ApiError } from "@/lib/api/api-error";
import { apiRequest } from "@/lib/api/api-client";
import {
  assetCreateOptionsSchema,
  type AssetCreateOptions,
} from "../schemas/create-asset-schema";

export async function getAssetCreateOptions(): Promise<AssetCreateOptions> {
  const data = await apiRequest<unknown>("/api/assets/create-options", {
    target: "same-origin",
  });
  const parsed = assetCreateOptionsSchema.safeParse(data);
  if (!parsed.success) {
    throw new ApiError(
      "Phản hồi danh mục tạo tài sản không đúng định dạng.",
      502,
      "UNKNOWN_ERROR",
      parsed.error.flatten(),
    );
  }
  return parsed.data;
}
