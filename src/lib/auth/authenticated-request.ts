import "server-only";

import { cookies } from "next/headers";
import { authCookieNames } from "./auth-cookies";
import { requestTokenPair, type AuthTokenPair } from "./backend-auth";
import { env } from "../env";

async function send(
  path: string,
  init: RequestInit,
  accessToken: string,
): Promise<Response> {
  return fetch(`${env.NEXT_PUBLIC_API_BASE_URL.replace(/\/$/, "")}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...(init.body === undefined
        ? {}
        : { "Content-Type": "application/json" }),
      ...init.headers,
    },
    cache: "no-store",
  });
}

export async function authenticatedRequest(
  path: string,
  init: RequestInit,
  request: Request,
): Promise<{ response: Response; refreshedTokens?: AuthTokenPair }> {
  const store = await cookies();
  const accessToken = store.get(authCookieNames.access)?.value;
  if (accessToken) {
    const response = await send(path, init, accessToken);
    if (response.status !== 401) return { response };
  }
  const refreshToken = store.get(authCookieNames.refresh)?.value;
  if (!refreshToken) return { response: new Response(null, { status: 401 }) };
  const refreshed = await requestTokenPair(
    "/auth/refresh",
    { refreshToken },
    request,
  );
  if (!refreshed.tokens)
    return { response: new Response(null, { status: 401 }) };
  return {
    response: await send(path, init, refreshed.tokens.accessToken),
    refreshedTokens: refreshed.tokens,
  };
}

export async function authenticatedPost(
  path: string,
  body: unknown,
  request: Request,
): Promise<{ response: Response; refreshedTokens?: AuthTokenPair }> {
  return authenticatedRequest(
    path,
    { method: "POST", body: JSON.stringify(body) },
    request,
  );
}
