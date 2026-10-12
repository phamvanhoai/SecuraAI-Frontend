import { ApiError } from "@/lib/api/api-error";
import { apiRequest } from "@/lib/api/api-client";
import {
  type UpdatedThreat,
  type UpdateThreatInput,
  updatedThreatSchema,
} from "../schemas/update-threat-schema";

export async function updateThreat(
  riskId: string,
  threatId: string,
  input: UpdateThreatInput,
): Promise<UpdatedThreat> {
  const data = await apiRequest<unknown>(
    `/api/risks/${riskId}/threats/${threatId}`,
    { method: "PATCH", target: "same-origin", body: input },
  );
  const parsed = updatedThreatSchema.safeParse(data);
  if (!parsed.success)
    throw new ApiError(
      "The updated threat response has an invalid format.",
      502,
      "UNKNOWN_ERROR",
      parsed.error.flatten(),
    );
  return parsed.data;
}
