import { NextResponse } from "next/server";
import { decideMfaRecoverySchema } from "@/features/auth/schemas/mfa-recovery-schema";
import { authenticatedPost } from "@/lib/auth/authenticated-request";
import { clearAuthCookies, setAuthCookies } from "@/lib/auth/auth-cookies";

export async function POST(
  request: Request,
  context: { params: Promise<{ requestId: string; decision: string }> },
): Promise<NextResponse> {
  const { requestId, decision } = await context.params;
  const body = decideMfaRecoverySchema.safeParse(
    await request.json().catch(() => undefined),
  );
  if (
    !body.success ||
    !/^[0-9a-f-]{36}$/i.test(requestId) ||
    !["approve", "reject"].includes(decision)
  )
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "VALIDATION_FAILED",
          message: "Enter a reason of at least 10 characters.",
        },
      },
      { status: 422 },
    );
  const result = await authenticatedPost(
    `/admin/mfa-recovery-requests/${requestId}/${decision}`,
    body.data,
    request,
  );
  const response = new NextResponse(await result.response.text(), {
    status: result.response.status,
    headers: {
      "content-type":
        result.response.headers.get("content-type") ?? "application/json",
    },
  });
  if (result.refreshedTokens) setAuthCookies(response, result.refreshedTokens);
  if (result.response.status === 401) clearAuthCookies(response);
  return response;
}
