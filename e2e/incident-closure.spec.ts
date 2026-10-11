import { expect, test } from "@playwright/test";
const id = "00000000-0000-4000-8000-000000000010";
const at = "2026-01-01T00:00:00Z";
for (const width of [375, 768, 1024, 1440]) {
  test(`closes incident and retains real record at ${width}px`, async ({
    page,
    context,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({
      colorScheme: width >= 1024 ? "dark" : "light",
      reducedMotion: "reduce",
    });
    await context.addCookies([
      {
        name: "securaai_access",
        value: "browser-fixture",
        domain: "127.0.0.1",
        path: "/",
      },
    ]);
    let closed = false;
    const summary =
      "Recovery verified; response outcomes and lessons learned recorded.";
    const incident = () => ({
      id,
      incidentCode: "INC-CLOSE-001",
      title: "Suspicious access",
      description: null,
      category: null,
      severity: "medium",
      status: closed ? "closed" : "lessons_learned",
      occurredAt: null,
      detectedAt: null,
      confirmedAt: null,
      closedAt: closed ? at : null,
      createdAt: at,
      updatedAt: at,
      classified: true,
      hasAnalysis: true,
      classificationCount: 0,
      lastClassification: null,
      currentAssignment: null,
      createdBy: null,
      relatedCounts: {
        actions: 3,
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
      route.fulfill({ json: { success: true, data: { users: [] } } }),
    );
    await page.route(`**/api/incidents/${id}/close`, (route) => {
      if (route.request().method() === "POST") {
        expect(route.request().postDataJSON()).toEqual({
          summary,
          confirmed: true,
          expectedUpdatedAt: at,
        });
        closed = true;
        return route.fulfill({
          json: { success: true, data: { changed: true, closedAt: at } },
        });
      }
      return route.fulfill({
        json: {
          success: true,
          data: {
            status: closed ? "closed" : "lessons_learned",
            expectedUpdatedAt: at,
            closedAt: closed ? at : null,
            canClose: !closed,
            restriction: closed ? "Already closed" : null,
            closure: closed
              ? {
                  id,
                  recordedAt: at,
                  closedBy: { id, name: "Handling officer" },
                  summary,
                }
              : null,
          },
        },
      });
    });
    await page.route(`**/api/incidents/${id}/analysis`, (route) =>
      route.fulfill({
        json: {
          success: true,
          data: {
            canEdit: false,
            editRestriction:
              "This incident is closed. Findings and history are read-only.",
            analysis: {
              id,
              rootCause: "Verified underlying cause preserved.",
              lessonsLearned: "Lessons preserved for audit.",
              improvementActions: "Recommendations preserved for follow-up.",
              analyzedAt: at,
              updatedAt: at,
              createdAt: at,
              analyzedBy: { id, name: "Handling officer" },
            },
          },
        },
      }),
    );
    await page.route(`**/api/incidents/${id}/analysis/history?*`, (route) =>
      route.fulfill({
        json: {
          success: true,
          data: {
            items: [],
            pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
          },
        },
      }),
    );
    await page.goto("/incidents");
    await page
      .getByRole("button", { name: "Actions for INC-CLOSE-001" })
      .scrollIntoViewIfNeeded();
    await page
      .getByRole("button", { name: "Actions for INC-CLOSE-001" })
      .click();
    await page
      .getByRole("button", { name: "Close incident", exact: true })
      .click();
    const dialog = page.getByRole("dialog", {
      name: "Close incident",
      exact: true,
    });
    await expect(dialog).toBeVisible();
    const bounds = await dialog.boundingBox();
    expect(bounds?.width).toBeLessThanOrEqual(width - 32);
    expect(bounds?.height).toBeLessThanOrEqual(868);
    await dialog.getByLabel("Closure summary", { exact: true }).fill(summary);
    await expect(
      dialog.getByRole("button", { name: "Close incident" }),
    ).toBeDisabled();
    await dialog.getByRole("checkbox").check();
    await dialog.getByRole("button", { name: "Close incident" }).click();
    const record = page.getByRole("dialog", {
      name: "Incident closure",
      exact: true,
    });
    await expect(record.getByText(summary)).toBeVisible();
    await expect(record.getByText("Handling officer")).toBeVisible();
    await expect(record.getByRole("checkbox")).toHaveCount(0);
    await record
      .getByRole("button", { name: "Close", exact: true })
      .press("Enter");
    await expect(record).not.toBeVisible();
    await page
      .getByRole("button", { name: "Actions for INC-CLOSE-001" })
      .click();
    await expect(
      page.getByRole("button", { name: "View closure record" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Close incident", exact: true }),
    ).toHaveCount(0);
    await page
      .getByRole("button", {
        name: "View root cause & lessons learned",
        exact: true,
      })
      .click();
    const findings = page.getByRole("dialog", {
      name: "Root cause analysis & lessons learned",
    });
    await expect(
      findings.getByLabel("Identified root cause", { exact: true }),
    ).toHaveValue("Verified underlying cause preserved.");
    await expect(
      findings.getByLabel("Identified root cause", { exact: true }),
    ).toHaveAttribute("readonly", "");
    await expect(
      findings.getByRole("button", { name: "Save findings" }),
    ).toHaveCount(0);
    await findings.getByRole("tab", { name: "History" }).click();
    await expect(
      findings.getByRole("tab", { name: "History" }),
    ).toHaveAttribute("aria-selected", "true");
  });
}
