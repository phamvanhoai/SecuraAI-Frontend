import { expect, test } from "@playwright/test";

const id = "11111111-1111-4111-8111-111111111111";
const date = "2026-11-09T00:00:00Z";
const message = "This Risk is overdue for review. Open and complete Risk Review before submitting an acceptance request.";
for (const width of [375, 1440]) {
  test(`overdue Risk requires review before acceptance and retains ongoing actions at ${width}px`, async ({ page, context }) => {
    await page.setViewportSize({ width, height: 900 });
    await context.addCookies([{ name: "securaai_access", value: "overdue-browser-test", domain: "127.0.0.1", path: "/" }]);
    const owner = { id, fullName: "Risk Owner", inactive: false };
    const risk = {
      id, riskCode: "TEST-OVERDUE", title: "Overdue review acceptance gate", description: "Synthetic browser fixture", status: "under_treatment", owner, createdBy: owner,
      reviewDate: "2020-01-01T00:00:00Z", createdAt: date, updatedAt: date, latestAssessment: null, assets: [], activeTreatmentPlan: null,
      linkedCounts: { controls: 0, treatmentPlans: 0, incidents: 0 }, assessments: [], controls: [], incidents: [], threats: [], vulnerabilities: [], acceptances: [], treatmentPlans: [],
      canAssessResidual: true, canDefineTarget: true, canManageTreatmentPlan: true,
      acceptanceWorkflow: { canSubmit: false, canOpenReview: true, blockedReason: message },
    };
    let writes = 0;
    await page.route("**/api/**", (route) => {
      if (route.request().method() !== "GET") writes++;
      return route.fulfill({ json: { success: true, data: {} } });
    });
    await page.route("**/api/auth/session", (route) => route.fulfill({ json: { success: true, data: { user: { id, email: "owner@example.test", fullName: "Risk Owner", status: "active", mustChangePassword: false, roles: [{ code: "EMPLOYEE", name: "Employee" }], permissions: ["risks.read"] } } } }));
    await page.route("**/api/risks?*", (route) => route.fulfill({ json: { success: true, data: { items: [risk], pagination: { page: 1, limit: 10, total: 1, totalPages: 1 } } } }));
    await page.route(`**/api/risks/${id}`, (route) => route.fulfill({ json: { success: true, data: risk } }));
    await page.goto("/risks");
    await page.getByRole("button", { name: "Actions for TEST-OVERDUE" }).press("Enter");
    await expect(page.getByRole("button", { name: "Assess residual risk", exact: true })).toBeEnabled();
    await expect(page.getByRole("button", { name: "Create treatment plan", exact: true })).toBeEnabled();
    await page.getByRole("button", { name: "View details", exact: true }).press("Enter");
    const dialog = page.getByRole("dialog");
    await dialog.locator("summary").filter({ hasText: "Risk acceptance" }).click();
    await expect(dialog.getByText(message, { exact: true })).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Review and submit acceptance", exact: true })).toBeDisabled();
    await expect(dialog.getByRole("button", { name: "Open risk review", exact: true })).toBeEnabled();
    expect(writes).toBe(0);
  });
}
