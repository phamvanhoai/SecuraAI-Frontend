import { apiRequest } from "@/lib/api/api-client";
import {
  completionCampaignDetailSchema,
  completionCampaignListSchema,
  type CompletionStatus,
} from "../schemas/completion-schema";

export async function listCompletionCampaigns(
  page: number,
  q: string,
  signal?: AbortSignal,
) {
  return completionCampaignListSchema.parse(
    await apiRequest<unknown>("/api/training/completion", {
      target: "same-origin",
      query: { page, limit: 10, ...(q ? { q } : {}) },
      ...(signal ? { signal } : {}),
    }),
  );
}

export async function getCompletionCampaign(
  campaignId: string,
  page: number,
  q: string,
  status: CompletionStatus,
  signal?: AbortSignal,
) {
  return completionCampaignDetailSchema.parse(
    await apiRequest<unknown>(
      `/api/training/completion/${encodeURIComponent(campaignId)}`,
      {
        target: "same-origin",
        query: { page, limit: 20, q, status },
        ...(signal ? { signal } : {}),
      },
    ),
  );
}
export async function withdrawEnrollment(enrollmentId: string, reason: string) {
  return apiRequest<unknown>(
    `/api/training/enrollments/${encodeURIComponent(enrollmentId)}/withdraw`,
    { target: "same-origin", method: "POST", body: { reason } },
  );
}
