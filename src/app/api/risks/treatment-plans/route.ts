import { treatmentPlanListQuerySchema } from "@/features/risks";
import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";

export async function GET(request: Request): Promise<Response> {
  const parsed = treatmentPlanListQuerySchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams.entries()),
  );
  if (!parsed.success)
    return Response.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid treatment plan filters",
        },
      },
      { status: 422 },
    );
  const parameters = new URLSearchParams();
  Object.entries(parsed.data).forEach(([key, value]) =>
    parameters.set(key, String(value)),
  );
  return proxyAuthenticatedRequest(
    `/risks/treatment-plans?${parameters.toString()}`,
  );
}
