import { apiRequest } from "@/lib/api/api-client";
import {
  riskReassessmentReviewItemSchema,
  riskReassessmentReviewListSchema,
} from "../schemas/risk-reassessment-review-schema";

export async function listOwnedRiskReassessmentRequests(signal?: AbortSignal) {
  return riskReassessmentReviewListSchema.parse(
    await apiRequest<unknown>("/api/risks/reassessment-requests/mine", {
      target: "same-origin",
      query: { page: 1, limit: 10 },
      ...(signal ? { signal } : {}),
    }),
  );
}

export async function startRiskReassessmentReview(requestId: string) {
  return riskReassessmentReviewItemSchema.parse(
    await apiRequest<unknown>(
      `/api/risks/reassessment-requests/${encodeURIComponent(requestId)}/review`,
      { target: "same-origin", method: "POST" },
    ),
  );
}
