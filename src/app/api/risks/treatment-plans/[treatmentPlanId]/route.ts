import { z } from "zod";
import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";
import { updateTreatmentPlanRequestSchema } from "@/features/risk-assessment";

const paramsSchema = z.object({ treatmentPlanId: z.uuid() });

export async function GET(
  _request: Request,
  context: { params: Promise<{ treatmentPlanId: string }> },
): Promise<Response> {
  const parsed = paramsSchema.safeParse(await context.params);
  if (!parsed.success)
    return Response.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid treatment plan identifier",
        },
      },
      { status: 422 },
    );
  return proxyAuthenticatedRequest(
    `/risks/treatment-plans/${parsed.data.treatmentPlanId}`,
  );
}

export async function PATCH(request: Request, context: { params: Promise<{ treatmentPlanId: string }> }): Promise<Response> {
  const params = paramsSchema.safeParse(await context.params);
  let body: unknown;
  try { body = await request.json(); } catch { body = null; }
  const parsed = updateTreatmentPlanRequestSchema.safeParse(body);
  if (!params.success || !parsed.success)
    return Response.json({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid treatment plan update" } }, { status: 422 });
  return proxyAuthenticatedRequest(`/risks/treatment-plans/${params.data.treatmentPlanId}`, {
    method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed.data),
  });
}
