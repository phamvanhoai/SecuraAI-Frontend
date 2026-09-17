import { apiRequest } from "@/lib/api/api-client";
import {
  complianceFrameworksSchema,
  frameworkControlsSchema,
  policyControlMappingsSchema,
  replacePolicyControlMappingsResponseSchema,
  type FrameworkControlsQuery,
  type PolicyControlMappingQuery,
  type ReplacePolicyControlMappingsRequest,
} from "../schemas/policy-control-mapping-schema";

export async function listPolicyControlMappings(
  query: PolicyControlMappingQuery,
  signal?: AbortSignal,
) {
  const data = await apiRequest<unknown>(
    "/api/compliance/policy-control-mappings",
    {
      target: "same-origin",
      query,
      ...(signal ? { signal } : {}),
    },
  );
  return policyControlMappingsSchema.parse(data);
}

export async function listComplianceFrameworks(signal?: AbortSignal) {
  const data = await apiRequest<unknown>("/api/compliance/frameworks", {
    target: "same-origin",
    ...(signal ? { signal } : {}),
  });
  return complianceFrameworksSchema.parse(data);
}

export async function listFrameworkControls(
  frameworkId: string,
  query: FrameworkControlsQuery,
  signal?: AbortSignal,
) {
  const data = await apiRequest<unknown>(
    `/api/compliance/frameworks/${encodeURIComponent(frameworkId)}/controls`,
    { target: "same-origin", query, ...(signal ? { signal } : {}) },
  );
  return frameworkControlsSchema.parse(data);
}

export async function replacePolicyControlMappings(input: {
  policyId: string;
  versionId: string;
  frameworkId: string;
  body: ReplacePolicyControlMappingsRequest;
}) {
  return replacePolicyControlMappingsResponseSchema.parse(
    await apiRequest<unknown>(
      `/api/compliance/policies/${encodeURIComponent(input.policyId)}/versions/${encodeURIComponent(input.versionId)}/frameworks/${encodeURIComponent(input.frameworkId)}/control-mappings`,
      { target: "same-origin", method: "PUT", body: input.body },
    ),
  );
}
