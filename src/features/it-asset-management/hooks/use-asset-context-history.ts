"use client";
import { useQuery } from "@tanstack/react-query";
import { getAssetContextHistory } from "../api/get-asset-context-history";

export function useAssetContextHistory(assetId: string | null, page: number) {
  return useQuery({
    queryKey: ["assets", "context-history", assetId, page],
    queryFn: ({ signal }) =>
      getAssetContextHistory(assetId ?? "", page, signal),
    enabled: assetId !== null,
  });
}
