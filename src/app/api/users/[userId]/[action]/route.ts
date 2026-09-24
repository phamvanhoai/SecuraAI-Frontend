import { NextResponse } from "next/server";
import { z } from "zod";
import {
  accountLockBodySchema,
} from "@/features/user-management-authorization";
import { clearAuthCookies, setAuthCookies } from "@/lib/auth/auth-cookies";
import { authenticatedPost } from "@/lib/auth/authenticated-request";

export async function POST(
  request: Request,
  context: { params: Promise<{ userId: string; action: string }> },
): Promise<NextResponse> {
  const params = z.strictObject({
    userId: z.uuid(),
    action: z.enum(["lock", "unlock", "deactivate"]),
  }).safeParse(await context.params);
  if (!params.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "VALIDATION_FAILED",
          message: "Invalid account action or user ID.",
        },
      },
      { status: 422 },
    );
  }
  const body = accountLockBodySchema.safeParse(
    await request.json().catch(() => undefined),
  );
  if (!body.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "VALIDATION_FAILED",
          message: "Provide a reason of 10–1,000 characters.",
        },
      },
      { status: 422 },
    );
  }
  try {
    const result = await authenticatedPost(
      `/admin/users/${encodeURIComponent(params.data.userId)}/${params.data.action}`,
      body.data,
      request,
    );
    const response = new NextResponse(await result.response.text(), {
      status: result.response.status,
      headers: {
        "Content-Type":
          result.response.headers.get("content-type") ?? "application/json",
      },
    });
    if (result.refreshedTokens)
      setAuthCookies(response, result.refreshedTokens);
    if (result.response.status === 401) clearAuthCookies(response);
    return response;
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SERVICE_UNAVAILABLE",
          message:
            "Unable to connect to the account service. Please try again.",
        },
      },
      { status: 503 },
    );
  }
}
