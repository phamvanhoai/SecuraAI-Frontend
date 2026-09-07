import { describe, expect, it } from "vitest";
import { getPanelNavigation, panelHasModule } from "./navigation";

describe("panel navigation", () => {
  it("gives the admin every management module under the admin prefix", () => {
    const links = getPanelNavigation("admin").map((item) => item.href);
    expect(links).toContain("/admin/users");
    expect(links).toContain("/admin/settings");
    expect(links.every((href) => href.startsWith("/admin"))).toBe(true);
  });

  it("limits employee navigation to employee functions", () => {
    const links = getPanelNavigation("employee").map((item) => item.href);
    expect(links).toContain("/employee/training");
    expect(links).toContain("/employee/policies");
    expect(links).not.toContain("/employee/users");
  });

  it("limits modules exposed by each specialist panel", () => {
    expect(panelHasModule("security-officer", "risks")).toBe(true);
    expect(panelHasModule("security-officer", "users")).toBe(false);
    expect(panelHasModule("executive-auditor", "audits")).toBe(true);
    expect(panelHasModule("executive-auditor", "ai-models")).toBe(false);
  });
});
