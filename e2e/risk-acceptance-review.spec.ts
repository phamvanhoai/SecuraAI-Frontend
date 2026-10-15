import { expect, test } from "@playwright/test";

const id = "11111111-1111-4111-8111-111111111111";
const ownerId = "22222222-2222-4222-8222-222222222222";
const acceptanceId = "33333333-3333-4333-8333-333333333333";
for (const width of [375, 1440]) {
  test(`expired acceptance and Owner review at ${width}px`, async ({ page, context }) => {
    await page.setViewportSize({ width, height: 900 });
    await context.addCookies([{ name: "securaai_access", value: "synthetic-risk-review-test", domain: "127.0.0.1", path: "/" }]);
    const owner = { id: ownerId, fullName: "Risk Owner", inactive: false };
    const risk = {
      id, riskCode: "TEST-REVIEW", title: "Database recovery", description: "Synthetic review fixture", status: "accepted", owner, createdBy: owner,
      reviewDate: null, createdAt: "2026-10-01T00:00:00Z", updatedAt: "2026-10-14T00:00:00Z",
      latestAssessment: null, assets: [], activeTreatmentPlan: null, linkedCounts: { controls: 0, treatmentPlans: 0, incidents: 0 },
      assessments: [], controls: [], incidents: [], threats: [], vulnerabilities: [], treatmentPlans: [],
      acceptanceWorkflow: { canSubmit: false, canOpenReview: true, blockedReason: "Review the accepted Risk first." },
      acceptances: [{ id: acceptanceId, decision: "approved", reason: "Original Owner justification", requestReason: "Original Owner justification", decisionReason: "Approved with monitoring", requestedAt: "2020-01-01T00:00:00Z", validUntil: "2020-01-02T00:00:00Z", requestedBy: ownerId, decidedBy: id, decidedAt: "2020-01-01T00:00:00Z", expired: true, canDecide: false }],
    };
    await page.route("**/api/auth/session", (route) => route.fulfill({ json: { success: true, data: { user: { id: ownerId, email: "owner@example.test", fullName: "Risk Owner", status: "active", mustChangePassword: false, roles: [{ code: "EMPLOYEE", name: "Employee" }], permissions: ["risks.read"] } } } }));
    await page.route("**/api/risks?*", (route) => route.fulfill({ json: { success: true, data: { items: [risk], pagination: { page: 1, limit: 10, total: 1, totalPages: 1 } } } }));
    await page.route(`**/api/risks/${id}`, (route) => route.fulfill({ json: { success: true, data: risk } }));
    await page.route(`**/api/risks/${id}/review`, (route) => {
      expect(route.request().postDataJSON()).toEqual({ reason: "Review expired acceptance and current exposure.", expectedUpdatedAt: "2026-10-14T00:00:00Z" });
      risk.status = "open";
      risk.acceptanceWorkflow = { canSubmit: false, canOpenReview: false, blockedReason: "Assess residual risk before submitting acceptance." };
      return route.fulfill({ json: { success: true, data: { riskId: id, status: "open" } } });
    });
    await page.goto("/risks");
    await page.getByRole("button", { name: "Actions for TEST-REVIEW" }).click();
    await page.getByText("View details", { exact: true }).click();
    const detail = page.getByRole("dialog");
    await expect(detail.getByText("approved — Expired", { exact: true })).toBeVisible();
    await expect(detail.getByText("Request justification: Original Owner justification")).toBeVisible();
    await expect(detail.getByText("Decision rationale: Approved with monitoring")).toBeVisible();
    await detail.getByRole("button", { name: "Open risk review" }).click();
    const review = page.getByRole("dialog", { name: "Open Risk Review", exact: true });
    await review.getByLabel("Review rationale").fill("Review expired acceptance and current exposure.");
    await review.getByRole("button", { name: "Open review", exact: true }).click();
    await expect(review).not.toBeVisible();
    await expect(detail.getByText("Assess residual risk before submitting acceptance.")).toBeVisible();
    await expect(detail.getByText("approved — Expired", { exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}
