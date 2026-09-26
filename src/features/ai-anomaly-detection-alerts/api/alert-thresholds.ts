import { apiRequest } from "@/lib/api/api-client";
import {
  detectionThresholdSchema,
  type ConfigureDetectionThresholdRequest,
  type DetectionThreshold,
} from "../schemas/alert-threshold-schema";

export async function getDetectionThreshold(signal?: AbortSignal): Promise<DetectionThreshold> {
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
