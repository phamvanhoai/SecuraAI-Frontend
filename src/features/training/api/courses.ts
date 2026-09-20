import { apiRequest } from "@/lib/api/api-client";
import {
  assignCourseSchema,
  assignmentOptionsSchema,
  courseAssignmentSchema,
  courseAssignmentDetailSchema,
  courseListSchema,
  courseSchema,
  courseDraftDetailSchema,
  createCourseSchema,
  updateCourseDraftSchema,
  type AssignCourseInput,
  type CourseStatusFilter,
  type CreateCourseInput,
  type UpdateCourseDraftInput,
} from "../schemas/course-schema";

export async function listCourses(
  page: number,
  q: string,
  status: CourseStatusFilter,
  signal?: AbortSignal,
) {
  return courseListSchema.parse(
    await apiRequest<unknown>("/api/training/courses", {
      target: "same-origin",
      query: {
        page,
        limit: 20,
        ...(q ? { q } : {}),
        ...(status !== "all" ? { status } : {}),
      },
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
        status: parsed.status,
        ...(parsed.assessment ? { assessment: parsed.assessment } : {}),
      },
    }),
  );
}

export async function getCourseDraft(courseId: string, signal?: AbortSignal) {
  return courseDraftDetailSchema.parse(
    await apiRequest<unknown>(
      `/api/training/courses/${encodeURIComponent(courseId)}`,
      { target: "same-origin", ...(signal ? { signal } : {}) },
    ),
  );
}

export async function updateCourseDraft(
  courseId: string,
  input: UpdateCourseDraftInput,
) {
  const parsed = updateCourseDraftSchema.parse(input);
  return courseDraftDetailSchema.parse(
    await apiRequest<unknown>(
      `/api/training/courses/${encodeURIComponent(courseId)}`,
      {
        method: "PATCH",
        target: "same-origin",
        body: {
          title: parsed.title,
          description: parsed.description || null,
          content: parsed.content,
          ...(parsed.assessment ? { assessment: parsed.assessment } : {}),
        },
      },
    ),
  );
}

export async function getAssignmentOptions(
  userQ: string,
  departmentQ: string,
  signal?: AbortSignal,
) {
  return assignmentOptionsSchema.parse(
    await apiRequest<unknown>("/api/training/assignment-options", {
      target: "same-origin",
      query: { userQ, departmentQ, limit: 20 },
      ...(signal ? { signal } : {}),
    }),
  );
}

export async function assignCourse(
  courseId: string,
  input: AssignCourseInput,
  createNewCampaign: boolean,
) {
  return courseAssignmentSchema.parse(
    await apiRequest<unknown>(
      `/api/training/courses/${encodeURIComponent(courseId)}/assignments`,
      {
        method: "POST",
        target: "same-origin",
        body: {
          ...assignCourseSchema.parse(input),
          createNewCampaign,
          changeReason: input.changeReason?.trim() || undefined,
        },
      },
    ),
  );
}

export async function getLatestCourseAssignment(
  courseId: string,
  signal?: AbortSignal,
) {
  return courseAssignmentDetailSchema.parse(
    await apiRequest<unknown>(
      `/api/training/courses/${encodeURIComponent(courseId)}/assignments`,
      {
        target: "same-origin",
        ...(signal ? { signal } : {}),
      },
    ),
  );
}
