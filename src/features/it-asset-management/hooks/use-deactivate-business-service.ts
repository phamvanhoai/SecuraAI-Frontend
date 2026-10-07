"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api/api-error";
import {
  checkBusinessServiceDeactivation,
  deactivateBusinessService,
} from "../api/business-services";
import type { DeactivateBusinessServiceInput } from "../schemas/deactivate-business-service-schema";

export function useBusinessServiceDeactivationCheck(id: string) {
  return useQuery({
    queryKey: ["business-services", "deactivation-check", id],
    queryFn: ({ signal }) => checkBusinessServiceDeactivation(id, signal),
    refetchOnMount: "always",
    retry: false,
  });
}
export function useDeactivateBusinessService(id: string) {
  const client = useQueryClient();
  const refresh = async () => {
    await Promise.all([
      // Mark the check stale without replacing the open confirmation/draft.
      // Reopening always loads a fresh check; only list/detail refetch now.
      client.invalidateQueries({ queryKey: ["business-services"], refetchType: "none" }),
      client.invalidateQueries({ queryKey: ["business-services", "list"] }),
      client.invalidateQueries({ queryKey: ["business-services", "detail"] }),
      client.invalidateQueries({ queryKey: ["assets"] }),
      client.invalidateQueries({ queryKey: ["risks"] }),
      client.invalidateQueries({ queryKey: ["risk-register"] }),
    ]);
  };
  return useMutation({
    mutationFn: (input: DeactivateBusinessServiceInput) =>
      deactivateBusinessService(id, input),
    retry: false,
    onSuccess: refresh,
    onError: async (error) => {
      // Even a lost response may have committed; refresh, never automatically retry.
      await refresh();
      if (error instanceof ApiError && [401, 403].includes(error.status))
        await client.invalidateQueries({ queryKey: ["auth", "session"] });
    },
  });
}
