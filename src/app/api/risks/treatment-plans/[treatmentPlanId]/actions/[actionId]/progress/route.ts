import { z } from "zod";
import { updateTreatmentActionProgressRequestSchema } from "@/features/risks";
import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";

const paramsSchema = z.object({ treatmentPlanId: z.uuid(), actionId: z.uuid() });

export async function PATCH(
  request: Request,
  context: { params: Promise<{ treatmentPlanId: string; actionId: string }> },
): Promise<Response> {
  const params = paramsSchema.safeParse(await context.params);
  let body: unknown;
  try { body = await request.json(); } catch { body = null; }
  const parsed = updateTreatmentActionProgressRequestSchema.safeParse(body);
  if (!params.success || !parsed.success)
    return Response.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid treatment action progress update" } },
      { status: 422 },
    );
  return proxyAuthenticatedRequest(
    `/risks/treatment-plans/${params.data.treatmentPlanId}/actions/${params.data.actionId}/progress`,
    { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed.data) },
  );
}
