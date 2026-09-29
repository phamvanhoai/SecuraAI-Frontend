import { apiRequest } from "@/lib/api/api-client";
import {
  eventSourceResponseSchema,
  paginatedEventSourcesSchema,
  type EventSourceListQuery,
  type EventSourceResponse,
  type PaginatedEventSources,
  type RegisterEventSourceFormValues,
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
