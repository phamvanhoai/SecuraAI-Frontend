"use client";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { ApiError } from "@/lib/api/api-error";
import {
  addControlEvidence,
  linkControlEvidence,
  unlinkControlEvidence,
  listControlEvidence,
  uploadControlEvidence,
} from "../api/control-evidence";
import type { ControlEvidenceQuery } from "../schemas/control-evidence-schema";
export function useControlEvidence(
  controlId: string,
  query: ControlEvidenceQuery,
) {
  return useQuery({
    queryKey: ["compliance", "control-evidence", controlId, query],
    queryFn: ({ signal }) => listControlEvidence(controlId, query, signal),
    retry: false,
    placeholderData: keepPreviousData,
    staleTime: 15_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });
}
export function useEvidenceMutations() {
  const client = useQueryClient();
  const refresh = async () => {
    await Promise.all([
      client.invalidateQueries({ queryKey: ["compliance"] }),
      client.invalidateQueries({ queryKey: ["risk-register"] }),
      client.invalidateQueries({ queryKey: ["risks"] }),
      client.invalidateQueries({ queryKey: ["auth", "session"] }),
    ]);
  };
  const onError = async (error: Error) => {
    if (
      error instanceof ApiError &&
      [401, 403, 404, 409].includes(error.status)
    )
      await refresh();
  };
  const add = useMutation({
    mutationFn: addControlEvidence,
    retry: false,
    onSuccess: refresh,
    onError,
  });
  const link = useMutation({
    mutationFn: linkControlEvidence,
    retry: false,
    onSuccess: refresh,
    onError,
  });
  const upload = useMutation({
    mutationFn: uploadControlEvidence,
    retry: false,
    onSuccess: refresh,
    onError,
  });
  const unlink = useMutation({
    mutationFn: unlinkControlEvidence,
    retry: false,
    onSuccess: refresh,
    onError,
  });
  return { add, link, unlink, upload };
}
