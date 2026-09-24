import { ApiError, normalizeApiError } from "@/lib/api/api-error";
import type { AssetListQuery } from "../schemas/asset-list-schema";

export async function exportAssets(query: AssetListQuery): Promise<void> {
  const parameters = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (key !== "page" && key !== "limit" && value !== undefined && value !== "")
      parameters.set(key, String(value));
  });
  let response: Response;
  try {
    response = await fetch(`/api/assets/export?${parameters.toString()}`, {
      credentials: "include",
    });
  } catch (cause: unknown) {
    throw new ApiError("Không thể kết nối máy chủ.", 0, "NETWORK_ERROR", cause);
  }
  if (!response.ok) {
    const payload: unknown = await response.json().catch(() => undefined);
    throw normalizeApiError(response.status, payload);
  }
  const disposition = response.headers.get("content-disposition") ?? "";
  const filename = /filename="?([^";]+)"?/.exec(disposition)?.[1] ?? "assets.xlsx";
  const href = URL.createObjectURL(await response.blob());
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(href);
}
