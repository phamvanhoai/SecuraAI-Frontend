import { apiRequest } from "@/lib/api/api-client";
import {
  assignCourseSchema,
  assignmentOptionsSchema,
  courseAssignmentSchema,
  courseListSchema,
  courseSchema,
  createCourseSchema,
  type AssignCourseInput,
  type CreateCourseInput,
} from "../schemas/course-schema";

export async function listCourses(
  page: number,
  q: string,
  signal?: AbortSignal,
) {
  return courseListSchema.parse(
    await apiRequest<unknown>("/api/training/courses", {
      target: "same-origin",
      query: { page, limit: 20, ...(q ? { q } : {}) },
      ...(signal ? { signal } : {}),
    }),
  );
}

export async function createCourse(input: CreateCourseInput) {
  const parsed = createCourseSchema.parse(input);
  return courseSchema.parse(
    await apiRequest<unknown>("/api/training/courses", {
      method: "POST",
      target: "same-origin",
      body: {
        title: parsed.title,
        description: parsed.description || null,
        content: parsed.content,
      },
    }),
  );
}

export async function getAssignmentOptions(signal?: AbortSignal) {
  return assignmentOptionsSchema.parse(
    await apiRequest<unknown>("/api/training/assignment-options", {
      target: "same-origin",
      ...(signal ? { signal } : {}),
    }),
  );
}

export async function assignCourse(courseId: string, input: AssignCourseInput) {
  return courseAssignmentSchema.parse(
    await apiRequest<unknown>(
      `/api/training/courses/${encodeURIComponent(courseId)}/assignments`,
      {
        method: "POST",
        target: "same-origin",
        body: assignCourseSchema.parse(input),
      },
    ),
  );
}
