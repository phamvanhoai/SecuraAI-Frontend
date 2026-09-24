import { ApiError } from "@/lib/api/api-error";
import { apiRequest } from "@/lib/api/api-client";
import {
  riskDetailSchema,
  type RiskDetail,
} from "../schemas/risk-detail-schema";

export async function getRiskAssessmentDetail(
  id: string,
  signal?: AbortSignal,
): Promise<RiskDetail> {
  const data = await apiRequest<unknown>(`/api/risks/${id}`, {
    method: "GET",
    target: "same-origin",
    ...(signal ? { signal } : {}),
  });
  const parsed = riskDetailSchema.safeParse(data);
  if (!parsed.success)
    throw new ApiError(
      "The risk assessment detail response has an invalid format.",
      502,
      "UNKNOWN_ERROR",
      parsed.error.flatten(),
    );
  return parsed.data;
}
