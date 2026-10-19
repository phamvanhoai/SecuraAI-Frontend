import { expect, test } from "@playwright/test";

const id = "11111111-1111-4111-8111-111111111111";
const ownerId = "22222222-2222-4222-8222-222222222222";
for (const width of [375, 768, 1440]) {
  test(`Accept plan records costs without fake actions at ${width}px`, async ({ page, context }) => {
    await page.setViewportSize({ width, height: 900 });
    await context.addCookies([{ name: "securaai_access", value: "synthetic-accept-plan", domain: "127.0.0.1", path: "/" }]);
    const owner = { id: ownerId, fullName: "Demo Owner", inactive: false };
    const risk = { id, riskCode: "TEST-ACCEPT-COST", title: "Synthetic export exposure", description: "Browser test fixture only", status: "open", owner, createdBy: owner, reviewDate: null, createdAt: "2026-10-01T00:00:00Z", updatedAt: "2026-10-19T00:00:00Z", latestAssessment: null, assets: [], activeTreatmentPlan: null, linkedCounts: { controls: 0, treatmentPlans: 0, incidents: 0 }, assessments: [], controls: [], incidents: [], threats: [], vulnerabilities: [], treatmentPlans: [], acceptances: [] };
    await page.route("**/api/auth/session", route => route.fulfill({ json: { success: true, data: { user: { id: ownerId, email: "owner@example.test", fullName: owner.fullName, status: "active", mustChangePassword: false, roles: [{ code: "EMPLOYEE", name: "Employee" }], permissions: ["risks.read"] } } } }));
    await page.route("**/api/risks?*", route => route.fulfill({ json: { success: true, data: { items: [risk], pagination: { page: 1, limit: 10, total: 1, totalPages: 1 } } } }));
    await page.route(`**/api/risks/${id}`, route => route.fulfill({ json: { success: true, data: risk } }));
    await page.route("**/api/risks/treatment-plans/create-options?*", route => route.fulfill({ json: { success: true, data: { users: [{ ...owner, email: "owner@example.test" }], controls: [] } } }));
    await page.route("**/api/risks/treatment-plans", route => {
      expect(route.request().postDataJSON()).toMatchObject({ strategy: "accept", actions: [], acceptanceCost: { costToFix: "100000000", expectedLoss: "5000000", currency: "VND", periodMonths: 12, basis: "Synthetic comparison of total costs and expected loss over twelve months." } });
      return route.fulfill({ status: 201, json: { success: true, data: { id: ownerId, status: "draft" } } });
    });
    await page.goto("/risks");
    const trigger = page.getByRole("button", { name: "Actions for TEST-ACCEPT-COST" });
    await trigger.scrollIntoViewIfNeeded();
    await trigger.focus();
    await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())));
    await trigger.press("Enter");
    await page.getByText("Create treatment plan", { exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Create Risk Treatment Plan" });
    await dialog.getByLabel("Plan title", { exact: true }).fill("Accept synthetic exposure");
    await dialog.getByLabel("Treatment option").selectOption("accept");
    await expect(dialog.getByRole("button", { name: "Add action" })).toHaveCount(0);
    await dialog.getByLabel("Responsible owner").selectOption(ownerId);
    await dialog.getByLabel("Due date", { exact: true }).fill("2027-12-31");
    await dialog.getByLabel("Cost to fix *", { exact: true }).fill("100000000");
    await dialog.getByLabel("Expected loss *", { exact: true }).fill("5000000");
    await dialog.getByLabel("Estimation basis and acceptance rationale *").fill("Synthetic comparison of total costs and expected loss over twelve months.");
    expect((await dialog.boundingBox())?.width).toBeLessThanOrEqual(width);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await dialog.getByRole("button", { name: "Create plan", exact: true }).click();
    await expect(dialog).not.toBeVisible();
  });
}
