import { apiRequest } from "@/lib/api/api-client";
import {
  alertThresholdListSchema,
  alertThresholdSchema,
  type AlertThreshold,
  type AlertThresholdList,
  type SetAlertThresholdRequest,
} from "../schemas/alert-threshold-schema";

export async function listAlertThresholds(
  page: number,
  signal?: AbortSignal,
): Promise<AlertThresholdList> {
  return alertThresholdListSchema.parse(
    await apiRequest<unknown>("/api/ai-alerts/thresholds", {
      target: "same-origin",
      query: { page, limit: 100 },
      ...(signal ? { signal } : {}),
    }),
  );
}

export async function setAlertThreshold(
  assetId: string,
  input: SetAlertThresholdRequest,
): Promise<AlertThreshold> {
  return alertThresholdSchema.parse(
    await apiRequest<unknown>(
      `/api/ai-alerts/thresholds/${encodeURIComponent(assetId)}`,
      { method: "PUT", target: "same-origin", body: input },
    ),
  );
}
