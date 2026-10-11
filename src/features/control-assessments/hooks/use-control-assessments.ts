"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
  });
export function useCreateControlAssessment() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: createControlAssessment,
    retry: false,
    onSuccess: () => client.invalidateQueries({ queryKey: key }),
  });
}
