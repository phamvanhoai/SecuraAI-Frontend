import { apiRequest } from "@/lib/api/api-client";
import {
  detectionThresholdSchema,
  type ConfigureDetectionThresholdRequest,
  type DetectionThreshold,
  alertThresholdListSchema,
  alertThresholdAssetOptionsSchema,
  alertThresholdSchema,
  type AlertThreshold,
  type AlertThresholdList,
  type SetAlertThresholdRequest,
  type AlertThresholdAssetOption,
} from "../schemas/alert-threshold-schema";

export async function listAlertThresholdAssetOptions(
  q?: string,
  signal?: AbortSignal,
): Promise<AlertThresholdAssetOption[]> {
  return alertThresholdAssetOptionsSchema.parse(
    await apiRequest<unknown>("/api/ai-alerts/thresholds/assets/options", {
      target: "same-origin",
      query: { q },
      ...(signal ? { signal } : {}),
    }),
  );
}

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
  q?: string,
  signal?: AbortSignal,
): Promise<AlertThresholdList> {
  return alertThresholdListSchema.parse(
    await apiRequest<unknown>("/api/ai-alerts/thresholds/assets", {
      target: "same-origin",
      query: { page, limit: 10, q },
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
