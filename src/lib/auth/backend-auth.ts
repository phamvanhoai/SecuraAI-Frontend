import "server-only";

import { z } from "zod";
import { sessionUserSchema, type AuthSessionUser } from "@/features/auth/types/session-user";
import { env } from "@/lib/env";

const tokenPairSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(32),
  expiresIn: z.string().min(1),
});

const tokenEnvelopeSchema = z.object({ success: z.literal(true), data: tokenPairSchema });

const userEnvelopeSchema = z.object({ success: z.literal(true), data: sessionUserSchema });

export type AuthTokenPair = z.infer<typeof tokenPairSchema>;

function backendUrl(path: string): string {
  return `${env.NEXT_PUBLIC_API_BASE_URL.replace(/\/$/, "")}${path}`;
}

export async function requestTokenPair(
  path: "/auth/login" | "/auth/refresh",
  body: unknown,
  request: Request,
): Promise<{ response: Response; tokens?: AuthTokenPair }> {
  const userAgent = request.headers.get("user-agent");
  const response = await fetch(backendUrl(path), {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(userAgent ? { "User-Agent": userAgent } : {}),
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!response.ok) return { response };
  const parsed = tokenEnvelopeSchema.safeParse(await response.json());
  return parsed.success ? { response, tokens: parsed.data.data } : { response };
}

export async function requestCurrentUser(accessToken: string): Promise<AuthSessionUser | null> {
  const response = await fetch(backendUrl("/users/me"), {
    headers: { Accept: "application/json", Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!response.ok) return null;
  const parsed = userEnvelopeSchema.safeParse(await response.json());
  return parsed.success ? parsed.data.data : null;
}

export function publicAuthError(status: number): { code: string; message: string } {
  if (status === 429) return { code: "RATE_LIMITED", message: "Quá nhiều lần thử. Vui lòng thử lại sau." };
  if (status === 403) return { code: "ACCESS_DENIED", message: "Tài khoản không thể đăng nhập." };
  return { code: "INVALID_CREDENTIALS", message: "Email hoặc mật khẩu không đúng." };
}
