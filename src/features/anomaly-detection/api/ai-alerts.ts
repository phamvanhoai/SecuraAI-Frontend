import { apiRequest } from "@/lib/api/api-client";
import {
  aiAlertListSchema,
  type AiAlertList,
  type AiAlertStatus,
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
