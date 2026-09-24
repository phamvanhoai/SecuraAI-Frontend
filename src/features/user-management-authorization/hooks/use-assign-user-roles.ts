"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { assignUserRoles, listAssignableRoles } from "../api/assign-user-roles";
import { userKeys } from "./use-users";

export function useAssignableRoles(enabled: boolean) {
  return useQuery({ queryKey: [...userKeys.all, "assignable-roles"],
    queryFn: ({ signal }) => listAssignableRoles(signal), enabled, staleTime: 60_000 });
}

export function useAssignUserRoles() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, roleCodes }: { userId: string; roleCodes: string[] }) => assignUserRoles(userId, roleCodes),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userKeys.all }),
  });
}
