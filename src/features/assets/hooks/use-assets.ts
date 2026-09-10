"use client";

import { useQuery } from "@tanstack/react-query";
import { listAssets } from "../api/list-assets";
import type { AssetListQuery } from "../schemas/asset-list-schema";

export function useAssets(query: AssetListQuery) {
  return useQuery({
    queryKey: ["assets", "list", query],
    queryFn: ({ signal }) => listAssets(query, signal),
  });
}
