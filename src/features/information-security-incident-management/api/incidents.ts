import { apiRequest } from "@/lib/api/api-client";
import { classificationHistorySchema } from "../schemas/classification-history-schema";
import { assignmentHistorySchema } from "../schemas/assignment-history-schema";

export async function listAssignmentHistory(
  id: string,
  page: number,
  signal?: AbortSignal,
) {
  return assignmentHistorySchema.parse(
    await apiRequest<unknown>(
      `/api/incidents/${encodeURIComponent(id)}/assignee`,
      {
        target: "same-origin",
        cache: "no-store",
        query: { page, limit: 10 },
        ...(signal ? { signal } : {}),
      },
    ),
  );
}

export async function listClassificationHistory(
  id: string,
  page: number,
  signal?: AbortSignal,
) {
  return classificationHistorySchema.parse(
    await apiRequest<unknown>(
      `/api/incidents/${encodeURIComponent(id)}/severity`,
      {
        target: "same-origin",
        query: { page, limit: 10 },
        ...(signal ? { signal } : {}),
      },
    ),
  );
}
import { ApiError, normalizeApiError } from "@/lib/api/api-error";
import {
  incidentSchema,
  incidentDetailSchema,
  incidentEvidenceListSchema,
  incidentEvidenceSchema,
  removedIncidentEvidenceSchema,
  assignmentOptionsSchema,
  incidentSourceOptionsSchema,
  myIncidentsSchema,
  type ClassifyIncidentForm,
  type AssignIncidentForm,
  type UpdateIncidentProgressForm,
  type ReportIncidentForm,
  type RemoveIncidentEvidenceForm,
} from "../schemas/report-incident-schema";
import {
  incidentAssetOptionsSchema,
  linkedIncidentAssetSchema,
  type LinkIncidentAssetForm,
} from "../schemas/incident-asset-schema";
import {
  incidentControlOptionsSchema,
  linkedIncidentControlSchema,
  type LinkIncidentControlForm,
} from "../schemas/incident-control-schema";
import {
  incidentRiskOptionsSchema,
  linkedIncidentRiskSchema,
  type LinkIncidentRiskForm,
} from "../schemas/incident-risk-schema";
import {
  controlWeaknessOptionsSchema,
  controlWeaknessHistorySchema,
  recordedControlWeaknessSchema,
  type RecordControlWeaknessForm,
} from "../schemas/control-weakness-schema";
import {
  riskReassessmentRequestOptionsSchema,
  riskReassessmentRequestHistorySchema,
  riskReassessmentRequestSchema,
  type CreateRiskReassessmentRequestForm,
} from "../schemas/risk-reassessment-request-schema";

export async function listRiskReassessmentRequestHistory(
  id: string,
  page: number,
  signal?: AbortSignal,
) {
  return riskReassessmentRequestHistorySchema.parse(
    await apiRequest<unknown>(
      `/api/incidents/${encodeURIComponent(id)}/risk-reassessment-requests`,
      {
        target: "same-origin",
        query: { page, limit: 10 },
        ...(signal ? { signal } : {}),
      },
    ),
  );
}

export async function getRiskReassessmentRequestOptions(
  id: string,
  signal?: AbortSignal,
) {
  return riskReassessmentRequestOptionsSchema.parse(
    await apiRequest<unknown>(
      `/api/incidents/${encodeURIComponent(id)}/risk-reassessment-requests/options`,
      { target: "same-origin", ...(signal ? { signal } : {}) },
    ),
  );
}
export async function createRiskReassessmentRequest(input: {
  id: string;
  values: CreateRiskReassessmentRequestForm;
}) {
  return riskReassessmentRequestSchema.parse(
    await apiRequest<unknown>(
      `/api/incidents/${encodeURIComponent(input.id)}/risk-reassessment-requests`,
      {
        target: "same-origin",
        method: "POST",
        body: {
          riskId: input.values.riskId,
          reason: input.values.reason.trim(),
          ...(input.values.controlFindingId
            ? { controlFindingId: input.values.controlFindingId }
            : {}),
        },
      },
    ),
  );
}

export async function getControlWeaknessOptions(
  id: string,
  signal?: AbortSignal,
) {
  return controlWeaknessOptionsSchema.parse(
    await apiRequest<unknown>(
      `/api/incidents/${encodeURIComponent(id)}/control-weaknesses/options`,
      { target: "same-origin", ...(signal ? { signal } : {}) },
    ),
  );
}
export async function listControlWeaknessHistory(
  id: string,
  page: number,
  signal?: AbortSignal,
) {
  return controlWeaknessHistorySchema.parse(
    await apiRequest<unknown>(
      `/api/incidents/${encodeURIComponent(id)}/control-weaknesses`,
      {
        target: "same-origin",
        query: { page, limit: 10 },
        ...(signal ? { signal } : {}),
      },
    ),
  );
}
export async function recordControlWeakness(input: {
  id: string;
  values: RecordControlWeaknessForm;
}) {
  return recordedControlWeaknessSchema.parse(
    await apiRequest<unknown>(
      `/api/incidents/${encodeURIComponent(input.id)}/control-weaknesses`,
      {
        target: "same-origin",
        method: "POST",
        body: { ...input.values, description: input.values.description.trim() },
      },
    ),
  );
}

