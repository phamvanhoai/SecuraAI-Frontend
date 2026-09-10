"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { assignAssetOwner } from "../api/assign-asset-owner";
import type { AssignAssetOwnerRequest } from "../schemas/assign-asset-owner-schema";

export function useAssignAssetOwner(assetId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AssignAssetOwnerRequest) => {
      if (!assetId) throw new Error("Không tìm thấy tài sản cần gán chủ sở hữu.");
      return assignAssetOwner(assetId, input);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["assets", "list"] }),
        queryClient.invalidateQueries({ queryKey: ["assets", "detail", assetId] }),
      ]);
    },
  });
}
