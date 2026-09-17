import { apiRequest } from "@/lib/api/api-client";
import {
  incidentSchema,
  myIncidentsSchema,
  type ClassifyIncidentForm,
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
export async function listIncidentsForClassification(
  page: number,
  filters: {
    search: string;
    severity: string;
    status: string;
    classification: string;
  },
  signal?: AbortSignal,
) {
  return myIncidentsSchema.parse(
    await apiRequest<unknown>("/api/incidents", {
      target: "same-origin",
      query: {
        page,
        limit: 10,
        ...(filters.search ? { search: filters.search } : {}),
        ...(filters.severity ? { severity: filters.severity } : {}),
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.classification
          ? { classification: filters.classification }
          : {}),
      },
      ...(signal ? { signal } : {}),
    }),
  );
}
export async function classifyIncidentSeverity(input: {
  id: string;
  values: ClassifyIncidentForm;
}) {
  return incidentSchema.parse(
    await apiRequest<unknown>(
      `/api/incidents/${encodeURIComponent(input.id)}/severity`,
      {
        target: "same-origin",
        method: "PATCH",
        body: {
          severity: input.values.severity,
          rationale: input.values.rationale.trim(),
        },
      },
    ),
  );
}
