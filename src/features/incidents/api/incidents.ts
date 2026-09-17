import { apiRequest } from "@/lib/api/api-client";
import {
  incidentSchema,
  myIncidentsSchema,
  type ReportIncidentForm,
} from "../schemas/report-incident-schema";
export async function reportIncident(input: ReportIncidentForm) {
  return incidentSchema.parse(
    await apiRequest<unknown>("/api/incidents", {
      target: "same-origin",
      method: "POST",
      body: {
        title: input.title.trim(),
        description: input.description.trim(),
        category: input.category,
        ...(input.occurredAt
          ? { occurredAt: new Date(input.occurredAt).toISOString() }
          : {}),
      },
    }),
  );
}
export async function listMyIncidents(page: number, signal?: AbortSignal) {
  return myIncidentsSchema.parse(
    await apiRequest<unknown>("/api/incidents/mine", {
      target: "same-origin",
      query: { page, limit: 10 },
      ...(signal ? { signal } : {}),
    }),
  );
}
export async function getMyIncident(id: string, signal?: AbortSignal) {
  return incidentSchema.parse(
    await apiRequest<unknown>(`/api/incidents/${encodeURIComponent(id)}`, {
      target: "same-origin",
      ...(signal ? { signal } : {}),
    }),
  );
}
