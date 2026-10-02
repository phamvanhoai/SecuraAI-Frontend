import { apiRequest } from "@/lib/api/api-client";
import {
  normalizedEventDetailSchema,
  normalizedEventMetricsSchema,
  paginatedNormalizedEventsSchema,
  type ListNormalizedEventsQuery,
  type NormalizedEventDetail,
  type NormalizedEventMetrics,
  type PaginatedNormalizedEvents,
} from "../schemas/normalized-event-schema";

export async function listNormalizedEvents(
  params?: Partial<ListNormalizedEventsQuery>,
): Promise<PaginatedNormalizedEvents> {
  const searchParams = new URLSearchParams();

  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params?.sortOrder) searchParams.set("sortOrder", params.sortOrder);

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
