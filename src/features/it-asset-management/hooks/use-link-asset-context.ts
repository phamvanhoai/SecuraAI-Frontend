"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api/api-error";
import { linkAssetContext } from "../api/link-asset-context";
import type { LinkAssetContextRequest } from "../schemas/link-asset-context-schema";

export function useLinkAssetContext(assetId: string | null) {
  const queryClient = useQueryClient();
  const refresh = async () => { await Promise.all([queryClient.invalidateQueries({ queryKey: ["assets", "list"] }), queryClient.invalidateQueries({ queryKey: ["assets", "detail", assetId] })]); };
  return useMutation({ mutationFn: (input: LinkAssetContextRequest) => { if (!assetId) throw new Error("Asset is unavailable."); return linkAssetContext(assetId, input); }, onSuccess: refresh, onError: async (error) => { if (error instanceof ApiError && (error.status === 403 || error.status === 409)) await refresh(); } });
}
