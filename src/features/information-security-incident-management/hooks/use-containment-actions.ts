"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api/api-error";
import {
  listContainmentActions,
  recordContainmentAction,
} from "../api/containment-actions";
export function useContainmentHistory(id: string | undefined, page: number) {
  return useQuery({
    queryKey: ["incidents", "containment-history", id, page],
    queryFn: ({ signal }) => listContainmentActions(id ?? "", page, signal),
    enabled: Boolean(id),
    retry: false,
  });
}
export function useRecordContainmentAction() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: recordContainmentAction,
    retry: false,
    onSuccess: async (_data, input) => {
      await client.invalidateQueries({ queryKey: ["incidents"] });
      await client.invalidateQueries({
        queryKey: ["incidents", "containment-history", input.id],
        refetchType: "all",
      });
    },
    onError: (error) => {
      if (error instanceof ApiError && [403, 404, 409].includes(error.status))
        void client.invalidateQueries({ queryKey: ["incidents"] });
    },
  });
}
