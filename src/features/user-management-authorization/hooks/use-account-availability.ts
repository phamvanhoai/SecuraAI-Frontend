"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api/api-error";
import { changeAccountAvailability } from "../api/account-availability";
import { userKeys } from "./use-users";

export function useAccountAvailability() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: changeAccountAvailability,
    retry: false,
    onSuccess: () => client.invalidateQueries({ queryKey: userKeys.all }),
    onError: (error) => {
      if (error instanceof ApiError) {
        if (error.status === 401) void client.invalidateQueries({ queryKey: ["auth", "session"] });
        if ([404, 409, 502].includes(error.status))
          void client.invalidateQueries({ queryKey: userKeys.all });
      }
    },
  });
}
