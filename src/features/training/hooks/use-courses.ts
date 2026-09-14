"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createCourse, listCourses } from "../api/courses";

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
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ["training", "courses"] }); },
    retry: false,
  });
}
