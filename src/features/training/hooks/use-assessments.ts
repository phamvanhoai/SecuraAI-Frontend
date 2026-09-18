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

export function useAssessmentDetail(
  enrollmentId: string | undefined,
  lessonId?: string,
) {
  return useQuery({
    queryKey: ["training", "assessment", enrollmentId, lessonId],
    queryFn: ({ signal }) =>
      getMyAssessment(enrollmentId ?? "", signal, lessonId),
    enabled: Boolean(enrollmentId),
  });
}

export function useSubmitAssessment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      enrollmentId,
      answers,
      lessonId,
    }: {
      enrollmentId: string;
      answers: readonly AssessmentAnswer[];
      lessonId?: string;
    }) => submitMyAssessment(enrollmentId, answers, lessonId),
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["training", "my-assessments"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["training", "assessment", variables.enrollmentId],
        }),
        queryClient.invalidateQueries({ queryKey: ["training", "learning"] }),
        queryClient.invalidateQueries({
          queryKey: ["training", "learning-detail", variables.enrollmentId],
        }),
      ]);
    },
    retry: false,
  });
}
