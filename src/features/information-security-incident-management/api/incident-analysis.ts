import { apiRequest } from "@/lib/api/api-client";
import {
  currentAnalysisSchema,
  incidentAnalysisSchema,
  analysisHistorySchema,
  type AnalysisForm,
} from "../schemas/incident-analysis-schema";
export async function getIncidentAnalysis(id: string, signal?: AbortSignal) {
  const data = await apiRequest<unknown>(
    `/api/incidents/${encodeURIComponent(id)}/analysis`,
    { target: "same-origin", cache: "no-store", ...(signal ? { signal } : {}) },
  );
  return currentAnalysisSchema.parse(data);
}
export async function getAnalysisHistory(
  id: string,
  page: number,
  signal?: AbortSignal,
) {
  const data = await apiRequest<unknown>(
    `/api/incidents/${encodeURIComponent(id)}/analysis/history`,
    {
      target: "same-origin",
      query: { page, limit: 10 },
      cache: "no-store",
      ...(signal ? { signal } : {}),
    },
  );
  return analysisHistorySchema.parse(data);
}
export async function saveIncidentAnalysis(input: {
  id: string;
  values: AnalysisForm;
  expectedUpdatedAt: string | null;
}) {
  const data = await apiRequest<unknown>(
    `/api/incidents/${encodeURIComponent(input.id)}/analysis`,
    {
      target: "same-origin",
      method: "PATCH",
      body: { ...input.values, expectedUpdatedAt: input.expectedUpdatedAt },
    },
  );
  return incidentAnalysisSchema.parse(data);
}
