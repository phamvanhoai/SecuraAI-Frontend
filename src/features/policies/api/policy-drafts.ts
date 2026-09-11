import { ApiError } from "@/lib/api/api-error";
import { apiRequest } from "@/lib/api/api-client";
import {
  createdPolicyDraftSchema,
  ownedPolicyDraftSchema,
  policyDraftListSchema,
  type CreatePolicyDraftRequest,
  type CreatedPolicyDraft,
  type OwnedPolicyDraft,
  type PolicyDraftList,
  type PolicyDraftQuery,
  type UpdatePolicyDraftRequest,
} from "../schemas/policy-draft-schema";

function parseContract<T>(
  schema: {
    safeParse: (
      value: unknown,
    ) =>
      | { success: true; data: T }
      | { success: false; error: { flatten: () => unknown } };
  },
  value: unknown,
  message: string,
): T {
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    throw new ApiError(message, 502, "UNKNOWN_ERROR", parsed.error.flatten());
  }
  return parsed.data;
}

export async function listPolicyDrafts(
  query: PolicyDraftQuery,
  signal?: AbortSignal,
): Promise<PolicyDraftList> {
  const data = await apiRequest<unknown>(
    "/api/compliance/policies/drafts/mine",
    {
      target: "same-origin",
      query,
      ...(signal ? { signal } : {}),
    },
  );
  return parseContract(
    policyDraftListSchema,
    data,
    "The policy draft list response has an invalid format.",
  );
}

export async function getPolicyDraft(
  policyId: string,
  versionId: string,
  signal?: AbortSignal,
): Promise<OwnedPolicyDraft> {
  const data = await apiRequest<unknown>(
    `/api/compliance/policies/${policyId}/drafts/${versionId}`,
    { target: "same-origin", ...(signal ? { signal } : {}) },
  );
  return parseContract(
    ownedPolicyDraftSchema,
    data,
    "The policy draft detail response has an invalid format.",
  );
}

export async function createPolicyDraft(
  input: CreatePolicyDraftRequest,
): Promise<CreatedPolicyDraft> {
  const data = await apiRequest<unknown>("/api/compliance/policies", {
    method: "POST",
    target: "same-origin",
    body: input,
  });
  return parseContract(
    createdPolicyDraftSchema,
    data,
    "The create policy draft response has an invalid format.",
  );
}

export async function updatePolicyDraft(
  policyId: string,
  versionId: string,
  input: UpdatePolicyDraftRequest,
): Promise<OwnedPolicyDraft> {
  const data = await apiRequest<unknown>(
    `/api/compliance/policies/${policyId}/drafts/${versionId}`,
    { method: "PATCH", target: "same-origin", body: input },
  );
  return parseContract(
    ownedPolicyDraftSchema,
    data,
    "The update policy draft response has an invalid format.",
  );
}
