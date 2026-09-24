import { ApiError } from "@/lib/api/api-error";
import { apiRequest } from "@/lib/api/api-client";
import type { RiskDetail } from "../schemas/risk-detail-schema";
import {
  cancelledRiskAssessmentSchema,
  type CancelRiskAssessmentRequest,
} from "../schemas/cancel-risk-assessment-schema";

export async function cancelRiskAssessment({
  id,
  input,
}: {
  id: string;
  input: CancelRiskAssessmentRequest;
}): Promise<RiskDetail> {
  const data = await apiRequest<unknown>(`/api/risks/${id}/cancel`, {
    method: "POST",
    target: "same-origin",
    body: input,
  });
  const parsed = cancelledRiskAssessmentSchema.safeParse(data);
  if (!parsed.success)
    throw new ApiError(
      "The cancel risk response has an invalid format.",
      502,
      "UNKNOWN_ERROR",
      parsed.error.flatten(),
    );
  return parsed.data;
}
