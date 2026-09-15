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
) {
  return assessmentDetailSchema.parse(
    await apiRequest<unknown>(
      `/api/training/assessments/${encodeURIComponent(enrollmentId)}`,
      { target: "same-origin", ...(signal ? { signal } : {}) },
    ),
  );
}

export async function submitMyAssessment(
  enrollmentId: string,
  answers: readonly AssessmentAnswer[],
) {
  return assessmentSubmissionSchema.parse(
    await apiRequest<unknown>(
      `/api/training/assessments/${encodeURIComponent(enrollmentId)}/attempts`,
      { method: "POST", target: "same-origin", body: { answers } },
    ),
  );
}
