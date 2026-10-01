"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { assignUserAccess, getAccessAssignmentOptions, getUserAccessAssignment, type AccessAssignmentPayload } from "../api/assign-user-roles";
import { userKeys } from "./use-users";

export function useAccessAssignmentOptions(enabled: boolean) {
  return useQuery({ queryKey: [...userKeys.all, "access-assignment-options"], queryFn: ({ signal }) => getAccessAssignmentOptions(signal), enabled, staleTime: 60_000 });
}

export function useUserAccessAssignment(userId: string | null) {
  return useQuery({ queryKey: [...userKeys.all, userId, "access-assignment"], queryFn: ({ signal }) => getUserAccessAssignment(userId!, signal), enabled: userId !== null });
}

export function useAssignUserAccess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, payload }: { userId: string; payload: AccessAssignmentPayload }) => assignUserAccess(userId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userKeys.all }),
  });
}
