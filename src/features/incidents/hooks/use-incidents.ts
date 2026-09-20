"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  classifyIncidentSeverity,
  assignIncidentHandler,
  updateIncidentHandlingProgress,
  listIncidentEvidence,
  uploadIncidentEvidence,
  removeIncidentEvidence,
  getMyIncident,
  listIncidentsForClassification,
  listIncidentAssignmentOptions,
  listMyIncidents,
  reportIncident,
} from "../api/incidents";
const key = ["incidents", "mine"] as const;
export const useMyIncidents = (page: number, enabled: boolean) =>
  useQuery({
    queryKey: [...key, page],
    queryFn: ({ signal }) => listMyIncidents(page, signal),
    enabled,
    retry: false,
  });
export const useMyIncident = (id: string | undefined) =>
  useQuery({
    queryKey: ["incidents", "detail", id],
    queryFn: ({ signal }) => getMyIncident(id ?? "", signal),
    enabled: Boolean(id),
    retry: false,
  });
export function useReportIncident() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: reportIncident,
    retry: false,
    onSuccess: () => client.invalidateQueries({ queryKey: key }),
  });
}
export const useIncidentClassificationQueue = (
  page: number,
  filters: {
    search: string;
    severity: string;
    status: string;
    classification: string;
  },
  enabled: boolean,
) =>
  useQuery({
    queryKey: ["incidents", "classification", page, filters],
    queryFn: ({ signal }) =>
      listIncidentsForClassification(page, filters, signal),
    enabled,
    retry: false,
  });
export function useClassifyIncidentSeverity() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: classifyIncidentSeverity,
    retry: false,
    onSuccess: () => client.invalidateQueries({ queryKey: ["incidents"] }),
  });
}
export const useIncidentAssignmentOptions = (enabled: boolean) =>
  useQuery({
    queryKey: ["incidents", "assignment-options"],
    queryFn: ({ signal }) => listIncidentAssignmentOptions(signal),
    enabled,
    retry: false,
  });
export function useAssignIncidentHandler() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: assignIncidentHandler,
    retry: false,
    onSuccess: () => client.invalidateQueries({ queryKey: ["incidents"] }),
  });
}
export function useUpdateIncidentHandlingProgress() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: updateIncidentHandlingProgress,
    retry: false,
    onSuccess: () => client.invalidateQueries({ queryKey: ["incidents"] }),
  });
}
export const useIncidentEvidence = (id: string | undefined, page: number) =>
  useQuery({
    queryKey: ["incidents", "evidence", id, page],
    queryFn: ({ signal }) => listIncidentEvidence(id ?? "", page, signal),
    enabled: Boolean(id),
    retry: false,
  });
export function useUploadIncidentEvidence() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: uploadIncidentEvidence,
    retry: false,
    onSuccess: (_data, input) =>
      client.invalidateQueries({
        queryKey: ["incidents", "evidence", input.id],
      }),
  });
}
export function useRemoveIncidentEvidence() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: removeIncidentEvidence,
    retry: false,
    onSuccess: (_data, input) =>
      client.invalidateQueries({
        queryKey: ["incidents", "evidence", input.incidentId],
      }),
  });
}
