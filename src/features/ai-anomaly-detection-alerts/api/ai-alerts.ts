import { apiRequest } from "@/lib/api/api-client";
import {
  aiAlertFeedbackSchema,
  aiAlertFeedbackListSchema,
  aiAlertListSchema,
  aiAlertMetricsSchema,
  aiAlertExplanationSchema,
  confirmAiAlertResultSchema,
  confirmAiAlertSchema,
  evaluateAiAlertReliabilitySchema,
  markFalsePositiveResultSchema,
  markFalsePositiveSchema,
  type AiAlertFeedback,
  type AiAlertFeedbackList,
  type AiAlertList,
  type AiAlertExplanation,
  type AiAlertStatus,
  type ConfirmAiAlertRequest,
  type ConfirmAiAlertResult,
  type EvaluateAiAlertReliabilityRequest,
  type MarkFalsePositiveRequest,
  type MarkFalsePositiveResult,
} from "../schemas/ai-alert-schema";
import {
  anomalyDetectionRunInputSchema,
  anomalyDetectionRunResultSchema,
  type AnomalyDetectionRunInput,
  type AnomalyDetectionRunResult,
} from "../schemas/anomaly-detection-run-schema";

export type AiAlertQuery = {
  page: number;
  limit: number;
  q?: string;
  status?: AiAlertStatus;
  detectedAfter?: string;
  sortOrder?: "asc" | "desc";
};

export async function runAnomalyDetection(
  input: AnomalyDetectionRunInput,
): Promise<AnomalyDetectionRunResult> {
  return anomalyDetectionRunResultSchema.parse(
    await apiRequest<unknown>("/api/anomaly-detections/runs", {
      method: "POST",
      target: "same-origin",
      body: anomalyDetectionRunInputSchema.parse(input),
    }),
  );
}

export type AiAlertMetrics = {
  total: number;
  newAlerts: number;
  reviewing: number;
  confirmed: number;
};

export async function listAiAlerts(
  query: AiAlertQuery,
  signal?: AbortSignal,
): Promise<AiAlertList> {
  return aiAlertListSchema.parse(
    await apiRequest<unknown>("/api/ai-alerts", {
      target: "same-origin",
      query,
      ...(signal ? { signal } : {}),
    }),
  );
}

export async function getAiAlertExplanation(
  alertId: string,
  signal?: AbortSignal,
): Promise<AiAlertExplanation | null> {
  return aiAlertExplanationSchema.nullable().parse(
    await apiRequest<unknown>(
      `/api/ai-alerts/${encodeURIComponent(alertId)}/explanation`,
      { target: "same-origin", ...(signal ? { signal } : {}) },
    ),
  );
}

export async function evaluateAiAlertReliability(
  alertId: string,
  input: EvaluateAiAlertReliabilityRequest,
): Promise<AiAlertFeedback> {
  const body = evaluateAiAlertReliabilitySchema.parse(input);
  return aiAlertFeedbackSchema.parse(
    await apiRequest<unknown>(`/api/ai-alerts/${alertId}/feedback`, {
      method: "POST",
      target: "same-origin",
      body,
    }),
  );
}

export async function listAiAlertFeedback(
  alertId: string,
  page: number,
  signal?: AbortSignal,
): Promise<AiAlertFeedbackList> {
  return aiAlertFeedbackListSchema.parse(
    await apiRequest<unknown>(`/api/ai-alerts/${alertId}/feedback`, {
      target: "same-origin",
      query: { page, limit: 10, sortOrder: "desc" },
      ...(signal ? { signal } : {}),
    }),
  );
}

export async function confirmAiAlertAsIncident(
  alertId: string,
  input: ConfirmAiAlertRequest,
): Promise<ConfirmAiAlertResult> {
  return confirmAiAlertResultSchema.parse(
    await apiRequest<unknown>(
      `/api/ai-alerts/${encodeURIComponent(alertId)}/confirm-incident`,
      {
        method: "POST",
        target: "same-origin",
        body: confirmAiAlertSchema.parse(input),
      },
    ),
  );
}

export async function markAiAlertFalsePositive(
  alertId: string,
  input: MarkFalsePositiveRequest,
): Promise<MarkFalsePositiveResult> {
  return markFalsePositiveResultSchema.parse(
    await apiRequest<unknown>(
      `/api/ai-alerts/${encodeURIComponent(alertId)}/false-positive`,
      {
        method: "POST",
        target: "same-origin",
        body: markFalsePositiveSchema.parse(input),
      },
    ),
  );
}

export async function getAiAlertMetrics(
  signal?: AbortSignal,
): Promise<AiAlertMetrics> {
  return aiAlertMetricsSchema.parse(
    await apiRequest<unknown>("/api/ai-alerts/metrics", {
      target: "same-origin",
      ...(signal ? { signal } : {}),
    }),
  );
}
