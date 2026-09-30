import { apiRequest } from "@/lib/api/api-client";
import {
  eventSourceDetailResponseSchema,
  eventSourceResponseSchema,
  paginatedEventSourcesSchema,
  testEventSourceDiagnosticSchema,
  type EventSourceDetailResponse,
  type EventSourceListQuery,
  type EventSourceResponse,
  type PaginatedEventSources,
  type RegisterEventSourceFormValues,
  type TestEventSourceConnectionValues,
  type TestEventSourceDiagnosticResponse,
  type UpdateEventSourceFormValues,
} from "../schemas/event-source-schema";

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

export async function getEventSource(id: string): Promise<EventSourceDetailResponse> {
  const data = await apiRequest<unknown>(`/api/event-sources/${encodeURIComponent(id)}`, {
    target: "same-origin",
    method: "GET",
  });

  return eventSourceDetailResponseSchema.parse(data);
}

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
