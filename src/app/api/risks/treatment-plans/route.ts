import { createRiskTreatmentPlanSchema } from "@/features/risk-assessment";
import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      {
        success: false,
        error: { code: "VALIDATION_ERROR", message: "Invalid request body" },
      },
      { status: 422 },
    );
  }
  const parsed = createRiskTreatmentPlanSchema.safeParse(body);
  if (!parsed.success)
    return Response.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid treatment plan data",
        },
      },
      { status: 422 },
    );
  return proxyAuthenticatedRequest("/risks/treatment-plans", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(parsed.data),
  });
}
