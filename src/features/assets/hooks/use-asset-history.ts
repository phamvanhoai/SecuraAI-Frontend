"use client";

import { useQuery } from "@tanstack/react-query";
import { getAssetHistory } from "../api/get-asset-history";
import type { AssetHistoryQuery } from "../schemas/asset-history-schema";

export function useAssetHistory(assetId: string | null, query: AssetHistoryQuery) {
  return useQuery({
    queryKey: ["assets", "history", assetId, query],
    queryFn: () => getAssetHistory(assetId ?? "", query),
    enabled: assetId !== null,
  });
}
