import { apiRequest } from "@/lib/api/api-client";
import {
  policyReviewDetailSchema,
  policyRevisionRequestSchema,
  publishablePolicyListSchema,
  publishedPolicySchema,
  type PolicyReviewDetail,
  type PolicyRevisionRequest,
  type PublishablePolicyList,
  type PublishablePolicyQuery,
  type PublishedPolicy,
} from "../schemas/policy-publication-schema";
import type { RequestPolicyRevisionInput } from "../schemas/policy-publication-schema";

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

export async function publishPolicyVersion(input: {
  policyId: string;
  versionId: string;
  effectiveDate?: string;
}): Promise<PublishedPolicy> {
  const data = await apiRequest<unknown>(
    `/api/compliance/policies/${encodeURIComponent(input.policyId)}/versions/${encodeURIComponent(input.versionId)}/publish`,
    {
      target: "same-origin",
      method: "POST",
      body: input.effectiveDate ? { effectiveDate: input.effectiveDate } : {},
    },
  );
  return publishedPolicySchema.parse(data);
}

export async function requestPolicyRevision(input: {
  policyId: string;
  versionId: string;
  body: RequestPolicyRevisionInput;
}): Promise<PolicyRevisionRequest> {
  const data = await apiRequest<unknown>(
    `/api/compliance/policies/${encodeURIComponent(input.policyId)}/versions/${encodeURIComponent(input.versionId)}/revision-requests`,
    { target: "same-origin", method: "POST", body: input.body },
  );
  return policyRevisionRequestSchema.parse(data);
}
