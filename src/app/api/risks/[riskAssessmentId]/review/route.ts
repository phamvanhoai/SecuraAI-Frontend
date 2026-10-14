import { z } from "zod";
import { openRiskReviewSchema } from "@/features/risk-assessment";
import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";

export async function POST(
  request: Request,
  context: { params: Promise<{ riskAssessmentId: string }> },
) {
  const params = z
    .object({ riskAssessmentId: z.uuid() })
    .safeParse(await context.params);
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = null;
  }
  const parsed = openRiskReviewSchema.safeParse(body);
  if (!params.success || !parsed.success)
    return Response.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid risk review request",
        },
      },
      { status: 422 },
    );
  return proxyAuthenticatedRequest(
    `/risks/${params.data.riskAssessmentId}/review`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    },
  );
}
