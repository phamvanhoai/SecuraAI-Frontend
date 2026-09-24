"use client";

import { useQuery } from "@tanstack/react-query";
import { getUser } from "../api/users";
import { userKeys } from "./use-users";

export function useUserDetail(userId: string | null) {
  return useQuery({
    queryKey: [...userKeys.all, "detail", userId] as const,
    queryFn: ({ signal }) => getUser(userId ?? "", signal),
    enabled: userId !== null,
  });
}
