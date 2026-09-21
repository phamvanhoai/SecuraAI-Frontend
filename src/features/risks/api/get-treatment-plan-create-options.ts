import { ApiError } from "@/lib/api/api-error";
import { apiRequest } from "@/lib/api/api-client";
import {
  treatmentPlanCreateOptionsSchema,
  type TreatmentPlanCreateOptions,
  type TreatmentPlanCreateOptionsQuery,
} from "../schemas/create-treatment-plan-schema";

export async function getTreatmentPlanCreateOptions(
  query: TreatmentPlanCreateOptionsQuery,
  signal?: AbortSignal,
): Promise<TreatmentPlanCreateOptions> {
  const data = await apiRequest<unknown>(
    "/api/risks/treatment-plans/create-options",
    {
      method: "GET",
      target: "same-origin",
      query,
      ...(signal ? { signal } : {}),
    },
  );
  const parsed = treatmentPlanCreateOptionsSchema.safeParse(data);
  if (!parsed.success)
    throw new ApiError(
      "The treatment plan user options have an invalid format.",
      502,
      "UNKNOWN_ERROR",
      parsed.error.flatten(),
    );
  return parsed.data;
}
