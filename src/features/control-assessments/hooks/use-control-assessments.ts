"use client";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { ApiError } from "@/lib/api/api-error";
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
  const refresh = async () => {
    await Promise.all([
      client.invalidateQueries({ queryKey: ["compliance"] }),
      client.invalidateQueries({ queryKey: ["risk-register"] }),
      client.invalidateQueries({ queryKey: ["risks"] }),
      client.invalidateQueries({ queryKey: ["auth", "session"] }),
    ]);
  };
  return useMutation({
    mutationFn: createControlAssessment,
    retry: false,
    onSuccess: refresh,
    onError: async (error) => {
      if (error instanceof ApiError && [401, 403, 409].includes(error.status))
        await refresh();
    },
  });
}
