import { expect, test } from "@playwright/test";

const id = "00000000-0000-4000-8000-000000000020";
const timestamp = "2026-11-01T00:00:00Z";
const message = "This Risk has a pending acceptance request. Changes are unavailable until the request is resolved.";

for (const width of [375, 768, 1440]) {
  test(`inherent assessment blocks pending acceptance at ${width}px`, async ({ page, context }) => {
    await page.setViewportSize({ width, height: 900 });
    await context.addCookies([{ name: "securaai_access", value: "risk-browser-test", domain: "127.0.0.1", path: "/" }]);
    let pending = width !== 1440;
    let writes = 0;
    const owner = { id, fullName: "Risk Owner", inactive: false };
    const record = () => ({
      id, riskCode: "TEST-RSK-PENDING", title: "Inherent assessment concurrency test", description: "Isolated browser fixture", status: "open", owner,
      reviewDate: null, createdAt: timestamp, updatedAt: timestamp, latestAssessment: null,
      assets: [{ id, code: "TEST-AST", name: "Test database", status: "active", criticality: "high" }],
      activeTreatmentPlan: null, linkedCounts: { controls: 0, treatmentPlans: 0, incidents: 0 }, createdBy: owner,
      assessments: [], controls: [], incidents: [], treatmentPlans: [],
      threats: [{ id, name: "Unauthorized access", description: null, createdAt: timestamp, updatedAt: timestamp }],
      vulnerabilities: [{ id, name: "Missing access checks", description: null, updatedAt: timestamp }],
      acceptances: pending ? [{ id, decision: "pending", reason: "Test pending request", requestedAt: timestamp, validUntil: null, requestedBy: id, decidedBy: null, decidedAt: null }] : [],
    });
    await page.route("**/api/auth/session", (route) => route.fulfill({ json: { success: true, data: { user: { id, email: "officer@example.test", fullName: "Security Officer", status: "active", mustChangePassword: false, roles: [{ code: "SECURITY_OFFICER", name: "Security Officer" }], permissions: ["risks.read", "risks.create"] } } } }));
    await page.route("**/api/risks?*", (route) => route.fulfill({ json: { success: true, data: { items: [record()], pagination: { page: 1, limit: 10, total: 1, totalPages: 1 } } } }));
    await page.route(`**/api/risks/${id}`, (route) => route.fulfill({ json: { success: true, data: record() } }));
    await page.route(`**/api/risks/${id}/inherent-assessments`, (route) => {
      writes++;
      return route.fulfill({ status: 409, json: { success: false, error: { code: "ACCEPTANCE_PENDING", message } } });
    });
    await page.goto("/risks");
    const actions = page.getByRole("button", { name: "Actions for TEST-RSK-PENDING" });
    await actions.scrollIntoViewIfNeeded();
    await actions.press("Enter");
    await page.getByRole("button", { name: "Assess inherent risk", exact: true }).press("Enter");
    const dialog = page.getByRole("dialog");
    const save = dialog.getByRole("button", { name: "Save assessment" });
    if (!pending) {
      await expect(save).toBeEnabled();
      await dialog.getByRole("radio", { name: /^4\s*Likely/ }).press("Space");
      await dialog.getByRole("radio", { name: /^3\s*Moderate/ }).press("Space");
      await dialog.getByLabel(/Assessment basis/).fill("Access testing confirmed the assessed likelihood and business impact.");
      pending = true;
      await save.click();
      await expect.poll(() => writes).toBe(1);
    }
    await expect(save).toBeDisabled();
    await expect(dialog.getByText(message).first()).toBeVisible();
    await expect(dialog.getByRole("radio", { name: /^3\s*Possible/ })).toBeDisabled();
    expect(writes).toBe(width === 1440 ? 1 : 0);
    await page.screenshot({ path: `test-results/inherent-pending-${width}.png`, fullPage: true });
    await dialog.getByRole("tab", { name: /History/ }).click();
    await expect(dialog.getByRole("tab", { name: /History/ })).toHaveAttribute("aria-selected", "true");
  });
}
