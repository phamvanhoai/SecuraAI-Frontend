import { z } from "zod";
import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";
import { cancelTreatmentPlanRequestSchema } from "@/features/risk-assessment";

const paramsSchema = z.object({ treatmentPlanId: z.uuid() });

export async function POST(request: Request, context: { params: Promise<{ treatmentPlanId: string }> }): Promise<Response> {
  const params = paramsSchema.safeParse(await context.params);
  let body: unknown;
  try { body = await request.json(); } catch { body = null; }
  const parsed = cancelTreatmentPlanRequestSchema.safeParse(body);
  if (!params.success || !parsed.success)
    return Response.json({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid treatment plan cancellation" } }, { status: 422 });
  return proxyAuthenticatedRequest(`/risks/treatment-plans/${params.data.treatmentPlanId}/cancel`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed.data),
  });
}
