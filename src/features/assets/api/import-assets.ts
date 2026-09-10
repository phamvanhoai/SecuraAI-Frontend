import { ApiError, normalizeApiError } from "@/lib/api/api-error";
import {
  assetImportResultSchema,
  type AssetImportResult,
} from "../schemas/asset-import-schema";

export async function importAssets(file: File): Promise<AssetImportResult> {
  const formData = new FormData();
  formData.set("file", file);
  let response: Response;
  try {
    response = await fetch("/api/assets/import", {
      method: "POST",
      credentials: "include",
      body: formData,
    });
  } catch (cause: unknown) {
    throw new ApiError("Không thể kết nối máy chủ.", 0, "NETWORK_ERROR", cause);
  }
  const payload: unknown = await response.json().catch(() => undefined);
  if (!response.ok) throw normalizeApiError(response.status, payload);
  const parsed = assetImportResultSchema.safeParse(
    typeof payload === "object" && payload !== null && "data" in payload
      ? payload.data
      : undefined,
  );
  if (!parsed.success)
    throw new ApiError("Phản hồi nhập tài sản không đúng định dạng.", 502, "UNKNOWN_ERROR");
  return parsed.data;
}
