import { z } from "zod";
import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";

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
