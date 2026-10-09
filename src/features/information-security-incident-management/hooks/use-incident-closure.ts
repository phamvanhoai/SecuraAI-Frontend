"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api/api-error";
import { closeIncident, getIncidentClosure } from "../api/incident-closure";
export function useIncidentClosure(id: string | undefined) {
  return useQuery({
    queryKey: ["incidents", "closure", id],
    queryFn: ({ signal }) => getIncidentClosure(id ?? "", signal),
    enabled: Boolean(id),
    retry: false,
  });
}
export function useCloseIncident() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: closeIncident,
    retry: false,
    onSuccess: async () => {
      await client.invalidateQueries({
        queryKey: ["incidents"],
        refetchType: "all",
      });
    },
    onError: (error) => {
      if (error instanceof ApiError && [403, 404, 409].includes(error.status))
        void client.invalidateQueries({
          queryKey: ["incidents"],
          refetchType: "all",
        });
    },
  });
}
