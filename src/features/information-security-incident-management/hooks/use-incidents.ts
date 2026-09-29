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
  getIncidentAssetOptions,
  linkIncidentToAsset,
  getIncidentControlOptions,
  linkIncidentToControl,
  getIncidentRiskOptions,
  linkIncidentToRisk,
  getControlWeaknessOptions,
  recordControlWeakness,
} from "../api/incidents";

export const useControlWeaknessOptions = (id: string | undefined) =>
  useQuery({
    queryKey: ["incidents", "control-weakness-options", id],
    queryFn: ({ signal }) => getControlWeaknessOptions(id ?? "", signal),
    enabled: Boolean(id),
    retry: false,
  });
export function useRecordControlWeakness() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: recordControlWeakness,
    retry: false,
    onSuccess: (_data, input) => {
      void client.invalidateQueries({ queryKey: ["incidents"] });
      void client.invalidateQueries({
        queryKey: ["incidents", "control-weakness-options", input.id],
      });
      void client.invalidateQueries({ queryKey: ["controls"] });
    },
  });
}

export const useIncidentRiskOptions = (id: string | undefined) =>
  useQuery({
    queryKey: ["incidents", "risk-options", id],
    queryFn: ({ signal }) => getIncidentRiskOptions(id ?? "", signal),
    enabled: Boolean(id),
    retry: false,
  });
export function useLinkIncidentToRisk() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: linkIncidentToRisk,
    retry: false,
    onSuccess: (_data, input) => {
      void client.invalidateQueries({ queryKey: ["incidents"] });
      void client.invalidateQueries({
        queryKey: ["incidents", "risk-options", input.id],
      });
      void client.invalidateQueries({ queryKey: ["risks"] });
    },
  });
}

export const useIncidentControlOptions = (id: string | undefined) =>
  useQuery({
    queryKey: ["incidents", "control-options", id],
    queryFn: ({ signal }) => getIncidentControlOptions(id ?? "", signal),
    enabled: Boolean(id),
    retry: false,
  });

export function useLinkIncidentToControl() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: linkIncidentToControl,
    retry: false,
    onSuccess: (_data, input) => {
      void client.invalidateQueries({ queryKey: ["incidents"] });
      void client.invalidateQueries({
        queryKey: ["incidents", "control-options", input.id],
      });
      void client.invalidateQueries({ queryKey: ["controls"] });
    },
  });
}

export const useIncidentAssetOptions = (id: string | undefined) =>
  useQuery({
    queryKey: ["incidents", "asset-options", id],
    queryFn: ({ signal }) => getIncidentAssetOptions(id ?? "", signal),
    enabled: Boolean(id),
    retry: false,
  });

export function useLinkIncidentToAsset() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: linkIncidentToAsset,
    retry: false,
    onSuccess: (_data, input) => {
      void client.invalidateQueries({ queryKey: ["incidents"] });
      void client.invalidateQueries({
        queryKey: ["incidents", "asset-options", input.id],
      });
      void client.invalidateQueries({ queryKey: ["assets"] });
    },
  });
}
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
