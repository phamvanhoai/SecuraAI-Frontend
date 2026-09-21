import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getWorkflowDefinitions } from "../api/workflows";
import type { QueryWorkflowDefinitionsInput, WorkflowListResponse } from "../schemas/workflow-schema";

export const workflowKeys = {
  all: ["workflow-definitions"] as const,
  lists: () => [...workflowKeys.all, "list"] as const,
  list: (query?: QueryWorkflowDefinitionsInput) =>
    [...workflowKeys.lists(), query] as const,
};

export function useWorkflowDefinitions(query?: QueryWorkflowDefinitionsInput) {
  return useQuery<WorkflowListResponse>({
    queryKey: workflowKeys.list(query),
    queryFn: ({ signal }) => getWorkflowDefinitions(query, signal),
    placeholderData: keepPreviousData,
  });
}
