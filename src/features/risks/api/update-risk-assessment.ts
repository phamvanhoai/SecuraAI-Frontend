import { ApiError } from "@/lib/api/api-error";
import { apiRequest } from "@/lib/api/api-client";
import type { RiskDetail } from "../schemas/risk-detail-schema";
import {
  updatedRiskAssessmentSchema,
  type UpdateRiskAssessmentRequest,
} from "../schemas/update-risk-assessment-schema";
export async function updateRiskAssessment({
  id,
  input,
}: {
  id: string;
  input: UpdateRiskAssessmentRequest;
}): Promise<RiskDetail> {
  const data = await apiRequest<unknown>(`/api/risks/${id}`, {
    method: "PATCH",
    target: "same-origin",
    body: input,
  });
  const parsed = updatedRiskAssessmentSchema.safeParse(data);
  if (!parsed.success)
    throw new ApiError(
      "The update risk response has an invalid format.",
      502,
      "UNKNOWN_ERROR",
      parsed.error.flatten(),
    );
  return parsed.data;
}
