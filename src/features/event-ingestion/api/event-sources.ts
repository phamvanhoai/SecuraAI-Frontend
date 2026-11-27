/**
 * Layer: Feature API Client (Event Ingestion - Event Sources)
 * Purpose: Builds same-origin BFF HTTP requests and validates untrusted responses with Zod schemas.
 * Flow: TanStack Query Hook -> Feature API -> Shared apiRequest -> Next.js BFF Route
 */
import { apiRequest } from "@/lib/api/api-client";
import {
  batchDetailResponseSchema,
  eventSourceDetailResponseSchema,
  eventSourceResponseSchema,
  importEventsResponseSchema,
  paginatedBatchesSchema,
  paginatedEventSourcesSchema,
  paginatedInvalidEventsSchema,
  testEventSourceDiagnosticSchema,
  type BatchDetailResponse,
  type EventSourceDetailResponse,
  type EventSourceListQuery,
  type EventSourceResponse,
  type GetBatchInvalidEventsQuery,
  type GetSourceBatchesQuery,
  type ImportEventsPayload,
  type ImportEventsResponse,
  type PaginatedBatches,
  type PaginatedEventSources,
  type PaginatedInvalidEvents,
  type RegisterEventSourceFormValues,
  type TestEventSourceConnectionValues,
  type TestEventSourceDiagnosticResponse,
  type UpdateEventSourceFormValues,
} from "../schemas/event-source-schema";

/** Registers a new event source via POST /api/event-sources and validates the response DTO. */
export async function createEventSource(
  values: RegisterEventSourceFormValues,
): Promise<EventSourceResponse> {
  const payload = {
    name: values.name.trim(),
    sourceType: values.sourceType.trim(),
    endpoint: values.endpoint && values.endpoint.trim().length > 0 ? values.endpoint.trim() : null,
    ingestionMethod: values.ingestionMethod,
    authenticationType:
      values.authenticationType && values.authenticationType.trim().length > 0
        ? values.authenticationType.trim()
        : null,
    status: values.status,
    description:
      values.description && values.description.trim().length > 0
        ? values.description.trim()
        : null,
    eventFamilies: values.eventFamilies,
  };

  const data = await apiRequest<unknown>("/api/event-sources", {
    target: "same-origin",
    method: "POST",
    body: payload,
  });

  return eventSourceResponseSchema.parse(data);
}

/**
 * Fetches a paginated list of event sources through the same-origin Next.js BFF route.
 * Only non-empty filter params are serialized so the backend's strict Zod schema never receives empty strings.
 * Validates the untrusted response payload at runtime with paginatedEventSourcesSchema.
 */
export async function listEventSources(
  params?: Partial<EventSourceListQuery>,
): Promise<PaginatedEventSources> {
  const searchParams = new URLSearchParams();
  if (params?.page !== undefined) searchParams.set("page", String(params.page));
  if (params?.limit !== undefined) searchParams.set("limit", String(params.limit));
  if (params?.q) searchParams.set("q", params.q);
  if (params?.sourceType) searchParams.set("sourceType", params.sourceType);
  if (params?.status) searchParams.set("status", params.status);
  if (params?.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params?.sortOrder) searchParams.set("sortOrder", params.sortOrder);

  const queryStr = searchParams.toString();
  const url = `/api/event-sources${queryStr ? `?${queryStr}` : ""}`;

  const data = await apiRequest<unknown>(url, {
    target: "same-origin",
    method: "GET",
  });

  return paginatedEventSourcesSchema.parse(data);
}

/** Fetches full details, creator info, masked API keys, and stats for a single event source. */
export async function getEventSource(id: string): Promise<EventSourceDetailResponse> {
  const data = await apiRequest<unknown>(`/api/event-sources/${encodeURIComponent(id)}`, {
    target: "same-origin",
    method: "GET",
  });

  return eventSourceDetailResponseSchema.parse(data);
}

