import { ApiError } from "@/lib/api/api-error";
import { apiRequest } from "@/lib/api/api-client";
import {
  createdAssetSchema,
  type CreatedAsset,
  type CreateAssetRequest,
} from "../schemas/create-asset-schema";

export async function createAsset(
  input: CreateAssetRequest,
): Promise<CreatedAsset> {
  const data = await apiRequest<unknown>("/api/assets", {
    method: "POST",
    target: "same-origin",
    body: input,
  });
  const parsed = createdAssetSchema.safeParse(data);
  if (!parsed.success) {
    throw new ApiError(
      "Phản hồi tạo tài sản không đúng định dạng.",
      502,
      "UNKNOWN_ERROR",
      parsed.error.flatten(),
    );
  }
  return parsed.data;
}
