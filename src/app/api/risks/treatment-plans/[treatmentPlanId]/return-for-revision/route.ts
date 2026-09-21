import { z } from "zod";
import { returnTreatmentPlanForRevisionRequestSchema } from "@/features/risks/schemas/return-treatment-plan-for-revision-schema";
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
  const parsed = returnTreatmentPlanForRevisionRequestSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success)
    return Response.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid revision request" } },
      { status: 422 },
    );
  return proxyAuthenticatedRequest(
    `/risks/treatment-plans/${params.data.treatmentPlanId}/return-for-revision`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed.data) },
  );
}
