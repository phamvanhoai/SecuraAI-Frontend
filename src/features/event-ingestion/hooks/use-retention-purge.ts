import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getRetentionPurgeStatus, runRetentionPurge } from "../api/retention-purge";
import type {
  RetentionPurgeRunResult,
  RetentionPurgeStatus,
  RunRetentionPurgeInput,
} from "../schemas/retention-purge-schema";

export function useRetentionPurgeStatus(options?: { enabled?: boolean }) {
  return useQuery<RetentionPurgeStatus, Error>({
    queryKey: ["event-governance", "retention-purge", "status"],
    queryFn: () => getRetentionPurgeStatus(),
    enabled: options?.enabled ?? true,
  });
}

export function useRunRetentionPurge() {
  const queryClient = useQueryClient();

  return useMutation<RetentionPurgeRunResult, Error, RunRetentionPurgeInput | undefined>({
    mutationFn: (payload) => runRetentionPurge(payload),
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: ["event-governance", "retention-purge", "status"],
      });
      if (
        !result.dryRun &&
        (result.totalDeletedNormalizedEvents > 0 || result.totalDeletedInvalidEvents > 0)
      ) {
        queryClient.invalidateQueries({ queryKey: ["normalized-events"] });
      }
    },
  });
}
