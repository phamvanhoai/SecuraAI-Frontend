import type { LoginInput } from "../schemas/login-schema";

export type LoginResult = { authenticated: true };
type LoginSuccess = { success: true; data: LoginResult };
type LoginError = { success: false; error?: { message?: string } };

async function post<T>(url: string, input: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const payload = (await response.json().catch(() => undefined)) as
    LoginSuccess | LoginError | undefined;
  if (!response.ok || !payload?.success) {
    throw new Error(
      payload && !payload.success && typeof payload.error?.message === "string"
        ? payload.error.message
        : "Không thể đăng nhập. Vui lòng thử lại.",
    );
  }
  return payload.data as T;
}

export function login(input: LoginInput): Promise<LoginResult> {
  return post<LoginResult>("/api/auth/login", input);
}
