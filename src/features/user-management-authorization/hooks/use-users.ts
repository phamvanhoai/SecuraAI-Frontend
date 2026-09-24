"use client";

import { useQuery } from "@tanstack/react-query";
import { listUsers } from "../api/users";
import type { UserListQuery } from "../schemas/user-schema";

export const userKeys = {
  all: ["users"] as const,
  list: (query: UserListQuery) => [...userKeys.all, "list", query] as const,
};

export function useUsers(query: UserListQuery, enabled = true) {
  return useQuery({
    queryKey: userKeys.list(query),
    queryFn: ({ signal }) => listUsers(query, signal),
    enabled,
  });
}