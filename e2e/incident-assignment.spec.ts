import { expect, test } from "@playwright/test";

const id = "00000000-0000-4000-8000-000000000010";
for (const width of [375, 768, 1440]) {
  test(`assign handler refreshes list without reload at ${width}px`, async ({
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
    let assigned = false;
    let closed = false;
    const handler = {
      id,
      name: "Investigation Officer",
      email: "handler@example.test",
    };
    const previousHandler = {
      id: "00000000-0000-4000-8000-000000000012",
      name: "Previous Officer",
      email: "previous@example.test",
    };
    const incident = () => ({
      id,
      incidentCode: "INC-TEST-001",
      title: "Suspicious access",
      description: "Production service access",
      category: null,
      severity: "medium",
      status: closed ? "closed" : "open",
      occurredAt: null,
      detectedAt: null,
      confirmedAt: null,
      closedAt: null,
      createdAt: "2026-10-09T00:00:00Z",
      updatedAt: "2026-10-09T00:00:00Z",
      classified: true,
      classificationCount: 0,
      lastClassification: null,
      currentAssignment: assigned
        ? { assignee: handler, assignedAt: "2026-10-09T01:00:00Z" }
        : { assignee: previousHandler, assignedAt: "2026-10-09T00:00:00Z" },
      createdBy: null,
      relatedCounts: {
        actions: 0,
        assets: 0,
        controls: 0,
        evidence: 0,
        risks: 0,
      },
    });
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
      route.fulfill({
        json: { success: true, data: { users: [previousHandler, handler] } },
      }),
    );
    await page.route(`**/api/incidents/${id}/assignee`, (route) => {
      if (route.request().method() === "GET")
        return route.fulfill({
          json: {
            success: true,
            data: {
              items: [],
              pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
            },
          },
        });
      expect(route.request().postDataJSON()).toEqual({
        assigneeUserId: id,
        note: "Investigate the production access.",
        expectedUpdatedAt: "2026-10-09T00:00:00Z",
      });
      assigned = true;
      return route.fulfill({ json: { success: true, data: incident() } });
    });
    await page.route(`**/api/incidents/${id}/assignee?*`, (route) =>
      route.fulfill({
        json: {
          success: true,
          data: {
            items: [
              ...(assigned
                ? [
                    {
                      id: "00000000-0000-4000-8000-000000000011",
                      assignedAt: "2026-10-09T01:00:00Z",
                      assignedBy: { id, name: "Assigning Officer" },
                      previousHandler,
                      handler,
                      note: "Investigate the production access.",
                    },
                  ]
                : []),
              {
                id,
                assignedAt: "2026-10-09T00:00:00Z",
                assignedBy: { id, name: "Assigning Officer" },
                previousHandler: null,
                handler: previousHandler,
                note: "Assigned for investigation.",
              },
            ],
            pagination: {
              page: 1,
              limit: 10,
              total: assigned ? 2 : 1,
              totalPages: 1,
            },
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
    await expect(
      page.getByRole("button", { name: "Assignment history", exact: true }),
    ).toHaveCount(0);
    await page
      .getByRole("button", { name: "Reassign handler", exact: true })
      .click();
    const dialog = page.getByRole("dialog", {
      name: "Assign incident handler",
    });
    await dialog.getByRole("option", { name: /Investigation Officer/ }).click();
    await dialog
      .getByLabel("Assignment note", { exact: true })
      .fill("Investigate the production access.");
    await dialog.getByRole("tab", { name: "History", exact: true }).click();
    await expect(
      dialog.getByText("Unassigned → Previous Officer"),
    ).toBeVisible();
    await expect(dialog.getByText("Assigned for investigation.")).toBeVisible();
    await dialog
      .getByRole("tab", { name: "History", exact: true })
      .press("ArrowLeft");
    await expect(
      dialog.getByRole("tab", { name: "Assignment", exact: true }),
    ).toBeFocused();
    await expect(
      dialog.getByLabel("Assignment note", { exact: true }),
    ).toHaveValue("Investigate the production access.");
    await expect(
      dialog.getByRole("option", { name: /Investigation Officer/ }),
    ).toHaveAttribute("aria-selected", "true");
    await dialog
      .getByRole("button", { name: "Assign handler", exact: true })
      .click();
    await expect(dialog).not.toBeVisible();
    await expect(
      page.getByRole("cell", { name: "Investigation Officer", exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await actions.click();
    await page
      .getByRole("button", { name: "Reassign handler", exact: true })
      .click();
    await dialog.getByRole("tab", { name: "History", exact: true }).click();
    await expect(
      dialog.getByText("Investigate the production access."),
    ).toBeVisible();
    await expect(
      dialog.getByText("Previous Officer → Investigation Officer"),
    ).toBeVisible();
    await expect(dialog.getByText("Assigned for investigation.")).toBeVisible();
    await dialog.getByRole("button", { name: "Close", exact: true }).click();
    closed = true;
    await page.reload();
    await actions.scrollIntoViewIfNeeded();
    await actions.click();
    await page
      .getByRole("button", { name: "View handler assignment", exact: true })
      .click();
    await expect(
      dialog.getByRole("tab", { name: "History", exact: true }),
    ).toHaveAttribute("aria-selected", "true");
    await expect(
      dialog.getByRole("tab", { name: "Assignment", exact: true }),
    ).toBeDisabled();
    await expect(dialog.getByText("Assigned for investigation.")).toBeVisible();
    await dialog.getByRole("button", { name: "Close", exact: true }).click();
  });
}
