import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createEventSource,
  getEventSource,
  listEventSources,
  testEventSourceConnection,
  updateEventSource,
} from "../api/event-sources";
import type {
  EventSourceDetailResponse,
  EventSourceListQuery,
  EventSourceResponse,
  PaginatedEventSources,
  RegisterEventSourceFormValues,
  TestEventSourceConnectionValues,
  TestEventSourceDiagnosticResponse,
  UpdateEventSourceFormValues,
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

export function useUpdateEventSource() {
  const queryClient = useQueryClient();

  return useMutation<
    EventSourceResponse,
    Error,
    { id: string; values: UpdateEventSourceFormValues }
  >({
    mutationFn: ({ id, values }) => updateEventSource(id, values),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["event-sources"] });
      await queryClient.invalidateQueries({ queryKey: ["event-sources", variables.id] });
    },
  });
}

export function useTestEventSourceConnection() {
  return useMutation<
    TestEventSourceDiagnosticResponse,
    Error,
    TestEventSourceConnectionValues
  >({
    mutationFn: (values) => testEventSourceConnection(values),
  });
}
