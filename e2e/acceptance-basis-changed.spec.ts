import { expect, test } from "@playwright/test";

const id = "11111111-1111-4111-8111-111111111111";
const ownerId = "22222222-2222-4222-8222-222222222222";
const acceptanceId = "33333333-3333-4333-8333-333333333333";
const date = "2026-11-09T00:00:00Z";
for (const width of [375, 1440]) {
  for (const basis of ["Asset classification or context", "Evidence or its Control links", "Overdue review"]) {
    test(`${basis} changed: Approve disabled, Reject available at ${width}px`, async ({ page, context }) => {
      await page.setViewportSize({ width, height: 900 });
      await context.addCookies([{ name: "securaai_access", value: "acceptance-basis-browser-test", domain: "127.0.0.1", path: "/" }]);
      const message = basis === "Overdue review"
        ? "This Risk is overdue for review. Reject this request so the Risk Owner can open and complete Risk Review, then submit a new acceptance request."
        : `${basis} changed after submission. Reject this request, reassess the Risk, and submit a new acceptance request.`;
      const owner = { id: ownerId, fullName: "Risk Owner", inactive: false };
      let rejected = false;
      const record = () => ({
        id, riskCode: "TEST-BASIS", title: "Acceptance basis test", description: "Synthetic browser fixture", status: "under_treatment", owner, createdBy: owner,
        reviewDate: basis === "Overdue review" ? "2020-01-01T00:00:00Z" : null, createdAt: date, updatedAt: date, latestAssessment: null, assets: [], activeTreatmentPlan: null,
        linkedCounts: { controls: 0, treatmentPlans: 0, incidents: 0 }, assessments: [], controls: [], incidents: [], threats: [], vulnerabilities: [], treatmentPlans: [],
        acceptances: [{ id: acceptanceId, decision: rejected ? "rejected" : "pending", reason: "Original owner justification", requestedAt: date, validUntil: null, requestedBy: ownerId, decidedBy: rejected ? id : null, decidedAt: rejected ? date : null, canDecide: !rejected, approvalBlockedReason: message }],
      });
      await page.route("**/api/**", (route) => route.fulfill({ json: { success: true, data: {} } }));
      await page.route("**/api/auth/session", (route) => route.fulfill({ json: { success: true, data: { user: { id, email: "approver@example.test", fullName: "Demo Approver", status: "active", mustChangePassword: false, roles: [{ code: "SECURITY_OFFICER", name: "Security Officer" }], permissions: ["risks.read"] } } } }));
      await page.route("**/api/risks?*", (route) => route.fulfill({ json: { success: true, data: { items: [record()], pagination: { page: 1, limit: 10, total: 1, totalPages: 1 } } } }));
      await page.route(`**/api/risks/${id}`, (route) => route.fulfill({ json: { success: true, data: record() } }));
      await page.route(`**/api/risks/acceptances/${acceptanceId}/decision`, (route) => {
        expect(route.request().method()).toBe("PATCH");
        expect(route.request().postDataJSON()).toMatchObject({ decision: "rejected", reason: "Reject changed basis and request reassessment." });
        rejected = true;
        return route.fulfill({ json: { success: true, data: { id: acceptanceId, decision: "rejected" } } });
      });
      await page.goto("/risks");
      await page.getByRole("button", { name: "Actions for TEST-BASIS" }).press("Enter");
      await page.getByRole("button", { name: "View details", exact: true }).press("Enter");
      const detail = page.getByRole("dialog");
      await detail.locator("summary").filter({ hasText: "Risk acceptance" }).click();
      await detail.getByRole("button", { name: "Review decision" }).click();
      const decision = page.getByRole("dialog", { name: "Risk Acceptance Decision", exact: true });
      await expect(decision.getByText(message)).toBeVisible();
      await expect(decision.getByRole("option", { name: "Approve", exact: true })).toHaveJSProperty("disabled", true);
      await expect(decision.getByRole("option", { name: "Reject", exact: true })).toHaveJSProperty("disabled", false);
      await expect(decision.getByRole("combobox")).toHaveValue("rejected");
      await decision.getByLabel("Decision rationale").fill("Reject changed basis and request reassessment.");
      await decision.getByRole("button", { name: "Record decision", exact: true }).click();
      await expect(decision).not.toBeVisible();
      expect(rejected).toBe(true);
    });
  }
}
