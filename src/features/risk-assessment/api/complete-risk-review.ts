import { apiRequest } from "@/lib/api/api-client";
import { completeRiskReviewSchema } from "../schemas/complete-risk-review-schema";
import type { z } from "zod";
export function completeRiskReview(riskId: string, input: z.infer<typeof completeRiskReviewSchema>) {
  return apiRequest<unknown>(`/api/risks/${encodeURIComponent(riskId)}/review/complete`, {
    target: "same-origin", method: "POST", body: input,
  });
}
