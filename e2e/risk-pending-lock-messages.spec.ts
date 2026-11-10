import { expect, test } from "@playwright/test";

const id = "00000000-0000-4000-8000-000000000020";
const date = "2026-11-01T00:00:00Z";
const message = "This Risk has a pending acceptance request. Changes are unavailable until the request is resolved.";

for (const width of [375, 768, 1440]) {
  test(`Risk write forms share the pending message at ${width}px`, async ({ page, context }) => {
    await page.setViewportSize({ width, height: 900 });
    await context.addCookies([{ name: "securaai_access", value: "risk-browser-test", domain: "127.0.0.1", path: "/" }]);
    let planExists = false;
    let writes = 0;
    const owner = { id, fullName: "Demo owner", inactive: false };
    const plan = { id, riskId: id, title: "Demo plan", strategy: "mitigate", status: "active", owner, targetCompletionDate: date, actionCount: 0, progress: 0, updatedAt: date, actions: [], controls: [] };
    const record = () => ({
      id, riskCode: "TEST-PENDING", title: "Pending warning browser fixture", description: "Synthetic fixture", status: "under_treatment", owner, reviewDate: null,
      createdAt: date, updatedAt: date, createdBy: owner, latestAssessment: null,
      assets: [{ id, code: "TEST-AST", name: "Demo asset", status: "active", criticality: "medium" }],
      activeTreatmentPlan: planExists ? { id, title: plan.title, status: "active" } : null,
      linkedCounts: { controls: 0, treatmentPlans: planExists ? 1 : 0, incidents: 0 },
      assessments: [], controls: [], incidents: [], treatmentPlans: planExists ? [plan] : [],
      threats: [{ id, name: "Demo threat", description: null, createdAt: date, updatedAt: date }],
      vulnerabilities: [{ id, name: "Demo weakness", description: null, updatedAt: date }],
      acceptances: [{ id, decision: "pending", reason: "Demo request", requestedAt: date, validUntil: null, requestedBy: id, decidedBy: null, decidedAt: null }],
      canAssessResidual: true, canDefineTarget: true, canManageTreatmentPlan: true,
      vulnerabilityWorkflow: { canIdentify: false, blockedReason: message, assessmentReviewRequired: false },
    });
    await page.route("**/api/**", async (route) => {
      if (route.request().method() !== "GET") { writes++; return route.abort(); }
      return route.fulfill({ json: { success: true, data: {} } });
    });
    await page.route("**/api/auth/session", (route) => route.fulfill({ json: { success: true, data: { user: { id, email: "officer@example.test", fullName: "Security Officer", status: "active", mustChangePassword: false, roles: [{ code: "SECURITY_OFFICER", name: "Security Officer" }], permissions: ["risks.read", "risks.create"] } } } }));
    await page.route("**/api/risks?*", (route) => route.fulfill({ json: { success: true, data: { items: [record()], pagination: { page: 1, limit: 10, total: 1, totalPages: 1 } } } }));
    await page.route(`**/api/risks/${id}`, (route) => route.fulfill({ json: { success: true, data: record() } }));
    await page.route("**/api/risks/treatment-plans/create-options?*", (route) => route.fulfill({ json: { success: true, data: { users: [], controls: [] } } }));
    await page.route(`**/api/risks/${id}/vulnerability-control-options?*`, (route) => route.fulfill({ json: { success: true, data: [] } }));

    for (const [action, save] of [
      ["Identify threat", "Identify threat"], ["Identify vulnerability", "Identify vulnerability"],
      ["Assess inherent risk", "Save assessment"], ["Assess residual risk", "Save residual assessment"],
      ["Define target risk", "Define target"], ["Create treatment plan", "Create plan"], ["Update treatment plan", null],
    ] as const) {
      await test.step(action, async () => {
        planExists = action === "Update treatment plan";
        await page.goto("/risks");
        const menu = page.getByRole("button", { name: "Actions for TEST-PENDING" });
        await menu.scrollIntoViewIfNeeded();
        await menu.press("Enter");
        await page.getByRole("button", { name: action, exact: true }).press("Enter");
        const dialog = page.getByRole("dialog");
        await expect(dialog.getByText(message, { exact: true })).toBeVisible();
        if (save) await expect(dialog.getByRole("button", { name: save, exact: true })).toBeDisabled();
        const history = dialog.getByRole("tab", { name: /History/ });
        if (await history.count()) {
          await history.click();
          await expect(history).toHaveAttribute("aria-selected", "true");
        }
        expect(writes).toBe(0);
      });
    }
  });
}
