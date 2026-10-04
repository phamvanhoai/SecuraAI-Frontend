import { apiRequest } from "@/lib/api/api-client";
import {
  entityMappingSchema,
  mappingOptionsSchema,
  normalizedEventDetailSchema,
  normalizedEventMetricsSchema,
  paginatedNormalizedEventsSchema,
  type EntityMapping,
  type ListNormalizedEventsQuery,
  type MappingOptions,
  type NormalizedEventDetail,
  type NormalizedEventMetrics,
  type PaginatedNormalizedEvents,
  type UpdateEntityMappingPayload,
} from "../schemas/normalized-event-schema";

export async function listNormalizedEvents(
  params?: Partial<ListNormalizedEventsQuery>,
): Promise<PaginatedNormalizedEvents> {
  const searchParams = new URLSearchParams();

  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params?.sortOrder) searchParams.set("sortOrder", params.sortOrder);
  if (params?.q) searchParams.set("q", params.q);
  if (params?.eventSourceId) searchParams.set("eventSourceId", params.eventSourceId);
  if (params?.eventFamily) searchParams.set("eventFamily", params.eventFamily);
  if (params?.mappingStatus) searchParams.set("mappingStatus", params.mappingStatus);
  if (params?.severity) searchParams.set("severity", params.severity);
  if (params?.eventType) searchParams.set("eventType", params.eventType);
  if (params?.account) searchParams.set("account", params.account);
  if (params?.sourceIp) searchParams.set("sourceIp", params.sourceIp);
  if (params?.assetId) searchParams.set("assetId", params.assetId);
  if (params?.asset) searchParams.set("asset", params.asset);
  if (params?.from) searchParams.set("from", params.from);
  if (params?.to) searchParams.set("to", params.to);

  const queryString = searchParams.toString();
  const endpoint = queryString ? `/api/events?${queryString}` : "/api/events";

  const data = await apiRequest<unknown>(endpoint, {
    target: "same-origin",
  });

  return paginatedNormalizedEventsSchema.parse(data);
}

export async function getNormalizedEventMetrics(): Promise<NormalizedEventMetrics> {
  const data = await apiRequest<unknown>("/api/events/metrics", {
    target: "same-origin",
  });

  return normalizedEventMetricsSchema.parse(data);
}

export async function getNormalizedEventDetail(
  id: string,
): Promise<NormalizedEventDetail> {
  const data = await apiRequest<unknown>(`/api/events/${encodeURIComponent(id)}`, {
    target: "same-origin",
  });

  return normalizedEventDetailSchema.parse(data);
}

export async function updateEventMapping(
  eventId: string,
  payload: UpdateEntityMappingPayload,
): Promise<EntityMapping> {
  const data = await apiRequest<unknown>(
    `/api/events/${encodeURIComponent(eventId)}/mappings`,
    {
      method: "PUT",
      target: "same-origin",
      body: JSON.stringify(payload),
    },
  );

  return entityMappingSchema.parse(data);
}

export async function getMappingOptions(): Promise<MappingOptions> {
  const data = await apiRequest<unknown>("/api/events/mapping-options", {
    target: "same-origin",
  });

  return mappingOptionsSchema.parse(data);
}
