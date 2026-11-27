/**
 * Layer: Feature Query & Mutation Hooks (Event Ingestion - Event Sources)
 * Purpose: Wraps feature API calls with TanStack Query for caching, refetching, and cache invalidation.
 * Flow: UI Component -> TanStack Query Hook -> Feature API
 */
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

/**
 * TanStack Query hook for the paginated event source list.
 * Including `params` in the queryKey ensures automatic refetching and per-filter caching
 * whenever page, search query, or status filter changes.
 */
export function useEventSources(
  params?: Partial<EventSourceListQuery>,
  options?: { enabled?: boolean },
) {
  return useQuery<PaginatedEventSources, Error>({
    queryKey: ["event-sources", params],
    queryFn: () => listEventSources(params),
    ...(options?.enabled !== undefined ? { enabled: options.enabled } : {}),
  });
}

/** Fetches detailed metadata for a single event source; stays idle when `id` is null. */
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

/** Mutation hook to register a new event source and invalidate the cached source list. */
export function useCreateEventSource() {
  const queryClient = useQueryClient();

  return useMutation<EventSourceResponse, Error, RegisterEventSourceFormValues>({
    mutationFn: (values) => createEventSource(values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["event-sources"] });
    },
  });
}

/** Mutation hook to update an event source and refresh both the list and detail caches. */
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

/** Mutation hook to test live connectivity for an event source configuration. */
export function useTestEventSourceConnection() {
  return useMutation<
    TestEventSourceDiagnosticResponse,
    Error,
    TestEventSourceConnectionValues
  >({
    mutationFn: (values) => testEventSourceConnection(values),
  });
}

/** Mutation hook to import normalized events and refresh source and batch caches. */
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

/** Fetches summary details for a single ingestion batch when `batchId` is provided. */
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

/** Fetches paginated invalid events for a given ingestion batch. */
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

/** Fetches paginated historical ingestion batches for a given event source. */
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


