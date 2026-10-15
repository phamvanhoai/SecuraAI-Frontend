import { apiRequest } from "@/lib/api/api-client";
import {
  riskReassessmentReviewItemSchema,
  riskReassessmentReviewListSchema,
  completedRiskReassessmentSchema,
  type CompleteRiskReassessmentForm,
  rejectedRiskReassessmentSchema,
  type RejectRiskReassessmentForm,
} from "../schemas/risk-reassessment-review-schema";

export type ReassessmentRequestStatusFilter =
  "all" | "active" | "pending" | "under_review" | "completed" | "rejected";

export type ReassessmentRequestListQuery = {
  page: number;
  limit: number;
  status: ReassessmentRequestStatusFilter;
  q?: string;
};

export async function listOwnedRiskReassessmentRequests(
  query: ReassessmentRequestListQuery,
  signal?: AbortSignal,
) {
  return riskReassessmentReviewListSchema.parse(
    await apiRequest<unknown>("/api/risks/reassessment-requests/mine", {
      target: "same-origin",
      query,
      ...(signal ? { signal } : {}),
    }),
  );
}

export async function completeRiskReassessment(input: {
  requestId: string;
  values: CompleteRiskReassessmentForm;
}) {
  return completedRiskReassessmentSchema.parse(
    await apiRequest<unknown>(
      `/api/risks/reassessment-requests/${encodeURIComponent(input.requestId)}/complete`,
      { target: "same-origin", method: "POST", body: input.values },
    ),
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

export async function rejectRiskReassessment(input: {
  requestId: string;
  values: RejectRiskReassessmentForm;
}) {
  return rejectedRiskReassessmentSchema.parse(
    await apiRequest<unknown>(
      `/api/risks/reassessment-requests/${encodeURIComponent(input.requestId)}/reject`,
      {
        target: "same-origin",
        method: "POST",
        body: { reason: input.values.reason.trim() },
      },
    ),
  );
}
