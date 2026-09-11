"use client";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createLogSource,
  deleteLogSource,
  getLogSourceMetrics,
  listLogSources,
  updateLogSource,
  type LogSourceQuery,
} from "../api/log-sources";
import type { LogSourceForm } from "../schemas/log-source-schema";

const key = ["security-monitoring", "log-sources"] as const;
export function useLogSources(query: LogSourceQuery) {
  return useQuery({
    queryKey: [...key, query],
    queryFn: ({ signal }) => listLogSources(query, signal),
    placeholderData: keepPreviousData,
  });
}
export function useLogSourceMetrics() {
  return useQuery({
    queryKey: [...key, "metrics"],
    queryFn: ({ signal }) => getLogSourceMetrics(signal),
  });
}
export function useCreateLogSource() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: createLogSource,
    onSuccess: () => client.invalidateQueries({ queryKey: key }),
  });
}
export function useUpdateLogSource() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: LogSourceForm }) =>
      updateLogSource(id, values),
    onSuccess: () => client.invalidateQueries({ queryKey: key }),
  });
}
export function useDeleteLogSource() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: deleteLogSource,
    onSuccess: () => client.invalidateQueries({ queryKey: key }),
  });
}
