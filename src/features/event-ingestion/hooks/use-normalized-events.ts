import { useQuery } from "@tanstack/react-query";
import {
  getNormalizedEventMetrics,
  listNormalizedEvents,
} from "../api/normalized-events";
import type {
  ListNormalizedEventsQuery,
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
