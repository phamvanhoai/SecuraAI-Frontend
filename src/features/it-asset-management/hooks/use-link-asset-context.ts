"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { linkAssetContext } from "../api/link-asset-context";
import type { LinkAssetContextRequest } from "../schemas/link-asset-context-schema";

export function useLinkAssetContext(assetId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: (input: LinkAssetContextRequest) => { if (!assetId) throw new Error("Asset is unavailable."); return linkAssetContext(assetId, input); }, onSuccess: async () => { await Promise.all([queryClient.invalidateQueries({ queryKey: ["assets", "list"] }), queryClient.invalidateQueries({ queryKey: ["assets", "detail", assetId] })]); } });
}
