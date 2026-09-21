import { apiRequest } from "@/lib/api/api-client";
import {
  assignCourseSchema,
  assignmentOptionsSchema,
  courseAssignmentSchema,
  courseAssignmentDetailSchema,
  courseListSchema,
  courseSchema,
  courseDraftSchema,
  createCourseSchema,
  updateCourseDraftSchema,
  courseContentSchema,
  type AssignCourseInput,
  type CourseStatusFilter,
  type CreateCourseInput,
  type UpdateCourseDraftInput,
} from "../schemas/course-schema";

export async function getCourseContent(courseId: string, signal?: AbortSignal) {
  return courseContentSchema.parse(
    await apiRequest<unknown>(
      `/api/training/courses/${encodeURIComponent(courseId)}/content`,
      {
        target: "same-origin",
        ...(signal ? { signal } : {}),
      },
    ),
  );
}

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

export async function createCourse(
  input: CreateCourseInput,
  files: Readonly<Record<string, File>> = {},
) {
  const parsed = createCourseSchema.parse(input);
  const payload = {
    title: parsed.title,
    description: parsed.description || null,
    content: parsed.content,
    status: parsed.status,
    ...(parsed.lessons ? { lessons: parsed.lessons } : {}),
    ...(parsed.assessment ? { assessment: parsed.assessment } : {}),
  };
  const keys =
    parsed.lessons?.flatMap((lesson) =>
      lesson.materials.flatMap((material) =>
        material.uploadKey ? [material.uploadKey] : [],
      ),
    ) ?? [];
  const form = new FormData();
  form.append("payload", JSON.stringify(payload));
  for (const key of keys) {
    const file = files[key];
    if (!file) throw new Error("Select the file for every uploaded material.");
    form.append(key, file);
  }
  return courseSchema.parse(
    await apiRequest<unknown>("/api/training/courses", {
      method: "POST",
      target: "same-origin",
      body: keys.length ? form : payload,
    }),
  );
}

export async function getCourseDraft(courseId: string, signal?: AbortSignal) {
  return courseDraftSchema.parse(
    await apiRequest<unknown>(
      `/api/training/courses/${encodeURIComponent(courseId)}`,
      { target: "same-origin", ...(signal ? { signal } : {}) },
    ),
  );
}

export async function updateCourseDraft(
  courseId: string,
  input: UpdateCourseDraftInput,
  files: Readonly<Record<string, File>> = {},
) {
  const parsed = updateCourseDraftSchema.parse(input);
  const lessons = parsed.lessons?.map((lesson) => ({
    ...lesson,
    materials: lesson.materials.map((material) => ({
      title: material.title,
      type: material.type,
      ...(material.content ? { content: material.content } : {}),
      ...(material.externalUrl ? { externalUrl: material.externalUrl } : {}),
      ...(material.uploadKey ? { uploadKey: material.uploadKey } : {}),
      ...(material.existingFileId
        ? { existingFileId: material.existingFileId }
        : {}),
    })),
  }));
  const payload = {
    title: parsed.title,
    description: parsed.description || null,
    content: parsed.content,
    lessons: lessons ?? [],
    ...(parsed.assessment ? { assessment: parsed.assessment } : {}),
    expectedUpdatedAt: parsed.expectedUpdatedAt,
  };
  const keys =
    lessons?.flatMap((lesson) =>
      lesson.materials.flatMap((material) =>
        material.uploadKey ? [material.uploadKey] : [],
      ),
    ) ?? [];
  const form = new FormData();
  form.append("payload", JSON.stringify(payload));
  for (const key of keys) {
    const file = files[key];
    if (!file) throw new Error("Select the file for every uploaded material.");
    form.append(key, file);
  }
  return courseDraftSchema.parse(
    await apiRequest<unknown>(
      `/api/training/courses/${encodeURIComponent(courseId)}`,
      {
        method: "PATCH",
        target: "same-origin",
        body: keys.length ? form : payload,
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

export async function duplicateCourse(courseId: string, title: string) {
  return courseSchema.parse(
    await apiRequest<unknown>(
      `/api/training/courses/${encodeURIComponent(courseId)}/duplicate`,
      { method: "POST", target: "same-origin", body: { title } },
    ),
  );
}
