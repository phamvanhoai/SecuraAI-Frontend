"use client";
import { useQuery } from "@tanstack/react-query";
import { getAssetOwnerOptions } from "../api/get-asset-owner-options";
export function useAssetOwnerOptions(enabled: boolean, q: string) {
  return useQuery({ queryKey: ["assets", "owner-options", q], enabled, retry: false,
    queryFn: ({ signal }) => getAssetOwnerOptions(q, signal) });
}
