import { sessionUserSchema, type AuthSessionUser } from "../types/session-user";

export async function getSessionUser(): Promise<AuthSessionUser | null> {
  const response = await fetch("/api/auth/session", { cache: "no-store" });
  if (!response.ok) return null;
  const payload: unknown = await response.json();
  if (typeof payload !== "object" || payload === null || !("data" in payload)) return null;
  const data = (payload as { data?: unknown }).data;
  if (typeof data !== "object" || data === null || !("user" in data)) return null;
  const parsed = sessionUserSchema.safeParse((data as { user?: unknown }).user);
  return parsed.success ? parsed.data : null;
}
