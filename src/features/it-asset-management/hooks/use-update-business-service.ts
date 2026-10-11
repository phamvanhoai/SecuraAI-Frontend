"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api/api-error";
import { updateBusinessService } from "../api/business-services";
import type { UpdateBusinessServiceInput } from "../schemas/update-business-service-schema";
export function useUpdateBusinessService(id?: string) {
  const client = useQueryClient();
  const refresh = async () => {
    await Promise.all([
      client.invalidateQueries({ queryKey: ["business-services"] }),
      client.invalidateQueries({ queryKey: ["assets"] }),
      client.invalidateQueries({ queryKey: ["risk-register"] }),
      client.invalidateQueries({ queryKey: ["risks"] }),
    ]);
  };
  return useMutation({
    mutationFn: (input: UpdateBusinessServiceInput) => {
      if (!id) throw new Error("Service unavailable");
      return updateBusinessService(id, input);
    },
    retry: false,
    onSuccess: refresh,
    onError: async (error) => {
      if (error instanceof ApiError && [403, 404, 409].includes(error.status))
        await refresh();
      if (error instanceof ApiError && [401, 403].includes(error.status))
        await client.invalidateQueries({ queryKey: ["auth", "session"] });
    },
  });
}
