"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { importUsers } from "../api/users";
import { userKeys } from "./use-users";

export function useImportUsers() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: importUsers,
    retry: false,
    onSuccess: () => client.invalidateQueries({ queryKey: userKeys.all }),
  });
}
