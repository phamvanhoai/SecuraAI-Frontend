import { apiRequest } from "@/lib/api/api-client";
import {
  approvedPolicySchema,
  policyReviewDetailSchema,
  publishablePolicyListSchema,
  type ApprovedPolicy,
  type PolicyReviewDetail,
  type PublishablePolicyList,
  type PublishablePolicyQuery,
} from "../schemas/policy-publication-schema";

export async function listPublishablePolicies(
  query: PublishablePolicyQuery,
  signal?: AbortSignal,
): Promise<PublishablePolicyList> {
  const data = await apiRequest<unknown>(
    "/api/compliance/policies/drafts/reviewable",
    { target: "same-origin", query, ...(signal ? { signal } : {}) },
  );
  return publishablePolicyListSchema.parse(data);
}

export async function getPolicyReview(
  policyId: string,
  versionId: string,
  signal?: AbortSignal,
): Promise<PolicyReviewDetail> {
  const data = await apiRequest<unknown>(
    `/api/compliance/policies/${encodeURIComponent(policyId)}/versions/${encodeURIComponent(versionId)}/review`,
    { target: "same-origin", ...(signal ? { signal } : {}) },
  );
  return policyReviewDetailSchema.parse(data);
}

export async function approvePolicyForPublication(input: {
  policyId: string;
  versionId: string;
}): Promise<ApprovedPolicy> {
  const data = await apiRequest<unknown>(
    `/api/compliance/policies/${encodeURIComponent(input.policyId)}/versions/${encodeURIComponent(input.versionId)}/approve`,
    {
      target: "same-origin",
      method: "POST",
    },
  );
  return approvedPolicySchema.parse(data);
}
