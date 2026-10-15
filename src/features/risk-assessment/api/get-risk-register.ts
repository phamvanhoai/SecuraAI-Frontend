import { ApiError } from "@/lib/api/api-error";
import { apiRequest } from "@/lib/api/api-client";
import {
  riskRegisterDetailSchema,
  riskRegisterResponseSchema,
  type RiskRegisterDetail,
  type RiskRegisterQuery,
  type RiskRegisterResponse,
} from "../schemas/risk-register-schema";

export async function listRiskRegister(
  query: RiskRegisterQuery,
  signal?: AbortSignal,
): Promise<RiskRegisterResponse> {
  const data = await apiRequest<unknown>("/api/risks", {
    method: "GET",
    target: "same-origin",
    query,
    ...(signal ? { signal } : {}),
  });
  const parsed = riskRegisterResponseSchema.safeParse(data);
  if (!parsed.success)
    throw new ApiError(
      "The risk register response has an invalid format.",
      502,
      "UNKNOWN_ERROR",
      parsed.error.flatten(),
    );
  return parsed.data;
}
export async function getRiskRecord(
  id: string,
  signal?: AbortSignal,
): Promise<RiskRegisterDetail> {
  const data = await apiRequest<unknown>(`/api/risks/${id}`, {
    method: "GET",
    target: "same-origin",
    ...(signal ? { signal } : {}),
  });
  const parsed = riskRegisterDetailSchema.safeParse(data);
  if (!parsed.success)
    throw new ApiError(
      "The risk record response has an invalid format.",
      502,
      "UNKNOWN_ERROR",
      parsed.error.flatten(),
    );
  return parsed.data;
}
