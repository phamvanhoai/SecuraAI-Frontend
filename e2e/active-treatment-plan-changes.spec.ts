import { expect, test } from "@playwright/test";

const id = "11111111-1111-4111-8111-111111111111";
const actionId = "22222222-2222-4222-8222-222222222222";
const date = "2026-11-09T00:00:00Z";
for (const mode of ["active", "draft", "cancel"] as const) {
  test(`${mode} plan strategy and change reason`, async ({ page, context }) => {
    await context.addCookies([{ name: "securaai_access", value: "active-plan-test", domain: "127.0.0.1", path: "/" }]);
    const owner = { id, fullName: "Demo Owner", inactive: false };
    const plan = {
      id, riskId: id, title: "Demo treatment plan", strategy: "mitigate", status: mode === "draft" ? "draft" : "active", owner,
      targetCompletionDate: "2099-12-31T00:00:00Z", actionCount: 1, progress: 0, updatedAt: date,
      controls: [{ id, code: "CTRL-DEMO", name: "Demo control" }],
      actions: [{ id: actionId, title: "Original verification", assignedToUserId: id, dueDate: "2099-12-31T00:00:00Z", status: "pending", completedAt: null }],
    };
    const risk = { id, riskCode: "TEST-PLAN", title: "Strategy and reason demo", description: null, status: "under_treatment", owner, createdBy: owner,
      reviewDate: null, createdAt: date, updatedAt: date, latestAssessment: null, assets: [], activeTreatmentPlan: { id, title: plan.title, status: plan.status },
      linkedCounts: { controls: 1, treatmentPlans: 1, incidents: 0 }, assessments: [], controls: [], incidents: [], threats: [], vulnerabilities: [], acceptances: [], treatmentPlans: [plan], canManageTreatmentPlan: true,
    };
    let writes = 0;
    await page.route("**/api/**", (route) => route.fulfill({ json: { success: true, data: {} } }));
    await page.route("**/api/auth/session", (route) => route.fulfill({ json: { success: true, data: { user: { id, email: "officer@example.test", fullName: "Officer", status: "active", mustChangePassword: false, roles: [{ code: "SECURITY_OFFICER", name: "Security Officer" }], permissions: ["risks.read", "risks.create"] } } } }));
    await page.route("**/api/risks?*", (route) => route.fulfill({ json: { success: true, data: { items: [risk], pagination: { page: 1, limit: 10, total: 1, totalPages: 1 } } } }));
    await page.route(`**/api/risks/${id}`, (route) => route.fulfill({ json: { success: true, data: risk } }));
    await page.route("**/api/risks/treatment-plans/create-options?*", (route) => route.fulfill({ json: { success: true, data: { users: [{ ...owner, email: "owner@example.test" }], controls: plan.controls.map(c => ({ ...c, implementationStatus: "implemented" })) } } }));
    await page.route(`**/api/risks/treatment-plans/${id}`, (route) => {
      const payload = route.request().postDataJSON();
      writes++;
      if (mode === "draft") expect(payload).toMatchObject({ strategy: "transfer" });
      else expect(payload).toMatchObject({ strategy: "mitigate", changeReason: "Revise treatment work after operational review." });
      if (mode === "cancel") {
        expect(payload).toMatchObject({ title: plan.title, status: "cancelled" });
        expect(payload.actions).toHaveLength(1);
        expect(payload.actions[0]).toMatchObject({ id: actionId, title: "Original verification", status: "pending" });
      }
      return route.fulfill({ json: { success: true, data: {} } });
    });
    await page.goto("/risks");
    await page.getByRole("button", { name: "Actions for TEST-PLAN" }).press("Enter");
    await page.getByRole("button", { name: "Update treatment plan", exact: true }).press("Enter");
    const dialog = page.getByRole("dialog");
    const transfer = dialog.getByRole("radio", { name: /^Transfer/ });
    if (mode === "draft") {
      await expect(transfer).toBeEnabled();
      await transfer.press("Space");
    } else {
      await expect(transfer).toBeDisabled();
      await expect(dialog.getByText(/Treatment strategy cannot change while the plan is Active/)).toBeVisible();
      await dialog.getByRole("button", { name: "Save changes" }).click();
      await expect(dialog.getByText("Enter a reason (10–2000 characters) before saving.")).toBeVisible();
      expect(writes).toBe(0);
      if (mode === "cancel") {
        await dialog.getByLabel("Plan title", { exact: true }).fill("Discard this unsaved edit");
        await dialog.getByLabel("Plan status", { exact: true }).selectOption("cancelled");
      }
      await dialog.getByLabel(mode === "cancel" ? "Cancellation reason *" : "Change reason *", { exact: true }).fill("Revise treatment work after operational review.");
    }
    await dialog.getByRole("button", { name: "Save changes" }).click();
    await expect(dialog).not.toBeVisible();
    expect(writes).toBe(1);
  });
}