export async function getIncidentRiskOptions(
  id: string,
  query: {
    q: string;
    scope: "linked" | "unlinked";
    page: number;
    limit: number;
  },
  signal?: AbortSignal,
) {
  return incidentRiskOptionsSchema.parse(
    await apiRequest<unknown>(
      `/api/incidents/${encodeURIComponent(id)}/risks/options`,
      {
        target: "same-origin",
        query: {
          scope: query.scope,
          page: query.page,
          limit: query.limit,
          ...(query.q ? { q: query.q } : {}),
        },
        ...(signal ? { signal } : {}),
      },
    ),
  );
}
export async function unlinkIncidentFromRisk(input: {
  incidentId: string;
  riskId: string;
}): Promise<void> {
  await apiRequest<void>(
    `/api/incidents/${encodeURIComponent(input.incidentId)}/risks/${encodeURIComponent(input.riskId)}`,
    { target: "same-origin", method: "DELETE" },
  );
}
export async function linkIncidentToRisk(input: {
  id: string;
  values: LinkIncidentRiskForm;
}) {
  return linkedIncidentRiskSchema.parse(
    await apiRequest<unknown>(
      `/api/incidents/${encodeURIComponent(input.id)}/risks`,
      { target: "same-origin", method: "POST", body: input.values },
    ),
  );
}

export async function getIncidentControlOptions(
  id: string,
  query: {
    q: string;
    scope: "linked" | "unlinked";
    page: number;
    limit: number;
  },
  signal?: AbortSignal,
) {
  return incidentControlOptionsSchema.parse(
    await apiRequest<unknown>(
      `/api/incidents/${encodeURIComponent(id)}/controls/options`,
      {
        target: "same-origin",
        query: {
          scope: query.scope,
          page: query.page,
          limit: query.limit,
          ...(query.q ? { q: query.q } : {}),
        },
        ...(signal ? { signal } : {}),
      },
    ),
  );
}

export async function unlinkIncidentFromControl(input: {
  incidentId: string;
  controlId: string;
}): Promise<void> {
  await apiRequest<void>(
    `/api/incidents/${encodeURIComponent(input.incidentId)}/controls/${encodeURIComponent(input.controlId)}`,
    { target: "same-origin", method: "DELETE" },
  );
}

export async function linkIncidentToControl(input: {
  id: string;
  values: LinkIncidentControlForm;
}) {
  return linkedIncidentControlSchema.parse(
    await apiRequest<unknown>(
      `/api/incidents/${encodeURIComponent(input.id)}/controls`,
      {
        target: "same-origin",
        method: "POST",
        body: input.values,
      },
    ),
  );
}

export async function getIncidentAssetOptions(
  id: string,
  query: {
    q: string;
    scope: "linked" | "unlinked";
    page: number;
    limit: number;
  },
  signal?: AbortSignal,
) {
  return incidentAssetOptionsSchema.parse(
    await apiRequest<unknown>(
      `/api/incidents/${encodeURIComponent(id)}/assets/options`,
      {
        target: "same-origin",
        query: {
          scope: query.scope,
          page: query.page,
          limit: query.limit,
          ...(query.q ? { q: query.q } : {}),
        },
        ...(signal ? { signal } : {}),
      },
    ),
  );
}

export async function linkIncidentToAsset(input: {
  id: string;
  values: LinkIncidentAssetForm;
}) {
  return linkedIncidentAssetSchema.parse(
    await apiRequest<unknown>(
      `/api/incidents/${encodeURIComponent(input.id)}/assets`,
      {
        target: "same-origin",
        method: "POST",
        body: input.values,
      },
    ),
  );
}

export async function unlinkIncidentFromAsset(input: {
  incidentId: string;
  assetId: string;
}): Promise<void> {
  await apiRequest<void>(
    `/api/incidents/${encodeURIComponent(input.incidentId)}/assets/${encodeURIComponent(input.assetId)}`,
    { target: "same-origin", method: "DELETE" },
  );
}
export async function reportIncident(input: ReportIncidentForm) {
  return incidentSchema.parse(
    await apiRequest<unknown>("/api/incidents", {
      target: "same-origin",
      method: "POST",
      body: {
        sourceType: input.creationMode === "manual" ? "manual" : "finding",
        ...(input.creationMode === "source"
          ? { sourceId: input.sourceId }
          : {}),
        title: input.title.trim(),
        description: input.description.trim(),
        severity: input.severity,
        ...(input.occurredAt
          ? { occurredAt: new Date(input.occurredAt).toISOString() }
          : {}),
      },
    }),
  );
}
export async function listIncidentSourceOptions(signal?: AbortSignal) {
  return incidentSourceOptionsSchema.parse(
    await apiRequest<unknown>("/api/incidents/source-options", {
      target: "same-origin",
      query: { page: 1, limit: 100 },
      ...(signal ? { signal } : {}),
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
  return incidentDetailSchema.parse(
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
      },
      ...(signal ? { signal } : {}),
    }),
  );
}
export async function classifyIncidentSeverity(input: {
  id: string;
  values: ClassifyIncidentForm;
  expectedUpdatedAt?: string;
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
          ...(input.expectedUpdatedAt
            ? { expectedUpdatedAt: input.expectedUpdatedAt }
            : {}),
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
  expectedUpdatedAt?: string;
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
          ...(input.expectedUpdatedAt
            ? { expectedUpdatedAt: input.expectedUpdatedAt }
            : {}),
        },
      },
    ),
  );
}
export async function updateIncidentHandlingProgress(input: {
  id: string;
  values: UpdateIncidentProgressForm;
  expectedStatus: string;
  expectedUpdatedAt: string;
}) {
  return incidentSchema.parse(
    await apiRequest<unknown>(
      `/api/incidents/${encodeURIComponent(input.id)}/progress`,
      {
        target: "same-origin",
        method: "PATCH",
        body: {
          status: input.values.status,
          note: input.values.note.trim(),
          confirmed: input.values.confirmed,
          expectedStatus: input.expectedStatus,
          expectedUpdatedAt: input.expectedUpdatedAt,
          ...(input.values.skipReason?.trim()
            ? { skipReason: input.values.skipReason.trim() }
            : {}),
        },
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
