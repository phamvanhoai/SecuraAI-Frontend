import { apiRequest } from "@/lib/api/api-client";
import {
  detectionThresholdSchema,
  type ConfigureDetectionThresholdRequest,
  type DetectionThreshold,
  alertThresholdListSchema,
  alertThresholdSchema,
  type AlertThreshold,
  type AlertThresholdList,
  type SetAlertThresholdRequest,
} from "../schemas/alert-threshold-schema";

export async function getDetectionThreshold(
  signal?: AbortSignal,
): Promise<DetectionThreshold> {
  return detectionThresholdSchema.parse(
    await apiRequest<unknown>("/api/ai-alerts/thresholds", {
      target: "same-origin",
      ...(signal ? { signal } : {}),
    }),
  );
}
export async function configureDetectionThreshold(
  input: ConfigureDetectionThresholdRequest,
): Promise<DetectionThreshold> {
  return detectionThresholdSchema.parse(
    await apiRequest<unknown>("/api/ai-alerts/thresholds", {
      method: "PUT",
      target: "same-origin",
      body: input,
    }),
  );
}

export async function listAlertThresholds(
  page: number,
  signal?: AbortSignal,
): Promise<AlertThresholdList> {
  return alertThresholdListSchema.parse(
    await apiRequest<unknown>("/api/ai-alerts/thresholds/assets", {
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
