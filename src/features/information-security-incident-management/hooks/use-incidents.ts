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
  listIncidentSourceOptions,
  getIncidentAssetOptions,
  linkIncidentToAsset,
  unlinkIncidentFromAsset,
  getIncidentControlOptions,
  linkIncidentToControl,
  unlinkIncidentFromControl,
  getIncidentRiskOptions,
  linkIncidentToRisk,
  unlinkIncidentFromRisk,
  getControlWeaknessOptions,
  listControlWeaknessHistory,
  recordControlWeakness,
  getRiskReassessmentRequestOptions,
  createRiskReassessmentRequest,
  listRiskReassessmentRequestHistory,
} from "../api/incidents";

export const useRiskReassessmentRequestHistory = (
  id: string | undefined,
  page: number,
) =>
  useQuery({
    queryKey: ["incidents", "risk-reassessment-request-history", id, page],
    queryFn: ({ signal }) =>
      listRiskReassessmentRequestHistory(id ?? "", page, signal),
    enabled: Boolean(id),
    retry: false,
  });

export const useControlWeaknessHistory = (
  id: string | undefined,
  page: number,
) =>
  useQuery({
    queryKey: ["incidents", "control-weakness-history", id, page],
    queryFn: ({ signal }) => listControlWeaknessHistory(id ?? "", page, signal),
    enabled: Boolean(id),
    retry: false,
  });

export const useRiskReassessmentRequestOptions = (id: string | undefined) =>
  useQuery({
    queryKey: ["incidents", "risk-reassessment-request-options", id],
    queryFn: ({ signal }) =>
      getRiskReassessmentRequestOptions(id ?? "", signal),
    enabled: Boolean(id),
    retry: false,
  });
export function useCreateRiskReassessmentRequest() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: createRiskReassessmentRequest,
    retry: false,
    onSuccess: (_data, input) => {
      void client.invalidateQueries({ queryKey: ["incidents"] });
      void client.invalidateQueries({
        queryKey: ["incidents", "risk-reassessment-request-options", input.id],
      });
      void client.invalidateQueries({
        queryKey: ["incidents", "risk-reassessment-request-history", input.id],
      });
      void client.invalidateQueries({ queryKey: ["risks"] });
    },
  });
}

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
      void client.invalidateQueries({
        queryKey: ["incidents", "control-weakness-history", input.id],
      });
      void client.invalidateQueries({ queryKey: ["controls"] });
    },
  });
}

export const useIncidentRiskOptions = (
  id: string | undefined,
  query: {
    q: string;
    scope: "linked" | "unlinked";
    page: number;
    limit: number;
  },
) =>
  useQuery({
    queryKey: ["incidents", "risk-options", id, query],
    queryFn: ({ signal }) => getIncidentRiskOptions(id ?? "", query, signal),
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
export function useUnlinkIncidentFromRisk() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: unlinkIncidentFromRisk,
    retry: false,
    onSuccess: (_data, input) => {
      void client.invalidateQueries({ queryKey: ["incidents"] });
      void client.invalidateQueries({
        queryKey: ["incidents", "risk-options", input.incidentId],
      });
      void client.invalidateQueries({ queryKey: ["risks"] });
    },
  });
}

export const useIncidentControlOptions = (
  id: string | undefined,
  query: {
    q: string;
    scope: "linked" | "unlinked";
    page: number;
    limit: number;
  },
) =>
  useQuery({
    queryKey: ["incidents", "control-options", id, query],
    queryFn: ({ signal }) => getIncidentControlOptions(id ?? "", query, signal),
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

export function useUnlinkIncidentFromControl() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: unlinkIncidentFromControl,
    retry: false,
    onSuccess: (_data, input) => {
      void client.invalidateQueries({ queryKey: ["incidents"] });
      void client.invalidateQueries({
        queryKey: ["incidents", "control-options", input.incidentId],
      });
      void client.invalidateQueries({ queryKey: ["controls"] });
    },
  });
}

export const useIncidentAssetOptions = (
  id: string | undefined,
  query: {
    q: string;
    scope: "linked" | "unlinked";
    page: number;
    limit: number;
  },
) =>
  useQuery({
    queryKey: ["incidents", "asset-options", id, query],
    queryFn: ({ signal }) => getIncidentAssetOptions(id ?? "", query, signal),
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

export function useUnlinkIncidentFromAsset() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: unlinkIncidentFromAsset,
    retry: false,
    onSuccess: (_data, input) => {
      void client.invalidateQueries({ queryKey: ["incidents"] });
      void client.invalidateQueries({
        queryKey: ["incidents", "asset-options", input.incidentId],
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
export const useIncidentSourceOptions = (enabled: boolean) =>
  useQuery({
    queryKey: ["incidents", "source-options"],
    queryFn: ({ signal }) => listIncidentSourceOptions(signal),
    enabled,
    retry: false,
  });
export const useIncidentClassificationQueue = (
  page: number,
  filters: {
    search: string;
    severity: string;
    status: string;
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
