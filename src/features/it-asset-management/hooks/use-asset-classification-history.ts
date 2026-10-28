"use client";
import { useQuery } from "@tanstack/react-query";
import { getAssetClassificationHistory } from "../api/get-asset-classification-history";

export function useAssetClassificationHistory(
  assetId: string | null,
  page: number,
) {
  return useQuery({
    queryKey: ["assets", "classification-history", assetId, page],
    queryFn: ({ signal }) =>
      getAssetClassificationHistory(assetId ?? "", page, signal),
    enabled: assetId !== null,
  });
}
