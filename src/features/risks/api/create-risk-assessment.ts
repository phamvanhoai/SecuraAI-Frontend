import { ApiError } from "@/lib/api/api-error";
import { apiRequest } from "@/lib/api/api-client";
import {
  createdRiskAssessmentSchema,
  type CreateRiskAssessmentRequest,
  type CreatedRiskAssessment,
} from "../schemas/create-risk-assessment-schema";
export async function createRiskAssessment(
  input: CreateRiskAssessmentRequest,
): Promise<CreatedRiskAssessment> {
  const data = await apiRequest<unknown>("/api/risks", {
    method: "POST",
    target: "same-origin",
    body: input,
  });
  const parsed = createdRiskAssessmentSchema.safeParse(data);
  if (!parsed.success)
    throw new ApiError(
      "The create risk response has an invalid format.",
      502,
      "UNKNOWN_ERROR",
      parsed.error.flatten(),
    );
  return parsed.data;
}
