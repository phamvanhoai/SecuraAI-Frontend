import { apiRequest } from "@/lib/api/api-client";
import {
  controlAssessmentListSchema,
  createAssessmentSchema,
  type ControlAssessmentList,
  type CreateAssessment,
} from "../schemas/control-assessment-schema";
export async function listControlAssessments(
  query: { page: number; limit: number; q?: string },
  signal?: AbortSignal,
): Promise<ControlAssessmentList> {
  const data = await apiRequest<unknown>(
    "/api/compliance/control-assessments",
    { target: "same-origin", query, ...(signal ? { signal } : {}) },
  );
  return controlAssessmentListSchema.parse(data);
}
export async function createControlAssessment(input: {
  controlId: string;
  body: CreateAssessment;
}) {
  return apiRequest<unknown>(
    `/api/compliance/controls/${encodeURIComponent(input.controlId)}/assessments`,
    {
      target: "same-origin",
      method: "POST",
      body: createAssessmentSchema.parse(input.body),
    },
  );
}
