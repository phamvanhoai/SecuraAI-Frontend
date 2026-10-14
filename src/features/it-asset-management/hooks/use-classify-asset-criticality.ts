"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api/api-error";
import { classifyAssetCriticality } from "../api/classify-asset-criticality";
import type { ClassifyAssetCriticalityRequest } from "../schemas/classify-asset-criticality-schema";

export function useClassifyAssetCriticality(assetId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ClassifyAssetCriticalityRequest) => {
      if (!assetId) throw new Error("Không tìm thấy tài sản cần phân loại.");
      return classifyAssetCriticality(assetId, input);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["assets", "list"] }),
        queryClient.invalidateQueries({
          queryKey: ["assets", "detail", assetId],
        }),
      ]);
    },
    onError: async (error) => {
      if (error instanceof ApiError && [403, 409].includes(error.status)) {
        await queryClient.invalidateQueries({ queryKey: ["assets"] });
      }
    },
  });
}
