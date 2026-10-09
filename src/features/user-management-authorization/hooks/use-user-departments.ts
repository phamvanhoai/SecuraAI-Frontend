"use client";

import { useQuery } from "@tanstack/react-query";
import { getUserDepartments } from "../api/users";
import { userKeys } from "./use-users";

export function useUserDepartments(enabled: boolean) {
  return useQuery({
    queryKey: [...userKeys.all, "departments"] as const,
    queryFn: ({ signal }) => getUserDepartments(signal),
    enabled,
    staleTime: 60_000,
  });
}
