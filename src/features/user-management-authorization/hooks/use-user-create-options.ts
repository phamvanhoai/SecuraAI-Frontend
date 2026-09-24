"use client";

import { useQuery } from "@tanstack/react-query";
import { getUserCreateOptions } from "../api/users";
import { userKeys } from "./use-users";

export function useUserCreateOptions(enabled: boolean) {
  return useQuery({
    queryKey: [...userKeys.all, "create-options"] as const,
    queryFn: ({ signal }) => getUserCreateOptions(signal),
    enabled,
    staleTime: 60_000,
  });
}
