"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createIntegration,
  createSyncSchedule,
  deleteSyncSchedule,
  getIntegrationById,
  listIntegrationLogs,
  listIntegrations,
  listSyncJobs,
  listSyncSchedules,
  testIntegrationConnection,
  triggerIntegrationSync,
  updateIntegration,
  updateSyncSchedule,
  type ListIntegrationLogsInput,
  type ListIntegrationsInput,
  type ListSyncJobsInput,
} from "../api/integrations";
import type {
  CreateIntegrationInput,
  CreateSyncScheduleInput,
  UpdateIntegrationInput,
  UpdateSyncScheduleInput,
} from "../schemas/integration-schema";

export const integrationKeys = {
  all: ["integrations"] as const,
  list: (input: Omit<ListIntegrationsInput, "signal">) =>
    [...integrationKeys.all, "list", input] as const,
  detail: (id: string) => [...integrationKeys.all, "detail", id] as const,
  schedules: (id: string) => [...integrationKeys.all, "schedules", id] as const,
  jobs: (input: Omit<ListSyncJobsInput, "signal">) =>
    [...integrationKeys.all, "jobs", input] as const,
  logs: (input: Omit<ListIntegrationLogsInput, "signal">) =>
    [...integrationKeys.all, "logs", input] as const,
};

export function useIntegrations(
  input: Omit<ListIntegrationsInput, "signal"> = {},
) {
  return useQuery({
    queryKey: integrationKeys.list(input),
    queryFn: ({ signal }) => listIntegrations({ ...input, signal }),
  });
}

export function useIntegration(id: string) {
  return useQuery({
    queryKey: integrationKeys.detail(id),
    queryFn: ({ signal }) => getIntegrationById(id, signal),
    enabled: Boolean(id),
  });
}

export function useCreateIntegration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateIntegrationInput) => createIntegration(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: integrationKeys.all });
    },
  });
}

export function useUpdateIntegration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: UpdateIntegrationInput;
    }) => updateIntegration(id, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: integrationKeys.all });
      queryClient.invalidateQueries({
        queryKey: integrationKeys.detail(variables.id),
      });
    },
  });
}

export function useTestConnection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      timeoutMs,
    }: {
      id: string;
      timeoutMs?: number | undefined;
    }) =>
      testIntegrationConnection(
        id,
        timeoutMs !== undefined ? { timeoutMs } : undefined,
      ),
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({ queryKey: integrationKeys.all });
      queryClient.invalidateQueries({
        queryKey: integrationKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({
        queryKey: [...integrationKeys.all, "logs"],
      });
    },
  });
}

export function useTriggerSync() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      syncScheduleId,
    }: {
      id: string;
      syncScheduleId?: string | undefined;
    }) => triggerIntegrationSync(id, syncScheduleId ? { syncScheduleId } : undefined),
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({ queryKey: integrationKeys.all });
      queryClient.invalidateQueries({
        queryKey: integrationKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({
        queryKey: [...integrationKeys.all, "sync-jobs"],
      });
      queryClient.invalidateQueries({
        queryKey: [...integrationKeys.all, "logs"],
      });
    },
  });
}

export function useSyncSchedules(integrationId: string) {
  return useQuery({
    queryKey: integrationKeys.schedules(integrationId),
    queryFn: ({ signal }) => listSyncSchedules(integrationId, signal),
    enabled: Boolean(integrationId),
  });
}

export function useCreateSyncSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      integrationId,
      input,
    }: {
      integrationId: string;
      input: CreateSyncScheduleInput;
    }) => createSyncSchedule(integrationId, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: integrationKeys.schedules(variables.integrationId),
      });
    },
  });
}

export function useUpdateSyncSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      integrationId,
      scheduleId,
      input,
    }: {
      integrationId: string;
      scheduleId: string;
      input: UpdateSyncScheduleInput;
    }) => updateSyncSchedule(integrationId, scheduleId, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: integrationKeys.schedules(variables.integrationId),
      });
    },
  });
}

export function useDeleteSyncSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      integrationId,
      scheduleId,
    }: {
      integrationId: string;
      scheduleId: string;
    }) => deleteSyncSchedule(integrationId, scheduleId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: integrationKeys.schedules(variables.integrationId),
      });
    },
  });
}

export function useSyncJobs(input: Omit<ListSyncJobsInput, "signal">) {
  return useQuery({
    queryKey: integrationKeys.jobs(input),
    queryFn: ({ signal }) => listSyncJobs({ ...input, signal }),
    enabled: Boolean(input.integrationId),
  });
}

export function useIntegrationLogs(
  input: Omit<ListIntegrationLogsInput, "signal">,
) {
  return useQuery({
    queryKey: integrationKeys.logs(input),
    queryFn: ({ signal }) => listIntegrationLogs({ ...input, signal }),
    enabled: Boolean(input.integrationId),
  });
}
