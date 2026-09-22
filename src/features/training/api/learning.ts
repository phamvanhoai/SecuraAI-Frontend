import { apiRequest } from "@/lib/api/api-client";
import {
  learningDetailSchema,
  learningListSchema,
  lessonCompletionSchema,
} from "../schemas/learning-schema";
export const listMyLearning = async (page: number, signal?: AbortSignal) =>
  learningListSchema.parse(
    await apiRequest<unknown>("/api/training/learning", {
      target: "same-origin",
      query: { page, limit: 10 },
      ...(signal ? { signal } : {}),
    }),
  );
export const getMyLearning = async (id: string, signal?: AbortSignal) =>
  learningDetailSchema.parse(
    await apiRequest<unknown>(
      `/api/training/learning/${encodeURIComponent(id)}`,
      { target: "same-origin", ...(signal ? { signal } : {}) },
    ),
  );
export const completeLesson = async (enrollmentId: string, lessonId: string) =>
  lessonCompletionSchema.parse(
    await apiRequest<unknown>(
      `/api/training/learning/${encodeURIComponent(enrollmentId)}/lessons/${encodeURIComponent(lessonId)}/complete`,
      { method: "PATCH", target: "same-origin" },
    ),
  );
export const updateMaterialProgress = async (
  enrollmentId: string,
  materialId: string,
  status: "in_progress" | "completed",
) =>
  apiRequest<unknown>(
    `/api/training/learning/${encodeURIComponent(enrollmentId)}/materials/${encodeURIComponent(materialId)}/progress`,
    {
      method: "PATCH",
      target: "same-origin",
      body: { status },
    },
  );
