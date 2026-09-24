import { ApiError } from "@/lib/api/api-error";
import { apiRequest } from "@/lib/api/api-client";
import {
  riskCreateOptionsSchema,
  type RiskCreateOptions,
} from "../schemas/create-risk-assessment-schema";
export async function getRiskCreateOptions(
  query: {
    type: "assets" | "businessProcesses" | "threats" | "vulnerabilities";
    q?: string;
    page: number;
    limit: number;
  },
  signal?: AbortSignal,
): Promise<RiskCreateOptions> {
  const params = new URLSearchParams({
    type: query.type,
    page: String(query.page),
    limit: String(query.limit),
  });
  if (query.q) params.set("q", query.q);
  const data = await apiRequest<unknown>(
    `/api/risks/create-options?${params}`,
    {
      method: "GET",
      target: "same-origin",
      ...(signal ? { signal } : {}),
    },
  );
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
