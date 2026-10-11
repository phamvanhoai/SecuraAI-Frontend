import { z } from "zod";
import { assessInherentRiskSchema } from "@/features/risk-assessment/schemas/assess-inherent-risk-schema";
import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";
const paramsSchema = z.object({ riskAssessmentId: z.uuid() });
export async function POST(
  request: Request,
  context: RouteContext<"/api/risks/[riskAssessmentId]/inherent-assessments">,
): Promise<Response> {
  const params = paramsSchema.safeParse(await context.params);
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = null;
  }
  const parsed = assessInherentRiskSchema.safeParse(body);
  if (!params.success || !parsed.success)
    return Response.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid inherent risk assessment",
        },
      },
      { status: 422 },
    );
  return proxyAuthenticatedRequest(
    `/risks/${params.data.riskAssessmentId}/inherent-assessments`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    },
  );
}
