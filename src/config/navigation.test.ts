import { describe, expect, it } from "vitest";
import {
  allowedPanels,
  canAccessNavigationItem,
  canAccessPanel,
  defaultPanelPath,
  getPanelNavigation,
} from "./navigation";

function visiblePaths(panel: "admin" | "dashboard", capabilities: string[]) {
  return getPanelNavigation(panel)
    .filter((item) => canAccessNavigationItem(capabilities, item))
    .map((item) => item.href);
}

describe("V2 role navigation", () => {
  it("recognizes only the four database roles", () => {
    expect(allowedPanels(["ADMIN"])).toEqual(["admin"]);
    expect(allowedPanels(["SECURITY_OFFICER"])).toEqual(["dashboard"]);
    expect(allowedPanels(["EXECUTIVE"])).toEqual(["dashboard"]);
    expect(allowedPanels(["EMPLOYEE"])).toEqual(["dashboard"]);
    expect(allowedPanels(["CUSTOM_ROLE"])).toEqual([]);
    expect(defaultPanelPath(["CUSTOM_ROLE"])).toBe("/profile");
    expect(defaultPanelPath(["EMPLOYEE", "SECURITY_OFFICER"])).toBe(
      "/dashboard",
    );
    expect(canAccessPanel(["ADMIN"], "dashboard")).toBe(false);
    expect(canAccessPanel(["EXECUTIVE"], "executive-auditor")).toBe(true);
    expect(canAccessPanel(["EXECUTIVE_AUDITOR"], "executive-auditor")).toBe(
      false,
    );
  });

  it("uses direct module paths", () => {
    const adminPaths = getPanelNavigation("admin").map((item) => item.href);
    expect(adminPaths).toContain("/users");
    expect(adminPaths).toContain("/settings");
    expect(adminPaths).toContain("/integrations/schedules");
    expect(adminPaths).toContain("/login-history");
  });

  it("shows admin management but not ungranted modules", () => {
    const paths = visiblePaths("admin", [
      "users.read",
      "audit.read",
      "system-settings.read",
      "login-history.read",
    ]);
    expect(paths).toContain("/users");
    expect(paths).toContain("/audits");
    expect(paths).toContain("/settings");
    expect(paths).toContain("/login-history");
    expect(paths).not.toContain("/roles");
    expect(paths).not.toContain("/reports");
  });

  it("shows security officer operational modules", () => {
    const paths = visiblePaths("dashboard", [
      "assets.read",
      "risks.read",
      "incidents.read",
      "ai-alerts.read",
      "reports.read",
    ]);
    expect(paths).toContain("/assets");
    expect(paths).toContain("/risks");
    expect(paths).toContain("/incidents");
    expect(paths).toContain("/reports");
    expect(paths).not.toContain("/users");
    expect(paths).not.toContain("/audits");
  });

  it("limits executive navigation to assigned work", () => {
    const paths = visiblePaths("dashboard", ["incidents.read", "reports.read"]);
    expect(paths).toContain("/incidents");
    expect(paths).toContain("/reports");
    expect(paths).not.toContain("/users");
    expect(paths).not.toContain("/policies");
  });

  it("limits employee navigation to policy acknowledgement", () => {
    const paths = visiblePaths("dashboard", ["policies.acknowledge"]);
    expect(paths).toContain("/policies");
    expect(paths).not.toContain("/risks");
    expect(paths).not.toContain("/incidents");
    expect(paths).not.toContain("/reports");
  });
});
