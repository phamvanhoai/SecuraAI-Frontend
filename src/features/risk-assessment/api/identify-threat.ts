import { ApiError } from "@/lib/api/api-error";
import { apiRequest } from "@/lib/api/api-client";
import {
  identifiedThreatSchema,
  type IdentifiedThreat,
  type IdentifyThreatInput,
} from "../schemas/identify-threat-schema";

export async function identifyThreat(
  riskId: string,
  input: IdentifyThreatInput,
): Promise<IdentifiedThreat> {
  const data = await apiRequest<unknown>(`/api/risks/${riskId}/threats`, {
    method: "POST",
    target: "same-origin",
    body: input,
  });
  const parsed = identifiedThreatSchema.safeParse(data);
  if (!parsed.success)
    throw new ApiError(
      "The identified threat response has an invalid format.",
      502,
      "UNKNOWN_ERROR",
      parsed.error.flatten(),
    );
  return parsed.data;
}
