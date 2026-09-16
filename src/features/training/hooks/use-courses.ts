"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  assignCourse,
  createCourse,
  getAssignmentOptions,
  getLatestCourseAssignment,
  listCourses,
} from "../api/courses";
import type { AssignCourseInput } from "../schemas/course-schema";

export function useCourses(page: number, q: string, enabled: boolean) {
  return useQuery({
    queryKey: ["training", "courses", page, q],
    queryFn: ({ signal }) => listCourses(page, q, signal),
    enabled,
  });
}

export function useCreateCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCourse,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["training", "courses"],
      });
    },
    retry: false,
  });
}

export function useAssignmentOptions(
  userQ: string,
  departmentQ: string,
  enabled: boolean,
) {
  return useQuery({
    queryKey: ["training", "assignment-options", userQ, departmentQ],
    queryFn: ({ signal }) => getAssignmentOptions(userQ, departmentQ, signal),
    enabled,
    placeholderData: (previous) => previous,
  });
}

export function useAssignCourse() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      courseId,
      input,
    }: {
      courseId: string;
      input: AssignCourseInput;
    }) => assignCourse(courseId, input),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ["training"] });
    },
    retry: false,
  });
}

export function useLatestCourseAssignment(courseId: string | undefined) {
  return useQuery({
    queryKey: ["training", "course-assignment", courseId],
    queryFn: ({ signal }) => getLatestCourseAssignment(courseId ?? "", signal),
    enabled: Boolean(courseId),
  });
}
