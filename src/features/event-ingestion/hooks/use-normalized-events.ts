import { useQuery } from "@tanstack/react-query";
import {
  getNormalizedEventDetail,
  getNormalizedEventMetrics,
  listNormalizedEvents,
} from "../api/normalized-events";
import type {
  ListNormalizedEventsQuery,
  NormalizedEventDetail,
  NormalizedEventMetrics,
  PaginatedNormalizedEvents,
} from "../schemas/normalized-event-schema";

export function useNormalizedEvents(params?: Partial<ListNormalizedEventsQuery>) {
  return useQuery<PaginatedNormalizedEvents, Error>({
    queryKey: ["normalized-events", params],
    queryFn: () => listNormalizedEvents(params),
  });
}

export function useNormalizedEventMetrics() {
  return useQuery<NormalizedEventMetrics, Error>({
    queryKey: ["normalized-events", "metrics"],
    queryFn: () => getNormalizedEventMetrics(),
  });
}

export function useNormalizedEventDetail(id: string | null) {
  return useQuery<NormalizedEventDetail, Error>({
    queryKey: ["normalized-events", "detail", id],
    queryFn: () => {
      if (!id) throw new Error("Event ID is required");
      return getNormalizedEventDetail(id);
    },
    enabled: Boolean(id),
  });
}

