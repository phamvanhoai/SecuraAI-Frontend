import { ApiError } from "@/lib/api/api-error";
import { apiRequest } from "@/lib/api/api-client";
import {
  performResidualRiskAssessmentRequestSchema,
  residualRiskAssessmentResultSchema,
  type PerformResidualRiskAssessmentRequest,
  type ResidualRiskAssessmentResult,
} from "../schemas/perform-residual-risk-assessment-schema";

export async function performResidualRiskAssessment(input: {
  riskAssessmentId: string;
  data: PerformResidualRiskAssessmentRequest;
}): Promise<ResidualRiskAssessmentResult> {
  const request = performResidualRiskAssessmentRequestSchema.parse(input.data);
  const result = await apiRequest<unknown>(
    `/api/risks/${encodeURIComponent(input.riskAssessmentId)}/residual-assessment`,
    { method: "PATCH", target: "same-origin", body: request },
  );
  const parsed = residualRiskAssessmentResultSchema.safeParse(result);
  if (!parsed.success)
    throw new ApiError(
      "The residual risk assessment response has an invalid format.",
      502,
      "UNKNOWN_ERROR",
      parsed.error.flatten(),
    );
  return parsed.data;
}
