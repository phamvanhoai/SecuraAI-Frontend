import { expect, test } from "@playwright/test";
const id = "00000000-0000-4000-8000-000000000010";
const ownerId = "00000000-0000-4000-8000-000000000011";
for (const width of [375, 768, 1440]) {
  test(`complete review and preserve completion history at ${width}px`, async ({ page, context }) => {
    await page.clock.install({ time: new Date("2026-10-27T10:00:00Z") });
    await page.setViewportSize({ width, height: 900 });
    await context.addCookies([{ name: "securaai_access", value: "review-browser-fixture", domain: "127.0.0.1", path: "/" }]);
    let completed = false;
    const owner = { id: ownerId, fullName: "Assigned Owner", inactive: false };
    const assessment = { id: ownerId, type: "periodic_review", inherentLikelihood: 4, inherentImpact: 4, inherentRating: "high", controlEffectiveness: 80,
      residualLikelihood: 2, residualImpact: 5, residualRating: "high", targetRisk: "medium", riskAppetite: "medium", riskTolerance: "medium",
      reason: "Reviewed current controls", methodologyVersion: "SECURAAI-RISK-MATRIX-v1", assessedBy: owner, assessedAt: "2026-10-26T00:00:00Z", reviewDate: null };
    const risk = () => ({ id, riskCode: "TEST-REVIEW", title: "Portal data exposure", description: "Review browser fixture", status: "open", owner,
      reviewDate: completed ? "2027-01-27T00:00:00Z" : "2026-10-16T00:00:00Z", createdAt: "2026-10-01T00:00:00Z", updatedAt: "2026-10-25T00:00:00Z",
      latestAssessment: assessment, assessments: [assessment], assets: [], activeTreatmentPlan: null, linkedCounts: { controls: 0, treatmentPlans: 0, incidents: 0 },
      createdBy: owner, controls: [], incidents: [], threats: [], vulnerabilities: [], acceptances: [], treatmentPlans: [],
      currentReview: completed ? null : { openedAt: "2026-10-25T00:00:00Z", openedBy: ownerId, openedByName: owner.fullName, previousReviewDate: "2026-10-16T00:00:00Z", reason: "Scheduled periodic review" },
      canCompleteReview: !completed, reviewInProgress: !completed,
      acceptanceWorkflow: { canSubmit: completed, canOpenReview: completed, blockedReason: completed ? null : "Complete Risk Review before submitting a new acceptance request." },
      reviewHistory: completed ? [{ completedAt: "2026-10-27T10:00:00Z", completedByName: owner.fullName, conclusion: "Reviewed context and current controls.",
        nextReviewDate: "2027-01-27", residualRating: "high", openedAt: "2026-10-25T00:00:00Z", openedByName: owner.fullName,
        previousReviewDate: "2026-10-16T00:00:00Z", openingReason: "Scheduled periodic review" }] : [],
    });
    await page.route("**/api/**", (route) => route.fulfill({ status: 503, json: { success: false, error: { code: "SERVICE_UNAVAILABLE", message: "Outside test scope" } } }));
    await page.route("**/api/auth/session", (route) => route.fulfill({ json: { success: true, data: { user: { id: ownerId, email: "owner@example.test", fullName: owner.fullName,
      status: "active", mustChangePassword: false, roles: [{ code: "EMPLOYEE", name: "Employee" }], permissions: ["risks.read"] } } } }));
    await page.route("**/api/risks?*", (route) => route.fulfill({ json: { success: true, data: { items: [risk()], pagination: { page: 1, limit: 10, total: 1, totalPages: 1 } } } }));
    await page.route(`**/api/risks/${id}`, (route) => route.fulfill({ json: { success: true, data: risk() } }));
    await page.route(`**/api/risks/${id}/review/complete`, async (route) => {
      expect(route.request().postDataJSON()).toMatchObject({ conclusion: "Reviewed context and current controls.", nextReviewDate: "2027-01-27", assessmentId: ownerId,
        expectedOpenedAt: "2026-10-25T00:00:00Z", expectedUpdatedAt: "2026-10-25T00:00:00Z" });
      completed = true;
      await route.fulfill({ json: { success: true, data: { riskId: id, nextReviewDate: "2027-01-27", completedAt: "2026-10-27T10:00:00Z" } } });
    });
    await page.goto("/risks");
    const trigger = page.getByRole("button", { name: "Actions for TEST-REVIEW" });
    await trigger.scrollIntoViewIfNeeded(); await trigger.click();
    await page.getByText("View details", { exact: true }).click();
    const initialDetail = page.getByRole("dialog");
    await initialDetail.locator("summary").filter({ hasText: "Risk acceptance (0)" }).click();
    await expect(initialDetail.getByText("Complete Risk Review before submitting a new acceptance request.")).toBeVisible();
    await expect(initialDetail.getByRole("button", { name: "Review and submit acceptance" })).toBeDisabled();
    await page.getByRole("button", { name: "Complete Risk Review", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Complete Risk Review", exact: true });
    await expect(dialog.getByLabel("Next review date")).toHaveValue("2027-01-27");
    await dialog.getByLabel("Review conclusion").fill("Reviewed context and current controls.");
    await page.screenshot({ path: `test-results/complete-risk-review-${width}.png`, fullPage: true });
    await dialog.getByRole("button", { name: "Complete review", exact: true }).click();
    await expect(dialog).not.toBeVisible();
    const detail = page.getByRole("dialog");
    await expect(detail.getByRole("region", { name: "Current review" })).toHaveCount(0);
    await expect(detail.getByRole("region", { name: "Risk overview" }).getByText("27/01/2027", { exact: true })).toBeVisible();
    await detail.locator("summary").filter({ hasText: "Review history (1)" }).click();
    await expect(detail.getByText("Reviewed context and current controls.", { exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}
