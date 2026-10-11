"use client";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createControlAssessment,
  listControlAssessments,
} from "../api/control-assessments";
const key = ["compliance", "control-assessments"] as const;
export const useControlAssessments = (
  query: { page: number; limit: number; q?: string },
  enabled: boolean,
) =>
  useQuery({
    queryKey: [...key, query],
    queryFn: ({ signal }) => listControlAssessments(query, signal),
    enabled,
    // Keep the current table visible while changing pages/searches instead of
    // flashing a full loading state for every request.
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });
export function useCreateControlAssessment() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: createControlAssessment,
    retry: false,
    onSuccess: () => client.invalidateQueries({ queryKey: key }),
  });
}
