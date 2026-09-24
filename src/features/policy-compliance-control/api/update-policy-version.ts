import { ApiError } from "@/lib/api/api-error";
import { apiRequest } from "@/lib/api/api-client";
import {
  newPolicyVersionSchema,
  publishedPoliciesForNewVersionSchema,
  type NewPolicyVersion,
  type PublishedPolicyForNewVersion,
  type UpdatePolicyVersionRequest,
} from "../schemas/update-policy-version-schema";

export async function listPublishedPoliciesForNewVersion(
  signal?: AbortSignal,
): Promise<PublishedPolicyForNewVersion[]> {
  const data = await apiRequest<unknown>(
    "/api/compliance/policies/published/mine",
    { target: "same-origin", ...(signal ? { signal } : {}) },
  );
  return publishedPoliciesForNewVersionSchema.parse(data);
}

export async function updatePolicyAndCreateVersion(
  policyId: string,
  input: UpdatePolicyVersionRequest,
): Promise<NewPolicyVersion> {
  const data = await apiRequest<unknown>(
    `/api/compliance/policies/${encodeURIComponent(policyId)}/versions`,
    { method: "POST", target: "same-origin", body: input },
  );
  const parsed = newPolicyVersionSchema.safeParse(data);
  if (!parsed.success) {
    throw new ApiError(
      "The policy version response has an invalid format.",
      502,
      "UNKNOWN_ERROR",
      parsed.error.flatten(),
    );
  }
  return parsed.data;
}
