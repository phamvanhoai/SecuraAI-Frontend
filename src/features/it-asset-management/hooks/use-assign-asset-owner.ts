"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api/api-error";
import { assignAssetOwner } from "../api/assign-asset-owner";
import type { AssignAssetOwnerRequest } from "../schemas/assign-asset-owner-schema";

export function useAssignAssetOwner(assetId: string | null) {
  const queryClient = useQueryClient();
  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["assets", "list"] }),
      queryClient.invalidateQueries({ queryKey: ["assets", "detail", assetId] }),
    ]);
  };
  return useMutation({
    mutationFn: (input: AssignAssetOwnerRequest) => {
      if (!assetId) throw new Error("Không tìm thấy tài sản cần gán chủ sở hữu.");
      return assignAssetOwner(assetId, input);
    },
    onSuccess: refresh,
    onError: async (error) => {
      if (error instanceof ApiError && [403, 404, 409].includes(error.status)) await refresh();
    },
  });
}
