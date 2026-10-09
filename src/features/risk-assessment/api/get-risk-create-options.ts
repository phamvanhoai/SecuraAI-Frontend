import { ApiError } from "@/lib/api/api-error";
import { apiRequest } from "@/lib/api/api-client";
import {
  riskCreateOptionsSchema,
  type RiskCreateOptions,
} from "../schemas/create-risk-assessment-schema";
export async function getRiskCreateOptions(
  signal?: AbortSignal,
  q = "",
): Promise<RiskCreateOptions> {
  const query = new URLSearchParams({ q: q.trim().slice(0, 100), limit: "10" });
  const data = await apiRequest<unknown>(`/api/risks/create-options?${query}`, {
    method: "GET",
    target: "same-origin",
    ...(signal ? { signal } : {}),
  });
  const parsed = riskCreateOptionsSchema.safeParse(data);
  if (!parsed.success)
    throw new ApiError(
      "The risk options response has an invalid format.",
      502,
      "UNKNOWN_ERROR",
      parsed.error.flatten(),
    );
  return parsed.data;
}
