"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteAsset } from "../api/delete-asset";
import { ApiError } from "@/lib/api/api-error";
import type { ArchiveAssetRequest } from "../schemas/archive-asset-schema";

export function useDeleteAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ assetId, ...input }: ArchiveAssetRequest & { assetId: string }) => deleteAsset(assetId, input),
    onSuccess: async (_data, { assetId }) => {
      queryClient.removeQueries({ queryKey: ["assets", "detail", assetId] });
      await queryClient.invalidateQueries({ queryKey: ["assets", "list"] });
    },
    onError: async (error, { assetId }) => {
      if (error instanceof ApiError && [403, 404, 409].includes(error.status)) {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["assets", "list"] }),
          queryClient.invalidateQueries({ queryKey: ["assets", "detail", assetId] }),
        ]);
      }
    },
  });
}
