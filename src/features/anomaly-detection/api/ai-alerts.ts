import { apiRequest } from "@/lib/api/api-client";
import {
  aiAlertFeedbackSchema,
  aiAlertFeedbackListSchema,
  aiAlertListSchema,
  evaluateAiAlertReliabilitySchema,
  type AiAlertFeedback,
  type AiAlertFeedbackList,
  type AiAlertList,
  type AiAlertStatus,
  type EvaluateAiAlertReliabilityRequest,
} from "../schemas/ai-alert-schema";

export type AiAlertQuery = {
  page: number;
  limit: number;
  q?: string;
  status?: AiAlertStatus;
  detectedAfter?: string;
  sortOrder?: "asc" | "desc";
};

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

export async function getAiAlertMetrics(
  signal?: AbortSignal,
): Promise<AiAlertMetrics> {
  const detectedAfter = new Date(Date.now() - 86_400_000).toISOString();
  const [all, newAlerts, reviewing, confirmed] = await Promise.all([
    listAiAlerts({ page: 1, limit: 1, detectedAfter }, signal),
    listAiAlerts({ page: 1, limit: 1, status: "new", detectedAfter }, signal),
    listAiAlerts(
      { page: 1, limit: 1, status: "reviewing", detectedAfter },
      signal,
    ),
    listAiAlerts(
      { page: 1, limit: 1, status: "confirmed", detectedAfter },
      signal,
    ),
  ]);
  return {
    total: all.pagination.total,
    newAlerts: newAlerts.pagination.total,
    reviewing: reviewing.pagination.total,
    confirmed: confirmed.pagination.total,
  };
}
