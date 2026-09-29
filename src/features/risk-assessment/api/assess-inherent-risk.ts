import { ApiError } from "@/lib/api/api-error";
import { apiRequest } from "@/lib/api/api-client";
import {
  inherentRiskResultSchema,
  type AssessInherentRiskInput,
  type InherentRiskResult,
} from "../schemas/assess-inherent-risk-schema";
export async function assessInherentRisk(
  riskId: string,
  input: AssessInherentRiskInput,
): Promise<InherentRiskResult> {
  const data = await apiRequest<unknown>(
    `/api/risks/${riskId}/inherent-assessments`,
    { method: "POST", target: "same-origin", body: input },
  );
  const parsed = inherentRiskResultSchema.safeParse(data);
  if (!parsed.success)
    throw new ApiError(
      "The inherent assessment response has an invalid format.",
      502,
      "UNKNOWN_ERROR",
      parsed.error.flatten(),
    );
  return parsed.data;
}
