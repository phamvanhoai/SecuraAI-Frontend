import type { LoginInput } from "../schemas/login-schema";

type LoginResult = { success: true; data: { authenticated: true } };
type LoginError = { success: false; error?: { message?: string } };

export async function login(input: LoginInput): Promise<void> {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const payload = (await response.json().catch(() => undefined)) as LoginResult | LoginError | undefined;
  if (!response.ok || !payload?.success) {
    throw new Error(
      payload && !payload.success && typeof payload.error?.message === "string"
        ? payload.error.message
        : "Không thể đăng nhập. Vui lòng thử lại.",
    );
  }
}
