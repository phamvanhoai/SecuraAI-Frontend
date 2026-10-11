import { apiRequest } from "@/lib/api/api-client";
import {
  residualRiskResultSchema,
  type AssessResidualRiskInput,
} from "../schemas/assess-residual-risk-schema";
export async function assessResidualRisk(
  riskId: string,
  input: AssessResidualRiskInput,
) {
  return residualRiskResultSchema.parse(
    await apiRequest<unknown>(`/api/risks/${riskId}/residual-assessments`, {
      method: "POST",
      target: "same-origin",
      body: input,
    }),
  );
}
