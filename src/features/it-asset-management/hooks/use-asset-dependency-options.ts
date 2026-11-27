"use client";
import { useQuery } from "@tanstack/react-query";
import { getAssetDependencyOptions } from "../api/get-asset-dependency-options";
export function useAssetDependencyOptions(assetId: string | null, q: string, enabled: boolean) {
  return useQuery({
    queryKey: ["assets", "dependency-options", assetId, q],
    enabled: Boolean(assetId) && enabled, staleTime: 0, retry: false,
    queryFn: ({ signal }) => getAssetDependencyOptions(assetId ?? "", q, signal),
  });
}
