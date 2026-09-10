"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { importAssets } from "../api/import-assets";

export function useImportAssets() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: importAssets,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["assets", "list"] }),
  });
}
