import { z } from "zod";
import { updateThreatSchema } from "@/features/risk-assessment/schemas/update-threat-schema";
import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";

const paramsSchema = z.object({
  riskAssessmentId: z.uuid(),
  threatId: z.uuid(),
});

export async function PATCH(
  request: Request,
  context: RouteContext<"/api/risks/[riskAssessmentId]/threats/[threatId]">,
): Promise<Response> {
  const params = paramsSchema.safeParse(await context.params);
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = null;
  }
  const parsed = updateThreatSchema.safeParse(body);
  if (!params.success || !parsed.success)
    return Response.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid threat update" } },
      { status: 422 },
    );
  return proxyAuthenticatedRequest(
    `/risks/${params.data.riskAssessmentId}/threats/${params.data.threatId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    },
  );
}
