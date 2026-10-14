"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api/api-error";
import { useId } from "react";
import {
  createControl,
  editControl,
  getCatalogControl,
  listControlOwners,
} from "../api/control-catalog";
export function useCatalogControl(id: string | undefined) {
  const editorInstance = useId();
  return useQuery({
    queryKey: ["compliance", "control-catalog", id, editorInstance],
    queryFn: ({ signal }) => getCatalogControl(id ?? "", signal),
    enabled: Boolean(id),
    retry: false,
    staleTime: 0,
    refetchOnWindowFocus: false,
    gcTime: 0,
  });
}
export function useControlOwners(q: string, enabled: boolean) {
  return useQuery({
    queryKey: ["compliance", "control-owners", q],
    queryFn: ({ signal }) => listControlOwners(q, signal),
    enabled,
    retry: false,
  });
}
export function useSaveCatalogControl() {
  const client = useQueryClient();
  const refresh = async () => {
    await Promise.all([
      client.invalidateQueries({ queryKey: ["compliance"] }),
      client.invalidateQueries({ queryKey: ["risks"] }),
      client.invalidateQueries({ queryKey: ["risk-register"] }),
      client.invalidateQueries({ queryKey: ["assets"] }),
      client.invalidateQueries({ queryKey: ["auth", "session"] }),
    ]);
  };
  return useMutation({
    mutationFn: (
      input:
        | { mode: "create"; body: Parameters<typeof createControl>[0] }
        | {
            mode: "edit";
            id: string;
            body: Parameters<typeof editControl>[0]["body"];
          },
    ) =>
      input.mode === "create" ? createControl(input.body) : editControl(input),
    retry: false,
    onSuccess: refresh,
    onError: async (error) => {
      if (error instanceof ApiError && [401, 403, 409].includes(error.status))
        await refresh();
    },
  });
}
