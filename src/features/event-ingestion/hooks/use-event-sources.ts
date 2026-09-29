import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createEventSource, listEventSources } from "../api/event-sources";
import type {
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

export function useCreateEventSource() {
  const queryClient = useQueryClient();

  return useMutation<EventSourceResponse, Error, RegisterEventSourceFormValues>({
    mutationFn: (values) => createEventSource(values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["event-sources"] });
    },
  });
}
