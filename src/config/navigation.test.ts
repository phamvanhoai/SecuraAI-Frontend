import { describe, expect, it } from "vitest";
import {
  allowedPanels,
  canAccessNavigationItem,
  canAccessPanel,
  defaultPanelPath,
  getPanelNavigation,
  panelHasModule,
} from "./navigation";

describe("panel navigation", () => {
  it("gives the admin every management module under the admin prefix", () => {
    const links = getPanelNavigation("admin").map((item) => item.href);
    expect(links).toContain("/admin/users");
    expect(links).toContain("/admin/settings");
    // Sync Schedules is a direct-href item (not panel-prefixed)
    expect(links).toContain("/integrations/schedules");
    const panelLinks = links.filter(
      (href) => href !== "/integrations/schedules",
    );
    expect(panelLinks.every((href) => href.startsWith("/admin"))).toBe(true);
  });

  it("limits employee navigation to employee functions", () => {
    const links = getPanelNavigation("employee").map((item) => item.href);
    expect(links).toContain("/employee/training");
    expect(links).toContain("/employee/policies");
    expect(links).not.toContain("/employee/users");
  });

  it("limits modules exposed by each specialist panel", () => {
    expect(panelHasModule("security-officer", "risks")).toBe(true);
    expect(panelHasModule("security-officer", "policies")).toBe(true);
    expect(panelHasModule("security-officer", "training")).toBe(true);
    expect(panelHasModule("security-officer", "users")).toBe(false);
    expect(panelHasModule("executive-auditor", "audits")).toBe(true);
    expect(panelHasModule("executive-auditor", "anomaly-monitoring")).toBe(true);
    expect(panelHasModule("executive-auditor", "ai-models")).toBe(false);
  });

  it("allows only panels backed by assigned system roles", () => {
    expect(allowedPanels(["ADMIN"])).toEqual(["admin"]);
    expect(allowedPanels(["SECURITY_OFFICER", "EMPLOYEE"])).toEqual([
      "security-officer",
      "employee",
    ]);
    expect(canAccessPanel(["ADMIN"], "security-officer")).toBe(false);
  });

  it("chooses a deterministic default panel for multi-role users", () => {
    expect(defaultPanelPath(["EMPLOYEE", "SECURITY_OFFICER"])).toBe(
      "/security-officer",
    );
    expect(defaultPanelPath(["CUSTOM_ROLE"])).toBe("/profile");
  });

  it("filters permission-bound navigation items", () => {
    const assets = getPanelNavigation("admin").find((item) =>
      item.href.endsWith("/assets"),
    );
    expect(assets).toBeDefined();
    if (!assets) return;
    expect(canAccessNavigationItem([], assets)).toBe(false);
    expect(canAccessNavigationItem(["assets.read"], assets)).toBe(true);
  });

  it("shows Security Officer training only with course read permission", () => {
    const training = getPanelNavigation("security-officer").find(
      (item) => item.href === "/security-officer/training",
    );
    expect(training).toBeDefined();
    if (!training) return;
    expect(canAccessNavigationItem([], training)).toBe(false);
    expect(canAccessNavigationItem(["training-courses.read"], training)).toBe(true);
  });
});
