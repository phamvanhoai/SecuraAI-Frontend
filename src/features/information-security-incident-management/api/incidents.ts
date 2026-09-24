import { apiRequest } from "@/lib/api/api-client";
import { ApiError, normalizeApiError } from "@/lib/api/api-error";
import {
  incidentSchema,
  incidentEvidenceListSchema,
  incidentEvidenceSchema,
  removedIncidentEvidenceSchema,
  assignmentOptionsSchema,
  myIncidentsSchema,
  type ClassifyIncidentForm,
  type AssignIncidentForm,
  type UpdateIncidentProgressForm,
  type ReportIncidentForm,
  type RemoveIncidentEvidenceForm,
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
export async function listIncidentAssignmentOptions(signal?: AbortSignal) {
  return assignmentOptionsSchema.parse(
    await apiRequest<unknown>("/api/incidents/assignment-options", {
      target: "same-origin",
      ...(signal ? { signal } : {}),
    }),
  );
}
export async function assignIncidentHandler(input: {
  id: string;
  values: AssignIncidentForm;
}) {
  return incidentSchema.parse(
    await apiRequest<unknown>(
      `/api/incidents/${encodeURIComponent(input.id)}/assignee`,
      {
        target: "same-origin",
        method: "PATCH",
        body: {
          assigneeUserId: input.values.assigneeUserId,
          note: input.values.note.trim(),
        },
      },
    ),
  );
}
export async function updateIncidentHandlingProgress(input: {
  id: string;
  values: UpdateIncidentProgressForm;
}) {
  return incidentSchema.parse(
    await apiRequest<unknown>(
      `/api/incidents/${encodeURIComponent(input.id)}/progress`,
      {
        target: "same-origin",
        method: "PATCH",
        body: { status: input.values.status, note: input.values.note.trim() },
      },
    ),
  );
}
export async function listIncidentEvidence(
  id: string,
  page: number,
  signal?: AbortSignal,
) {
  return incidentEvidenceListSchema.parse(
    await apiRequest<unknown>(
      `/api/incidents/${encodeURIComponent(id)}/evidence?page=${page}&limit=10`,
      {
        target: "same-origin",
        ...(signal ? { signal } : {}),
      },
    ),
  );
}
export async function uploadIncidentEvidence(input: {
  id: string;
  file: File;
  description: string;
}) {
  const form = new FormData();
  form.set("file", input.file);
  if (input.description.trim())
    form.set("description", input.description.trim());
  let response: Response;
  try {
    response = await fetch(
      `/api/incidents/${encodeURIComponent(input.id)}/evidence`,
      {
        method: "POST",
        credentials: "include",
        body: form,
      },
    );
  } catch (cause: unknown) {
    throw new ApiError(
      "Unable to connect to the server.",
      0,
      "NETWORK_ERROR",
      cause,
    );
  }
  const payload: unknown = await response.json().catch(() => undefined);
  if (!response.ok) throw normalizeApiError(response.status, payload);
  return incidentEvidenceSchema.parse(
    typeof payload === "object" && payload !== null && "data" in payload
      ? payload.data
      : undefined,
  );
}
export async function removeIncidentEvidence(input: {
  id: string;
  incidentId: string;
  values: RemoveIncidentEvidenceForm;
}) {
  return removedIncidentEvidenceSchema.parse(
    await apiRequest<unknown>(
      `/api/incidents/evidence/${encodeURIComponent(input.id)}`,
      {
        target: "same-origin",
        method: "DELETE",
        body: { reason: input.values.reason.trim() },
      },
    ),
  );
}
