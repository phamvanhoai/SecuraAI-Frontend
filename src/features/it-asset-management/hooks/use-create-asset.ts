"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createAsset } from "../api/create-asset";

export function useCreateAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAsset,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["assets", "list"] }),
  });
}
