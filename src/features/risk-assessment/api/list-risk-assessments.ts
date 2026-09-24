import { ApiError } from "@/lib/api/api-error";
import { apiRequest } from "@/lib/api/api-client";
import {
  riskListResponseSchema,
  type RiskListQuery,
  type RiskListResponse,
} from "../schemas/risk-list-schema";

export async function listRiskAssessments(
  query: RiskListQuery,
  signal?: AbortSignal,
): Promise<RiskListResponse> {
  const data = await apiRequest<unknown>("/api/risks", {
    method: "GET",
    target: "same-origin",
    query,
    ...(signal ? { signal } : {}),
  });
  const parsed = riskListResponseSchema.safeParse(data);
  if (!parsed.success)
    throw new ApiError(
      "The risk assessment response has an invalid format.",
      502,
      "UNKNOWN_ERROR",
      parsed.error.flatten(),
    );
  return parsed.data;
}
