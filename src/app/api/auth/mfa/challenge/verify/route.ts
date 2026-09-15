import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { mfaChallengeSchema } from "@/features/auth/schemas/mfa-challenge-schema";
import {
  authCookieNames,
  clearMfaChallengeCookie,
  setAuthCookies,
} from "@/lib/auth/auth-cookies";
import { requestTokenPair } from "@/lib/auth/backend-auth";

type BackendError = { error?: { code?: string } };

export async function POST(request: Request): Promise<NextResponse> {
  const input = mfaChallengeSchema.safeParse(
    await request.json().catch(() => undefined),
  );
  if (!input.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "VALIDATION_FAILED",
          message: "Enter a valid authentication code or recovery code.",
        },
      },
      { status: 422 },
    );
  }
  const challengeToken = (await cookies()).get(
    authCookieNames.mfaChallenge,
  )?.value;
  if (!challengeToken) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INVALID_MFA_CHALLENGE",
          message: "Your verification session has expired. Sign in again.",
        },
      },
      { status: 401 },
    );
  }
  try {
    const result = await requestTokenPair(
      "/auth/mfa/challenge/verify",
      { challengeToken, code: input.data.code },
      request,
    );
    if (!result.tokens) {
      const backendError = (await result.response
        .json()
        .catch(() => undefined)) as BackendError | undefined;
      const backendCode = backendError?.error?.code;
      const challengeExpired = backendCode === "INVALID_MFA_CHALLENGE";
      const rateLimited = result.response.status === 429;
      const response = NextResponse.json(
        {
          success: false,
          error: {
            code: rateLimited
              ? "RATE_LIMITED"
              : challengeExpired
                ? "INVALID_MFA_CHALLENGE"
                : "INVALID_MFA_CODE",
            message: rateLimited
              ? "Too many attempts. Please try again later."
              : challengeExpired
                ? "Your verification session has expired. Sign in again."
                : "The authentication code is invalid or expired.",
          },
        },
        { status: result.response.status },
      );
      if (challengeExpired) clearMfaChallengeCookie(response);
      return response;
    }
    const response = NextResponse.json({
      success: true,
      data: { authenticated: true },
    });
    clearMfaChallengeCookie(response);
    setAuthCookies(response, result.tokens);
    return response;
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "AUTH_SERVICE_UNAVAILABLE",
          message: "Unable to connect to the authentication service.",
        },
      },
      { status: 503 },
    );
  }
}
