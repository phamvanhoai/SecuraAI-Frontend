"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createRole,
  deleteRole,
  getRoleMetrics,
  listPermissions,
  listRoles,
  updateRole,
  configureRolePermissions,
  configureUserPermissions,
  getUserPermissions,
  type ListRolesInput,
} from "../api/roles";
import type {
  ConfigureRolePermissionsValues,
  RoleFormValues,
  ConfigureUserPermissionsValues,
} from "../schemas/role-schema";

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

export function useUserPermissions(userId: string | null) {
  return useQuery({
    queryKey: ["access-control", "users", userId, "permissions"],
    queryFn: ({ signal }) => getUserPermissions(userId ?? "", signal),
    enabled: userId !== null,
  });
}

export function useConfigureUserPermissions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      input,
    }: {
      userId: string;
      input: ConfigureUserPermissionsValues;
    }) => configureUserPermissions(userId, input),
    onSuccess: (_data, variables) =>
      queryClient.invalidateQueries({
        queryKey: ["access-control", "users", variables.userId, "permissions"],
      }),
  });
}

export function useRoles(input: Omit<ListRolesInput, "signal">) {
  return useQuery({
    queryKey: roleKeys.list(input),
    queryFn: ({ signal }) => listRoles({ ...input, signal }),
  });
}
export function useRoleMetrics() {
  return useQuery({
    queryKey: [...roleKeys.all, "metrics"],
    queryFn: ({ signal }) => getRoleMetrics(signal),
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
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: Pick<RoleFormValues, "code" | "name" | "description">;
    }) => updateRole(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: roleKeys.all }),
  });
}
export function useConfigureRolePermissions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: ConfigureRolePermissionsValues & { expectedUpdatedAt: string };
    }) => configureRolePermissions(id, input),
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
