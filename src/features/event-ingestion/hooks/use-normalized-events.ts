import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getMappingOptions,
  getNormalizedEventDetail,
  getNormalizedEventMetrics,
  listNormalizedEvents,
  updateEventMapping,
} from "../api/normalized-events";
import type {
  EntityMapping,
  ListNormalizedEventsQuery,
  MappingOptions,
  NormalizedEventDetail,
  NormalizedEventMetrics,
  PaginatedNormalizedEvents,
  UpdateEntityMappingPayload,
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

export function useMappingOptions() {
  return useQuery<MappingOptions, Error>({
    queryKey: ["normalized-events", "mapping-options"],
    queryFn: () => getMappingOptions(),
  });
}

export function useUpdateEventMapping(eventId: string | null) {
  const queryClient = useQueryClient();

  return useMutation<EntityMapping, Error, UpdateEntityMappingPayload>({
    mutationFn: (payload) => {
      if (!eventId) throw new Error("Event ID is required for mapping update");
      return updateEventMapping(eventId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["normalized-events"] });
      if (eventId) {
        queryClient.invalidateQueries({
          queryKey: ["normalized-events", "detail", eventId],
        });
      }
    },
  });
}