/** Updates an existing event source configuration via PUT /api/event-sources/:id. */
export async function updateEventSource(
  id: string,
  values: UpdateEventSourceFormValues,
): Promise<EventSourceResponse> {
  const payload = {
    name: values.name.trim(),
    endpoint: values.endpoint && values.endpoint.trim().length > 0 ? values.endpoint.trim() : null,
    ingestionMethod: values.ingestionMethod,
    authenticationType:
      values.authenticationType && values.authenticationType.trim().length > 0
        ? values.authenticationType.trim()
        : null,
    status: values.status,
    description:
      values.description && values.description.trim().length > 0
        ? values.description.trim()
        : null,
    eventFamilies: values.eventFamilies,
  };

  const data = await apiRequest<unknown>(`/api/event-sources/${encodeURIComponent(id)}`, {
    target: "same-origin",
    method: "PUT",
    body: payload,
  });

  return eventSourceResponseSchema.parse(data);
}

/** Tests live connectivity to an event source endpoint before saving configuration. */
export async function testEventSourceConnection(
  values: TestEventSourceConnectionValues,
): Promise<TestEventSourceDiagnosticResponse> {
  const payload = {
    endpoint: values.endpoint.trim(),
    username: values.username && values.username.trim().length > 0 ? values.username.trim() : undefined,
    password: values.password && values.password.length > 0 ? values.password : undefined,
    verifySsl: values.verifySsl,
    timeoutMs: values.timeoutMs,
  };

  const data = await apiRequest<unknown>("/api/event-sources/test-connection", {
    target: "same-origin",
    method: "POST",
    body: payload,
  });

  return testEventSourceDiagnosticSchema.parse(data);
}

/** Uploads a batch of parsed events to POST /api/event-sources/:id/import. */
export async function importEvents(
  sourceId: string,
  payload: ImportEventsPayload,
): Promise<ImportEventsResponse> {
  const data = await apiRequest<unknown>(
    `/api/event-sources/${encodeURIComponent(sourceId)}/import`,
    {
      target: "same-origin",
      method: "POST",
      body: payload,
    },
  );

  return importEventsResponseSchema.parse(data);
}

/** Retrieves summary metrics and status for a specific event ingestion batch. */
export async function getBatchDetail(batchId: string): Promise<BatchDetailResponse> {
  const data = await apiRequest<unknown>(
    `/api/event-sources/batches/${encodeURIComponent(batchId)}`,
    {
      target: "same-origin",
      method: "GET",
    },
  );

  return batchDetailResponseSchema.parse(data);
}

/** Fetches paginated invalid event rows recorded during a specific import batch. */
export async function listBatchInvalidEvents(
  batchId: string,
  params?: Partial<GetBatchInvalidEventsQuery>,
): Promise<PaginatedInvalidEvents> {
  const searchParams = new URLSearchParams();
  if (params?.page !== undefined) searchParams.set("page", String(params.page));
  if (params?.limit !== undefined) searchParams.set("limit", String(params.limit));
  if (params?.errorCode) searchParams.set("errorCode", params.errorCode);
  if (params?.q) searchParams.set("q", params.q);

  const queryStr = searchParams.toString();
  const url = `/api/event-sources/batches/${encodeURIComponent(batchId)}/invalid-events${
    queryStr ? `?${queryStr}` : ""
  }`;

  const data = await apiRequest<unknown>(url, {
    target: "same-origin",
    method: "GET",
  });

  return paginatedInvalidEventsSchema.parse(data);
}

/** Fetches paginated ingestion batch history for a specific event source. */
export async function listSourceBatches(
  sourceId: string,
  params?: Partial<GetSourceBatchesQuery>,
): Promise<PaginatedBatches> {
  const searchParams = new URLSearchParams();
  if (params?.page !== undefined) searchParams.set("page", String(params.page));
  if (params?.limit !== undefined) searchParams.set("limit", String(params.limit));
  if (params?.status) searchParams.set("status", params.status);

  const queryStr = searchParams.toString();
  const url = `/api/event-sources/${encodeURIComponent(sourceId)}/batches${
    queryStr ? `?${queryStr}` : ""
  }`;

  const data = await apiRequest<unknown>(url, {
    target: "same-origin",
    method: "GET",
  });

  return paginatedBatchesSchema.parse(data);
}


