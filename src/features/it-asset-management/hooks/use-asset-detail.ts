"use client";

import { useQuery } from "@tanstack/react-query";
import { getAssetDetail } from "../api/get-asset-detail";

export function useAssetDetail(assetId: string | null) {
  return useQuery({
    queryKey: ["assets", "detail", assetId],
    queryFn: ({ signal }) => getAssetDetail(assetId ?? "", signal),
    enabled: assetId !== null,
  });
}
