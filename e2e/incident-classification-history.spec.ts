import { expect, test } from "@playwright/test";

const id = "00000000-0000-4000-8000-000000000010";
for (const width of [375, 768, 1440]) {
  test(`classification history tabs preserve draft at ${width}px`, async ({
    page,
    context,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await context.addCookies([
      {
        name: "securaai_access",
        value: "browser-fixture",
        domain: "127.0.0.1",
        path: "/",
      },
    ]);
    const pagination = { page: 1, limit: 10, total: 1, totalPages: 1 };
    const incident = {
      id,
      incidentCode: "INC-TEST-001",
      title: "Suspicious access",
      description: "Unexpected access to production service",
      category: null,
      severity: "medium",
      status: "reported",
      occurredAt: null,
      detectedAt: null,
      confirmedAt: null,
      closedAt: null,
      createdAt: "2026-10-09T00:00:00Z",
      updatedAt: "2026-10-09T00:00:00Z",
      classified: true,
      classificationCount: 0,
      lastClassification: null,
      currentAssignment: null,
      createdBy: null,
      relatedCounts: {
        actions: 0,
        assets: 0,
        controls: 0,
        evidence: 0,
        risks: 0,
      },
    };
    await page.route("**/api/auth/session", (route) =>
      route.fulfill({
        json: {
          success: true,
          data: {
            user: {
              id,
              email: "officer@example.test",
              fullName: "Officer",
              status: "active",
              mustChangePassword: false,
              roles: [{ code: "SECURITY_OFFICER", name: "Security Officer" }],
              permissions: ["incidents.read", "incidents.classify"],
            },
          },
        },
      }),
    );
    await page.route("**/api/incidents?*", (route) =>
      route.fulfill({
        json: { success: true, data: { items: [incident], pagination } },
      }),
    );
    await page.route(`**/api/incidents/${id}/severity?*`, (route) =>
      route.fulfill({
        json: {
          success: true,
          data: {
            items: [
              {
                id,
                classifiedAt: "2026-10-09T00:00:00Z",
                classifiedBy: { id, name: "Officer" },
                previousSeverity: "low",
                severity: "medium",
                rationale: "Impact to business service.",
              },
            ],
            pagination,
          },
        },
      }),
    );
    await page.goto("/incidents");
    const actions = page.getByRole("button", {
      name: "Actions for INC-TEST-001",
    });
    await actions.scrollIntoViewIfNeeded();
    await actions.click();
    await expect(page.getByRole("button", { name: "Classification history", exact: true })).toHaveCount(0);
    await page
      .getByRole("button", { name: "Classify severity", exact: true })
      .click();
    const dialog = page.getByRole("dialog", {
      name: "Classify incident severity",
    });
    await dialog
      .getByLabel("Classification rationale", { exact: true })
      .fill("Unsaved business impact rationale.");
    await dialog.getByRole("tab", { name: "History", exact: true }).click();
    await expect(dialog.getByText("low → medium")).toBeVisible();
    await expect(dialog.getByText("Impact to business service.")).toBeVisible();
    await dialog
      .getByRole("tab", { name: "History", exact: true })
      .press("ArrowLeft");
    await expect(
      dialog.getByRole("tab", { name: "Classification", exact: true }),
    ).toBeFocused();
    await expect(
      dialog.getByLabel("Classification rationale", { exact: true }),
    ).toHaveValue("Unsaved business impact rationale.");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(dialog).not.toBeVisible();
  });
}
