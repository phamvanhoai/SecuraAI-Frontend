"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createControlAssessment, getAssessmentHistory, listControlAssessments } from "../api/control-assessments";
const key = ["compliance", "control-assessments"] as const;
export const useControlAssessments = (query: { page: number; limit: number; q?: string; frameworkId?: string; status?: string; reviewState?: string }, enabled: boolean) => useQuery({ queryKey: [...key, query], queryFn: ({ signal }) => listControlAssessments(query, signal), enabled });
export const useAssessmentHistory = (controlId?: string) => useQuery({ queryKey: [...key, "history", controlId], queryFn: ({ signal }) => getAssessmentHistory(controlId ?? "", signal), enabled: Boolean(controlId) });
export function useCreateControlAssessment() { const client = useQueryClient(); return useMutation({ mutationFn: createControlAssessment, retry: false, onSuccess: () => client.invalidateQueries({ queryKey: key }) }); }
