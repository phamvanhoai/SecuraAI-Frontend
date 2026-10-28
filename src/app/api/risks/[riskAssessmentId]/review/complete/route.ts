import { z } from "zod";
import { completeRiskReviewSchema } from "@/features/risk-assessment/schemas/complete-risk-review-schema";
import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";
export async function POST(request: Request, context: { params: Promise<{ riskAssessmentId: string }> }) {
  const params = z.object({ riskAssessmentId: z.uuid() }).safeParse(await context.params);
  let body: unknown;
  try { body = await request.json(); } catch { body = null; }
  const parsed = completeRiskReviewSchema.safeParse(body);
  if (!params.success || !parsed.success) return Response.json({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid review completion request" } }, { status: 422 });
  return proxyAuthenticatedRequest(`/risks/${params.data.riskAssessmentId}/review/complete`, {
    method: "POST", signal: request.signal, headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed.data),
  });
}
