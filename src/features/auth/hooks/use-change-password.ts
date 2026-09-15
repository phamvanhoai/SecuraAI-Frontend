"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { changePassword } from "../api/change-password";

export function useChangePassword() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: changePassword,
    retry: false,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["auth", "session"] }),
  });
}
