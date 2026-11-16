import { expect, test } from "@playwright/test";

const id = "11111111-1111-4111-8111-111111111111";
const date = "2026-11-09T00:00:00Z";
for (const editing of [false, true]) {
  test(`search responsible owner outside the first results in ${editing ? "Update" : "Create"}`, async ({ page, context }) => {
    await context.addCookies([{ name: "securaai_access", value: "owner-search-test", domain: "127.0.0.1", path: "/" }]);
    const owner = { id, fullName: "Existing owner", inactive: false };
    const found = { id: "22222222-2222-4222-8222-222222222222", fullName: "Another owner", email: "another@example.test" };
    const plan = { id, riskId: id, title: "Demo treatment plan", strategy: "mitigate", status: "active", owner, targetCompletionDate: date, actionCount: 0, progress: 0, updatedAt: date, actions: [], controls: [] };
    const risk = {
      id, riskCode: "TEST-OWNER", title: "Responsible owner search", description: null, status: "open", owner, createdBy: owner,
      reviewDate: null, createdAt: date, updatedAt: date, latestAssessment: null, assets: [],
      activeTreatmentPlan: editing ? { id, title: plan.title, status: "active" } : null,
      linkedCounts: { controls: 0, treatmentPlans: editing ? 1 : 0, incidents: 0 },
      assessments: [], controls: [], incidents: [], threats: [], vulnerabilities: [], acceptances: [], treatmentPlans: editing ? [plan] : [], canManageTreatmentPlan: true,
    };
    let searches = 0;
    await page.route("**/api/**", (route) => route.fulfill({ json: { success: true, data: {} } }));
    await page.route("**/api/auth/session", (route) => route.fulfill({ json: { success: true, data: { user: { id, email: "officer@example.test", fullName: "Officer", status: "active", mustChangePassword: false, roles: [{ code: "SECURITY_OFFICER", name: "Security Officer" }], permissions: ["risks.read", "risks.create"] } } } }));
    await page.route("**/api/risks?*", (route) => route.fulfill({ json: { success: true, data: { items: [risk], pagination: { page: 1, limit: 10, total: 1, totalPages: 1 } } } }));
    await page.route(`**/api/risks/${id}`, (route) => route.fulfill({ json: { success: true, data: risk } }));
    await page.route("**/api/risks/treatment-plans/create-options?*", (route) => {
      const query = new URL(route.request().url()).searchParams.get("q");
      if (query === found.email) searches++;
      return route.fulfill({ json: { success: true, data: { users: query === found.email ? [found] : [], controls: [] } } });
    });
    await page.goto("/risks");
    await page.getByRole("button", { name: "Actions for TEST-OWNER" }).press("Enter");
    await page.getByRole("button", { name: editing ? "Update treatment plan" : "Create treatment plan", exact: true }).press("Enter");
    const dialog = page.getByRole("dialog");
    const trigger = dialog.getByRole("button", { name: /^Responsible owner/ });
    if (editing) await expect(trigger).toHaveText("Existing owner");
    await trigger.click();
    await dialog.getByLabel("Find owner by name or email").fill(found.email);
    await dialog.getByLabel("Find owner by name or email").press("Enter");
    await dialog.getByRole("button", { name: `${found.fullName} ${found.email}`, exact: true }).click();
    await expect(trigger).toContainText(found.email);
    expect(searches).toBeGreaterThan(0);
    await trigger.click();
    await dialog.getByLabel("Find owner by name or email").press("Escape");
    await expect(dialog).toBeVisible();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
  });
}
