"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { changePassword } from "../api/change-password";

export function useChangePassword() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["auth", "change-password"],
    mutationFn: changePassword,
    retry: false,
    onMutate: () => queryClient.cancelQueries({ queryKey: ["auth", "session"] }),
  });
}
