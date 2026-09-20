import { apiRequest } from "@/lib/api/api-client";
import {
  assessmentDetailSchema,
  assessmentSubmissionSchema,
  assignedAssessmentListSchema,
  type AssessmentAnswer,
} from "../schemas/assessment-schema";

export async function listMyAssessments(page: number, signal?: AbortSignal) {
  return assignedAssessmentListSchema.parse(
    await apiRequest<unknown>("/api/training/assessments", {
      target: "same-origin",
      query: { page, limit: 10 },
      ...(signal ? { signal } : {}),
    }),
  );
}

export async function getMyAssessment(
  enrollmentId: string,
  signal?: AbortSignal,
  lessonId?: string,
) {
  return assessmentDetailSchema.parse(
    await apiRequest<unknown>(
      lessonId
        ? `/api/training/learning/${encodeURIComponent(enrollmentId)}/lessons/${encodeURIComponent(lessonId)}/assessment`
        : `/api/training/assessments/${encodeURIComponent(enrollmentId)}`,
      { target: "same-origin", ...(signal ? { signal } : {}) },
    ),
  );
}

export async function submitMyAssessment(
  enrollmentId: string,
  answers: readonly AssessmentAnswer[],
  lessonId?: string,
) {
  return assessmentSubmissionSchema.parse(
    await apiRequest<unknown>(
      lessonId
        ? `/api/training/learning/${encodeURIComponent(enrollmentId)}/lessons/${encodeURIComponent(lessonId)}/assessment/attempts`
        : `/api/training/assessments/${encodeURIComponent(enrollmentId)}/attempts`,
      { method: "POST", target: "same-origin", body: { answers } },
    ),
  );
}
