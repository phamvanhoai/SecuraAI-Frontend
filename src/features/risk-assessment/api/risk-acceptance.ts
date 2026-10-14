import { apiRequest } from "@/lib/api/api-client";
import type { DecideRiskAcceptance, SubmitRiskAcceptance } from "../schemas/risk-acceptance-schema";
export const submitRiskAcceptance = (riskId: string, input: SubmitRiskAcceptance) => apiRequest<unknown>(`/api/risks/${encodeURIComponent(riskId)}/acceptance`, { method: "POST", target: "same-origin", body: input });
export const decideRiskAcceptance = (acceptanceId: string, input: DecideRiskAcceptance) => apiRequest<unknown>(`/api/risks/acceptances/${encodeURIComponent(acceptanceId)}/decision`, { method: "PATCH", target: "same-origin", body: input });
