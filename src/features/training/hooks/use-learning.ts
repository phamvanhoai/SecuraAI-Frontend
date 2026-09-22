"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  completeLesson,
  getMyLearning,
  listMyLearning,
  updateMaterialProgress,
} from "../api/learning";
export const useMyLearning = (page: number) =>
  useQuery({
    queryKey: ["training", "learning", page],
    queryFn: ({ signal }) => listMyLearning(page, signal),
  });
export const useLearningDetail = (id?: string) =>
  useQuery({
    queryKey: ["training", "learning-detail", id],
    queryFn: ({ signal }) => getMyLearning(id ?? "", signal),
    enabled: Boolean(id),
  });
export const useCompleteLesson = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      enrollmentId,
      lessonId,
    }: {
      enrollmentId: string;
      lessonId: string;
    }) => completeLesson(enrollmentId, lessonId),
    retry: false,
    onSuccess: async (_, value) => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ["training", "learning"] }),
        client.invalidateQueries({
          queryKey: ["training", "learning-detail", value.enrollmentId],
        }),
      ]);
    },
  });
};
export const useUpdateMaterialProgress = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (value: {
      enrollmentId: string;
      materialId: string;
      status: "in_progress" | "completed";
    }) =>
      updateMaterialProgress(
        value.enrollmentId,
        value.materialId,
        value.status,
      ),
    retry: false,
    onSuccess: async (_, value) => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ["training", "learning"] }),
        client.invalidateQueries({
          queryKey: ["training", "learning-detail", value.enrollmentId],
        }),
      ]);
    },
  });
};
