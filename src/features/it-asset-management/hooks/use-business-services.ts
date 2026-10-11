"use client";
import { useQuery } from "@tanstack/react-query";
import { ApiError } from "@/lib/api/api-error";
import {
  getBusinessService,
  listBusinessServiceAssets,
  listBusinessServices,
} from "../api/business-services";
import type { BusinessServiceListQuery } from "../schemas/business-service-schema";

// A lost permission or missing record is a normal workflow outcome, not a
// transient server failure. Do not automatically retry it.
const retry = (count: number, error: Error) =>
  !(error instanceof ApiError && [401, 403, 404, 422].includes(error.status)) &&
  count < 2;
export function useBusinessServices(
  query: BusinessServiceListQuery,
  enabled: boolean,
) {
  return useQuery({
    queryKey: ["business-services", "list", query],
    queryFn: ({ signal }) => listBusinessServices(query, signal),
    enabled,
    retry,
  });
}
export function useBusinessService(
  id: string,
  enabled: boolean,
  fresh = false,
) {
  return useQuery({
    queryKey: ["business-services", "detail", id],
    queryFn: ({ signal }) => getBusinessService(id, signal),
    refetchOnMount: fresh ? "always" : true,
    enabled,
    retry,
  });
}
export function useBusinessServiceAssets(
  id: string,
  page: number,
  enabled: boolean,
) {
  return useQuery({
    queryKey: ["business-services", "detail", id, "assets", page],
    queryFn: ({ signal }) => listBusinessServiceAssets(id, page, signal),
    enabled,
    retry,
  });
}
