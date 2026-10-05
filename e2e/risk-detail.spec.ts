import { expect, test } from "@playwright/test";

const id = "00000000-0000-4000-8000-000000000010";
const ownerId = "00000000-0000-4000-8000-000000000011";
for (const width of [375, 1440]) {
  test(`risk detail read-only state and numeric dates at ${width}px`, async ({ page, context }) => {
    await page.setViewportSize({ width, height: 900 });
    await context.addCookies([{ name: "securaai_access", value: "risk-browser-test", domain: "127.0.0.1", path: "/" }]);
    const owner = { id: ownerId, fullName: "Risk Owner", inactive: false };
    const risk = {
      id, riskCode: "TEST-RSK-001", title: "Customer database exposure", description: "Risk detail browser fixture", status: "open", owner,
      reviewDate: "2027-01-31T00:00:00Z", createdAt: "2026-10-01T00:00:00Z", updatedAt: "2026-10-02T00:00:00Z",
      latestAssessment: null, assets: [], activeTreatmentPlan: null, linkedCounts: { controls: 0, treatmentPlans: 1, incidents: 0 },
      createdBy: owner, assessments: [], controls: [], incidents: [], threats: [], vulnerabilities: [], acceptances: [],
      vulnerabilityWorkflow: { canIdentify: false, blockedReason: "Security Officer role required.", assessmentReviewRequired: true },
      treatmentPlans: [{ id: ownerId, title: "Completed security plan", strategy: "mitigate", status: "completed", owner, targetCompletionDate: "2026-10-11T00:00:00Z", actionCount: 0, progress: 0, updatedAt: "2026-10-02T00:00:00Z", actions: [] }],
    };
    await page.route("**/api/auth/session", (route) => route.fulfill({ json: { success: true, data: { user: { id: ownerId, email: "owner@example.test", fullName: "Risk Owner", status: "active", mustChangePassword: false, roles: [{ code: "EMPLOYEE", name: "Employee" }], permissions: ["risks.read"] } } } }));
    await page.route("**/api/risks?*", (route) => route.fulfill({ json: { success: true, data: { items: [risk], pagination: { page: 1, limit: 10, total: 1, totalPages: 1 } } } }));
    await page.route(`**/api/risks/${id}`, (route) => route.fulfill({ json: { success: true, data: risk } }));
    await page.goto("/risks");
    const actions = page.getByRole("button", { name: "Actions for TEST-RSK-001" });
    await actions.scrollIntoViewIfNeeded();
    await actions.focus();
    await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())));
    await actions.click();
    await page.getByText("View details", { exact: true }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText("31/01/2027", { exact: true })).toBeVisible();
    await expect(dialog.getByText("Created by", { exact: true })).toBeVisible();
    await expect(dialog.getByText("No risk acceptance requests recorded.")).toBeVisible();
    await expect(dialog.getByText(/Existing ratings are historical/)).toBeVisible();
    await expect(dialog.getByText("Read-only", { exact: true })).toBeVisible();
    await expect(dialog.getByRole("button", { name: /submit acceptance/ })).toBeDisabled();
    await expect(dialog.getByRole("button", { name: /Update Completed/ })).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await dialog.getByRole("button", { name: "Close", exact: true }).click();
    await expect(dialog).not.toBeVisible();
  });
}
