import { apiRequest } from "@/lib/api/api-client";
import {
  targetRiskResultSchema,
  type DefineTargetRiskInput,
} from "../schemas/define-target-risk-schema";
export async function defineTargetRisk(
  riskId: string,
  input: DefineTargetRiskInput,
) {
  return targetRiskResultSchema.parse(
    await apiRequest<unknown>(`/api/risks/${riskId}/target-risk`, {
      method: "POST",
      target: "same-origin",
      body: input,
    }),
  );
}
