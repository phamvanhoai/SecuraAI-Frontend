"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api/api-error";
import {
  listRecoveryActions,
  recordRecoveryAction,
} from "../api/recovery-actions";
export function useRecoveryHistory(id: string | undefined, page: number) {
  return useQuery({
    queryKey: ["incidents", "recovery-history", id, page],
    queryFn: ({ signal }) => listRecoveryActions(id ?? "", page, signal),
    enabled: Boolean(id),
    retry: false,
  });
}
export function useRecordRecoveryAction() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: recordRecoveryAction,
    retry: false,
    onSuccess: async (_data, input) => {
      await client.invalidateQueries({ queryKey: ["incidents"] });
      await client.invalidateQueries({
        queryKey: ["incidents", "recovery-history", input.id],
        refetchType: "all",
      });
    },
    onError: (error) => {
      if (error instanceof ApiError && [403, 404, 409].includes(error.status))
        void client.invalidateQueries({ queryKey: ["incidents"] });
    },
  });
}
