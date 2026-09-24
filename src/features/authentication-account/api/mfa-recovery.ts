import { apiRequest } from "@/lib/api/api-client";
import {
  mfaRecoveryListSchema,
  mfaRecoveryRequestSchema,
  type MfaRecoveryList,
  type MfaRecoveryStatus,
} from "../schemas/mfa-recovery-schema";

export async function requestMfaRecovery(): Promise<void> {
  const data = await apiRequest<unknown>(
    "/api/auth/mfa/challenge/recovery-request",
    { method: "POST", target: "same-origin" },
  );
  mfaRecoveryRequestSchema
    .pick({ id: true, status: true, submittedAt: true })
    .parse(data);
}

export async function listMfaRecoveryRequests(
  input: { page: number; limit: number; status?: MfaRecoveryStatus },
  signal?: AbortSignal,
): Promise<MfaRecoveryList> {
  const data = await apiRequest<unknown>("/api/admin/mfa-recovery-requests", {
    method: "GET",
    target: "same-origin",
    query: input,
    ...(signal ? { signal } : {}),
  });
  return mfaRecoveryListSchema.parse(data);
}

export async function decideMfaRecoveryRequest(
  id: string,
  decision: "approve" | "reject",
  reason: string,
): Promise<void> {
  await apiRequest(`/api/admin/mfa-recovery-requests/${id}/${decision}`, {
    method: "POST",
    target: "same-origin",
    body: { reason },
  });
}
