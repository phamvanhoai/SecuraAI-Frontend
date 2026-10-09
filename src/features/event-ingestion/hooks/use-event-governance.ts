import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import {
  getEventGovernanceLifecycleSummary,
  getEventGovernancePolicy,
  listEventGovernancePolicies,
  updateEventGovernancePolicy,
} from "../api/event-governance";
import type {
  EventGovernanceLifecycleSummary,
  EventGovernancePolicy,
  ListEventGovernancePoliciesParams,
  PaginatedEventGovernancePolicies,
  UpdateEventGovernancePolicyForm,
} from "../schemas/event-governance-schema";

export function useEventGovernancePolicies(params?: ListEventGovernancePoliciesParams) {
  return useQuery<PaginatedEventGovernancePolicies, Error>({
    queryKey: ["event-governance", "policies", params],
    queryFn: () => listEventGovernancePolicies(params),
  });
}

export function useEventGovernancePolicyDetail(id: string | null) {
  return useQuery<EventGovernancePolicy, Error>({
    queryKey: ["event-governance", "policies", "detail", id],
    queryFn: () => {
      if (!id) throw new Error("Policy ID is required");
      return getEventGovernancePolicy(id);
    },
    enabled: Boolean(id),
  });
}

export function useEventGovernanceSummary() {
  return useQuery<EventGovernanceLifecycleSummary, Error>({
    queryKey: ["event-governance", "policies", "summary"],
    queryFn: () => getEventGovernanceLifecycleSummary(),
  });
}

export function useUpdateEventGovernancePolicy() {
  const queryClient = useQueryClient();

  return useMutation<
    EventGovernancePolicy,
    Error,
    { id: string; values: UpdateEventGovernancePolicyForm }
  >({
    mutationFn: ({ id, values }) => updateEventGovernancePolicy(id, values),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["event-governance", "policies"] });
      queryClient.invalidateQueries({
        queryKey: ["event-governance", "policies", "detail", id],
      });
      queryClient.invalidateQueries({
        queryKey: ["event-governance", "policies", "summary"],
      });
    },
  });
}
