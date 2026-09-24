"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateAsset } from "../api/update-asset";
import type { UpdateAssetRequest } from "../schemas/update-asset-schema";

export function useUpdateAsset(assetId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateAssetRequest) => {
      if (!assetId) throw new Error("Không tìm thấy tài sản cần cập nhật.");
      return updateAsset(assetId, input);
    },
    onSuccess: (asset) => {
      queryClient.setQueryData(["assets", "detail", asset.id], asset);
      return queryClient.invalidateQueries({ queryKey: ["assets", "list"] });
    },
  });
}
