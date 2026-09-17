"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listEvidenceAssessments, uploadEvidence } from "../api/compliance-evidence";
const key = ["compliance", "evidence"] as const;
export const useEvidenceAssessments = (query: { page: number; limit: number; q?: string }, enabled: boolean) => useQuery({ queryKey: [...key, query], queryFn: ({ signal }) => listEvidenceAssessments(query, signal), enabled });
export function useUploadEvidence() { const client = useQueryClient(); return useMutation({ mutationFn: uploadEvidence, retry: false, onSuccess: () => client.invalidateQueries({ queryKey: key }) }); }
