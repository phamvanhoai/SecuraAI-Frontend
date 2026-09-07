import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";

const routeGroups = {
  "(auth)": [
    "login",
    "forgot-password",
    "otp",
    "reset-password",
    "reset-password-success",
  ],
  "(dashboard)": [
    "ai-models",
    "alerts",
    "anomaly-monitoring",
    "assets",
    "audits",
    "compliance",
    "controls",
    "custom-dashboard",
    "dashboard",
    "admin",
    "employee",
    "executive-auditor",
    "security-officer",
    "event-logs",
    "files",
    "incidents",
    "notifications",
    "policies",
    "profile",
    "reports",
    "risks",
    "roles",
    "settings",
    "training",
    "users",
  ],
} as const;

describe("route loading boundaries", () => {
  it.each(
    Object.entries(routeGroups).flatMap(([group, routes]) =>
      routes.map((route) => [group, route] as const),
    ),
  )("provides loading UI for %s/%s", (group, route) => {
    expect(existsSync(`src/app/${group}/${route}/loading.tsx`)).toBe(true);
  });
});
