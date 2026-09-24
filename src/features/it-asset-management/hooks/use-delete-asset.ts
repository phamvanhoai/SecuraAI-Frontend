"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteAsset } from "../api/delete-asset";

export function useDeleteAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAsset,
    onSuccess: async (_data, assetId) => {
      queryClient.removeQueries({ queryKey: ["assets", "detail", assetId] });
      await queryClient.invalidateQueries({ queryKey: ["assets", "list"] });
    },
  });
}
