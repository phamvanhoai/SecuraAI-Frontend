"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createUser } from "../api/users";
import { userKeys } from "./use-users";

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userKeys.all }),
  });
}