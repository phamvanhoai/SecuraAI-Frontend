import { z } from "zod";
import { submitTreatmentPlanRequestSchema } from "@/features/risks/schemas/submit-treatment-plan-schema";
import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";

const paramsSchema = z.object({ treatmentPlanId: z.uuid() });

export async function POST(
  request: Request,
  context: { params: Promise<{ treatmentPlanId: string }> },
): Promise<Response> {
  const params = paramsSchema.safeParse(await context.params);
  if (!params.success)
    return Response.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid treatment plan ID" } },
      { status: 422 },
    );
  const body: unknown = await request.json().catch(() => null);
  const parsed = submitTreatmentPlanRequestSchema.safeParse(body);
  if (!parsed.success)
    return Response.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid submission data" } },
      { status: 422 },
    );
  return proxyAuthenticatedRequest(
    `/risks/treatment-plans/${params.data.treatmentPlanId}/submit`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    },
  );
}
