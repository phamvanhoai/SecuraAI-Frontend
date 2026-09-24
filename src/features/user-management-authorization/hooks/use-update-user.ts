"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateUser } from "../api/users";
import type { UpdateUserPayload } from "../schemas/user-schema";
import { userKeys } from "./use-users";

export function useUpdateUser(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateUserPayload) => updateUser(userId, input),
    onSuccess: (user) => {
      queryClient.setQueryData([...userKeys.all, "detail", userId], user);
      return queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
}
