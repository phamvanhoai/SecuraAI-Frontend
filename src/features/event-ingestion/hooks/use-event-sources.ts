import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createEventSource, getEventSource, listEventSources } from "../api/event-sources";
import type {
  EventSourceDetailResponse,
  EventSourceListQuery,
  EventSourceResponse,
  PaginatedEventSources,
  RegisterEventSourceFormValues,
} from "../schemas/event-source-schema";

export function useEventSources(params?: Partial<EventSourceListQuery>) {
  return useQuery<PaginatedEventSources, Error>({
    queryKey: ["event-sources", params],
    queryFn: () => listEventSources(params),
  });
}

export function useEventSource(id: string | null) {
  return useQuery<EventSourceDetailResponse, Error>({
    queryKey: ["event-sources", id],
    queryFn: () => {
      if (!id) throw new Error("Event source ID is required");
      return getEventSource(id);
    },
    enabled: Boolean(id),
  });
}

export function useCreateEventSource() {
  const queryClient = useQueryClient();

  return useMutation<EventSourceResponse, Error, RegisterEventSourceFormValues>({
    mutationFn: (values) => createEventSource(values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["event-sources"] });
    },
  });
}
