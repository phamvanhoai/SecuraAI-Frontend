"use client";

import { useQuery } from "@tanstack/react-query";
import { getAssetCreateOptions } from "../api/get-asset-create-options";

export function useAssetCreateOptions(enabled: boolean) {
  return useQuery({
    queryKey: ["assets", "create-options"],
    queryFn: getAssetCreateOptions,
    enabled,
    staleTime: 60_000,
  });
}
