import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createEventSource,
  getBatchDetail,
  getEventSource,
  importEvents,
  listBatchInvalidEvents,
  listEventSources,
  listSourceBatches,
  testEventSourceConnection,
  updateEventSource,
} from "../api/event-sources";
import type {
  BatchDetailResponse,
  EventSourceDetailResponse,
  EventSourceListQuery,
  EventSourceResponse,
  GetBatchInvalidEventsQuery,
  GetSourceBatchesQuery,
  ImportEventsPayload,
  ImportEventsResponse,
  PaginatedBatches,
  PaginatedEventSources,
  PaginatedInvalidEvents,
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

export function useImportEvents() {
  const queryClient = useQueryClient();

  return useMutation<
    ImportEventsResponse,
    Error,
    { sourceId: string; payload: ImportEventsPayload }
  >({
    mutationFn: ({ sourceId, payload }) => importEvents(sourceId, payload),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["event-sources"] });
      await queryClient.invalidateQueries({ queryKey: ["event-sources", variables.sourceId] });
      await queryClient.invalidateQueries({ queryKey: ["event-sources", variables.sourceId, "batches"] });
    },
  });
}

export function useBatchDetail(batchId: string | null) {
  return useQuery<BatchDetailResponse, Error>({
    queryKey: ["event-ingestion-batches", batchId],
    queryFn: () => {
      if (!batchId) throw new Error("Batch ID is required");
      return getBatchDetail(batchId);
    },
    enabled: Boolean(batchId),
  });
}

export function useBatchInvalidEvents(
  batchId: string | null,
  params?: Partial<GetBatchInvalidEventsQuery>,
) {
  return useQuery<PaginatedInvalidEvents, Error>({
    queryKey: ["event-ingestion-batches", batchId, "invalid-events", params],
    queryFn: () => {
      if (!batchId) throw new Error("Batch ID is required");
      return listBatchInvalidEvents(batchId, params);
    },
    enabled: Boolean(batchId),
  });
}

export function useSourceBatches(
  sourceId: string | null,
  params?: Partial<GetSourceBatchesQuery>,
) {
  return useQuery<PaginatedBatches, Error>({
    queryKey: ["event-sources", sourceId, "batches", params],
    queryFn: () => {
      if (!sourceId) throw new Error("Event source ID is required");
      return listSourceBatches(sourceId, params);
    },
    enabled: Boolean(sourceId),
  });
}


