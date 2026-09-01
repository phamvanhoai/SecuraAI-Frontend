export type Permission = string;

export function hasPermission(
  granted: readonly Permission[],
  required?: Permission | readonly Permission[],
): boolean {
  if (required === undefined) return true;
  const checks = typeof required === "string" ? [required] : required;
  return checks.every((permission) => granted.includes(permission));
}

export function safeReturnUrl(value: string | null | undefined, fallback = "/dashboard"): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;
  try {
    const url = new URL(value, "https://securaai.local");
    return url.origin === "https://securaai.local" ? `${url.pathname}${url.search}${url.hash}` : fallback;
  } catch {
    return fallback;
  }
}
