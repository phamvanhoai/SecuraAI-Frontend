"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api/api-error";
import {
  createBusinessService,
  getBusinessServiceOwners,
} from "../api/business-services";

export function useCreateBusinessService() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: createBusinessService,
    retry: false,
    onSuccess: async (service) => {
      client.setQueryData(["business-services", "detail", service.id], service);
      await Promise.all([
        client.invalidateQueries({ queryKey: ["business-services", "list"] }),
        client.invalidateQueries({ queryKey: ["assets", "create-options"] }),
        client.invalidateQueries({ queryKey: ["risks", "create-options"] }),
      ]);
    },
    onError: async (error) => {
      if (error instanceof ApiError && [401, 403].includes(error.status))
        await client.invalidateQueries({ queryKey: ["auth", "session"] });
    },
  });
}
export function useBusinessServiceOwners(q: string, enabled: boolean) {
  return useQuery({
    queryKey: ["business-services", "owners", q],
    queryFn: ({ signal }) => getBusinessServiceOwners(q, signal),
    enabled,
    retry: false,
  });
}
