"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  decideMfaRecoveryRequest,
  listMfaRecoveryRequests,
} from "../api/mfa-recovery";
import type { MfaRecoveryStatus } from "../schemas/mfa-recovery-schema";

export const mfaRecoveryKeys = { all: ["mfa-recovery-requests"] as const };

export function useMfaRecoveryRequests(
  query: { page: number; limit: number; status?: MfaRecoveryStatus },
  enabled: boolean,
) {
  return useQuery({
    queryKey: [...mfaRecoveryKeys.all, query],
    queryFn: ({ signal }) => listMfaRecoveryRequests(query, signal),
    enabled,
  });
}

export function useDecideMfaRecoveryRequest() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      id: string;
      decision: "approve" | "reject";
      reason: string;
    }) => decideMfaRecoveryRequest(input.id, input.decision, input.reason),
    onSuccess: () =>
      client.invalidateQueries({ queryKey: mfaRecoveryKeys.all }),
  });
}
