import { apiRequest } from "@/lib/api/api-client";
import {
  eventGovernanceLifecycleSummarySchema,
  eventGovernancePolicySchema,
  paginatedEventGovernancePoliciesSchema,
  type EventGovernanceLifecycleSummary,
  type EventGovernancePolicy,
  type ListEventGovernancePoliciesParams,
  type PaginatedEventGovernancePolicies,
} from "../schemas/event-governance-schema";

export async function listEventGovernancePolicies(
  params?: ListEventGovernancePoliciesParams,
): Promise<PaginatedEventGovernancePolicies> {
  const searchParams = new URLSearchParams();
  if (params?.page !== undefined) searchParams.set("page", String(params.page));
  if (params?.limit !== undefined) searchParams.set("limit", String(params.limit));
  if (params?.search) searchParams.set("search", params.search);
  if (params?.eventFamily) searchParams.set("eventFamily", params.eventFamily);
  if (params?.status) searchParams.set("status", params.status);
  if (params?.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params?.sortOrder) searchParams.set("sortOrder", params.sortOrder);

  const queryStr = searchParams.toString();
  const url = `/api/event-governance/policies${queryStr ? `?${queryStr}` : ""}`;

  const data = await apiRequest<unknown>(url, {
    target: "same-origin",
    method: "GET",
  });

  return paginatedEventGovernancePoliciesSchema.parse(data);
}

export async function getEventGovernancePolicy(id: string): Promise<EventGovernancePolicy> {
  const data = await apiRequest<unknown>(
    `/api/event-governance/policies/${encodeURIComponent(id)}`,
    {
      target: "same-origin",
      method: "GET",
    },
  );

  return eventGovernancePolicySchema.parse(data);
}

export async function getEventGovernanceLifecycleSummary(): Promise<EventGovernanceLifecycleSummary> {
  const data = await apiRequest<unknown>("/api/event-governance/policies/summary", {
    target: "same-origin",
    method: "GET",
  });

  return eventGovernanceLifecycleSummarySchema.parse(data);
}
