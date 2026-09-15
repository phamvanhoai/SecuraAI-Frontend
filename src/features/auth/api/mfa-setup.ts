import { normalizeApiError } from "@/lib/api/api-error";

type SetupData = {
  otpauthUri: string;
  manualKey: string;
  qrCodeDataUrl: string;
  warning: string;
};
type EnableData = { recoveryCodes: string[]; warning: string };
type Envelope<T> =
  { success: true; data: T } | { success: false; error?: { message?: string } };

async function post<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = (await response.json().catch(() => undefined)) as
    Envelope<T> | undefined;
  if (!response.ok || !payload?.success)
    throw normalizeApiError(response.status, payload);
  return payload.data;
}

export const setupMfa = (currentPassword: string) =>
  post<SetupData>("/api/auth/mfa/setup", { currentPassword });
export const enableMfa = (code: string) =>
  post<EnableData>("/api/auth/mfa/verify", { code });
export const disableMfa = (currentPassword: string, code: string) =>
  post<{ message: string }>("/api/auth/mfa/disable", { currentPassword, code });
