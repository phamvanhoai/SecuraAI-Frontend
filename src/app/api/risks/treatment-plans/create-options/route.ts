import { treatmentPlanCreateOptionsQuerySchema } from "@/features/risks";
import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";

export async function GET(request: Request): Promise<Response> {
  const parsed = treatmentPlanCreateOptionsQuerySchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams.entries()),
  );
  if (!parsed.success)
    return Response.json(
      {
        success: false,
        error: { code: "VALIDATION_ERROR", message: "Invalid user filters" },
      },
      { status: 422 },
    );
  const parameters = new URLSearchParams();
  Object.entries(parsed.data).forEach(([key, value]) =>
    parameters.set(key, String(value)),
  );
  return proxyAuthenticatedRequest(
    `/risks/treatment-plans/create-options?${parameters.toString()}`,
  );
}
