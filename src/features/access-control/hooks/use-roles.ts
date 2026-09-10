"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createRole,
  deleteRole,
  listPermissions,
  listRoles,
  updateRole,
  type ListRolesInput,
} from "../api/roles";
import type { RoleFormValues } from "../schemas/role-schema";

export const roleKeys = {
  all: ["access-control", "roles"] as const,
  list: (input: Omit<ListRolesInput, "signal">) =>
    [...roleKeys.all, "list", input] as const,
};

export function usePermissions() {
  return useQuery({
    queryKey: ["access-control", "permissions"],
    queryFn: ({ signal }) => listPermissions(signal),
  });
}

export function useRoles(input: Omit<ListRolesInput, "signal">) {
  return useQuery({
    queryKey: roleKeys.list(input),
    queryFn: ({ signal }) => listRoles({ ...input, signal }),
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createRole,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: roleKeys.all }),
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: RoleFormValues }) =>
      updateRole(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: roleKeys.all }),
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteRole,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: roleKeys.all }),
  });
}
