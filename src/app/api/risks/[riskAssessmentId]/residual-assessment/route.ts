import { z } from "zod";
import { performResidualRiskAssessmentRequestSchema } from "@/features/risk-assessment";
import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";

const paramsSchema = z.object({ riskAssessmentId: z.uuid() });

export async function PATCH(
  request: Request,
  context: { params: Promise<{ riskAssessmentId: string }> },
): Promise<Response> {
  const params = paramsSchema.safeParse(await context.params);
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = null;
  }
  const parsed = performResidualRiskAssessmentRequestSchema.safeParse(body);
  if (!params.success || !parsed.success)
    return Response.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid residual risk assessment",
        },
      },
      { status: 422 },
    );
  return proxyAuthenticatedRequest(
    `/risks/${params.data.riskAssessmentId}/residual-assessment`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    },
  );
}
