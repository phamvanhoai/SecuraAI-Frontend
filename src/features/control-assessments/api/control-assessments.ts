import { apiRequest } from "@/lib/api/api-client";
import { assessmentHistorySchema, controlAssessmentListSchema, createAssessmentSchema, type AssessmentHistory, type ControlAssessmentList, type CreateAssessment } from "../schemas/control-assessment-schema";

export async function listControlAssessments(query: { page: number; limit: number; q?: string; frameworkId?: string; status?: string; reviewState?: string }, signal?: AbortSignal): Promise<ControlAssessmentList> {
  const data = await apiRequest<unknown>("/api/compliance/control-assessments", { target: "same-origin", query, ...(signal ? { signal } : {}) });
  return controlAssessmentListSchema.parse(data);
}
export async function getAssessmentHistory(controlId: string, signal?: AbortSignal): Promise<AssessmentHistory> {
  const data = await apiRequest<unknown>(`/api/compliance/controls/${encodeURIComponent(controlId)}/assessments`, { target: "same-origin", ...(signal ? { signal } : {}) });
  return assessmentHistorySchema.parse(data);
}
export async function createControlAssessment(input: { controlId: string; body: CreateAssessment }) {
  const body = createAssessmentSchema.parse(input.body);
  return apiRequest<unknown>(`/api/compliance/controls/${encodeURIComponent(input.controlId)}/assessments`, { target: "same-origin", method: "POST", body });
}
