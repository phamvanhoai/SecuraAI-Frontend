import { expect, test } from "@playwright/test";
const id = "00000000-0000-4000-8000-000000000010";
for (const width of [375, 768, 1024, 1440]) {
  test(`records containment and refreshes history at ${width}px`, async ({
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
    let saved = false;
    const incident = () => ({
      id,
      incidentCode: "INC-TEST-001",
      title: "Suspicious access",
      description: null,
      category: null,
      severity: "medium",
      status: "open",
      occurredAt: null,
      detectedAt: null,
      confirmedAt: null,
      closedAt: null,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
      classified: true,
      classificationCount: 0,
      lastClassification: null,
      currentAssignment: null,
      createdBy: null,
      relatedCounts: {
        actions: saved ? 1 : 0,
        assets: 0,
        controls: 0,
        evidence: 0,
        risks: 0,
      },
    });
    const action = {
      id,
      phase: "containment",
      description: "Isolated affected host from the corporate network.",
      performedAt: "2026-01-01T00:00:00Z",
      recordedAt: "2026-01-01T00:00:00Z",
      performedBy: { id, name: "Responding Officer" },
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
              permissions: ["incidents.read"],
            },
          },
        },
      }),
    );
    await page.route("**/api/incidents?*", (route) =>
      route.fulfill({
        json: {
          success: true,
          data: {
            items: [incident()],
            pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
          },
        },
      }),
    );
    await page.route("**/api/incidents/assignment-options", (route) =>
      route.fulfill({ json: { success: true, data: { users: [] } } }),
    );
    await page.route(
      `**/api/incidents/${id}/containment-actions**`,
      (route) => {
        if (route.request().method() === "POST") {
          expect(route.request().postDataJSON()).toEqual({
            description: action.description,
            performedAt: new Date("2026-01-01T09:30").toISOString(),
          });
          saved = true;
          return route.fulfill({
            status: 201,
            json: { success: true, data: action },
          });
        }
        return route.fulfill({
          json: {
            success: true,
            data: {
              items: saved ? [action] : [],
              pagination: {
                page: 1,
                limit: 10,
                total: saved ? 1 : 0,
                totalPages: saved ? 1 : 0,
              },
            },
          },
        });
      },
    );
    await page.goto("/incidents");
    const actions = page.getByRole("button", {
      name: "Actions for INC-TEST-001",
    });
    await actions.scrollIntoViewIfNeeded();
    await actions.click();
    await page
      .getByRole("button", { name: "Record containment action", exact: true })
      .click();
    const dialog = page.getByRole("dialog", {
      name: "Record containment action",
    });
    await expect(dialog).toBeVisible();
    const bounds = await dialog.boundingBox();
    expect(bounds).not.toBeNull();
    const availableWidth = await page.evaluate(
      () => document.documentElement.clientWidth,
    );
    expect(bounds?.width).toBeCloseTo(Math.min(736, availableWidth - 32), 0);
    expect(bounds?.height).toBeLessThanOrEqual(868);
    const tabBounds = await dialog.getByRole("tablist").boundingBox();
    expect(tabBounds).not.toBeNull();
    expect(tabBounds?.width).toBeLessThan(250);
    expect(tabBounds?.height).toBeLessThanOrEqual(54);
    await dialog
      .getByLabel("Containment action", { exact: true })
      .fill(action.description);
    await dialog
      .getByLabel("Performed at", { exact: true })
      .fill("2026-01-01T09:30");
    await dialog.getByRole("tab", { name: "History" }).click();
    await expect(dialog.getByText(/No containment actions/)).toBeVisible();
    await dialog.getByRole("tab", { name: "History" }).press("ArrowLeft");
    await expect(
      dialog.getByLabel("Containment action", { exact: true }),
    ).toHaveValue(action.description);
    await dialog
      .getByRole("button", { name: "Record action", exact: true })
      .click();
    await expect(dialog.getByRole("tab", { name: "History" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(
      dialog.getByText(action.description, { exact: true }),
    ).toBeVisible();
    await expect(dialog.getByText(/Responding Officer/)).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await dialog.getByRole("button", { name: "Close", exact: true }).click();
    await actions.click();
    await page
      .getByRole("button", { name: "Record containment action", exact: true })
      .click();
    await dialog.getByRole("tab", { name: "History" }).click();
    await expect(
      dialog.getByText(action.description, { exact: true }),
    ).toBeVisible();
  });
}
