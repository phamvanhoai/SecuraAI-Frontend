"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getMyAssessment,
  listMyAssessments,
  submitMyAssessment,
} from "../api/assessments";
import type { AssessmentAnswer } from "../schemas/assessment-schema";

export function useMyAssessments(page: number, enabled: boolean) {
  return useQuery({
    queryKey: ["training", "my-assessments", page],
    queryFn: ({ signal }) => listMyAssessments(page, signal),
    enabled,
  });
}

export function useAssessmentDetail(enrollmentId: string | undefined) {
  return useQuery({
    queryKey: ["training", "assessment", enrollmentId],
    queryFn: ({ signal }) => getMyAssessment(enrollmentId ?? "", signal),
    enabled: Boolean(enrollmentId),
  });
}

export function useSubmitAssessment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      enrollmentId,
      answers,
    }: {
      enrollmentId: string;
      answers: readonly AssessmentAnswer[];
    }) => submitMyAssessment(enrollmentId, answers),
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["training", "my-assessments"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["training", "assessment", variables.enrollmentId],
        }),
      ]);
    },
    retry: false,
  });
}
