import { expect, test } from "@playwright/test";
const id = "00000000-0000-4000-8000-000000000010";
for (const width of [375, 768, 1024, 1440]) {
  test(`saves RCA and refreshes history at ${width}px`, async ({
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
    let saved = false;
    const incident = () => ({
      id,
      incidentCode: "INC-TEST-001",
      title: "Suspicious access",
      description: null,
      category: null,
      severity: "medium",
      status: "lessons_learned",
      occurredAt: null,
      detectedAt: null,
      confirmedAt: null,
      closedAt: null,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
      classified: true,
      hasAnalysis: saved,
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
    const findings = {
      rootCause: "Verified authentication control gap.",
      lessonsLearned: "Review privileged access exceptions.",
      improvementActions: "Remove obsolete access and enforce MFA.",
    };
    const analysis = {
      ...findings,
      id,
      analyzedAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
      createdAt: "2026-01-01T00:00:00Z",
      analyzedBy: { id, name: "Investigating Officer" },
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
    await page.route(`**/api/incidents/${id}/analysis`, (route) => {
      if (route.request().method() === "PATCH") {
        expect(route.request().postDataJSON()).toEqual({
          ...findings,
          expectedUpdatedAt: saved ? analysis.updatedAt : null,
        });
        saved = true;
        return route.fulfill({ json: { success: true, data: analysis } });
      }
      return route.fulfill({
        json: {
          success: true,
          data: {
            analysis: saved ? analysis : null,
            canEdit: true,
            editRestriction: null,
          },
        },
      });
    });
    await page.route(`**/api/incidents/${id}/analysis/history?*`, (route) =>
      route.fulfill({
        json: {
          success: true,
          data: {
            items: saved
              ? [
                  {
                    id,
                    findings,
                    before: null,
                    savedAt: analysis.analyzedAt,
                    savedBy: analysis.analyzedBy,
                  },
                ]
              : [],
            pagination: {
              page: 1,
              limit: 10,
              total: saved ? 1 : 0,
              totalPages: saved ? 1 : 0,
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
    await page
      .getByRole("button", {
        name: "Root cause & lessons learned",
        exact: true,
      })
      .click();
    const dialog = page.getByRole("dialog", {
      name: "Root cause analysis & lessons learned",
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
      .getByLabel("Identified root cause", { exact: true })
      .fill(findings.rootCause);
    await dialog
      .getByLabel("Lessons learned", { exact: true })
      .fill(findings.lessonsLearned);
    await dialog
      .getByLabel("Recommended improvements", { exact: true })
      .fill(findings.improvementActions);
    await dialog.getByRole("tab", { name: "History" }).click();
    await expect(dialog.getByText(/No analysis history/)).toBeVisible();
    await dialog.getByRole("tab", { name: "History" }).press("ArrowLeft");
    await expect(
      dialog.getByLabel("Identified root cause", { exact: true }),
    ).toHaveValue(findings.rootCause);
    await dialog
      .getByRole("button", { name: "Save findings", exact: true })
      .click();
    await expect(dialog.getByRole("tab", { name: "History" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(
      dialog
        .getByRole("tabpanel")
        .getByText(findings.rootCause, { exact: true }),
    ).toBeVisible();
    await expect(
      dialog.getByRole("tabpanel").getByText(/Investigating Officer/),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await dialog.getByRole("button", { name: "Close", exact: true }).click();
    await actions.click();
    await page
      .getByRole("button", {
        name: "Root cause & lessons learned",
        exact: true,
      })
      .click();
    await expect(dialog.getByLabel("Identified root cause")).toHaveValue(
      findings.rootCause,
    );
    await dialog.getByRole("tab", { name: "History" }).click();
    await expect(
      dialog
        .getByRole("tabpanel")
        .getByText(findings.rootCause, { exact: true }),
    ).toBeVisible();
    await dialog.getByRole("button", { name: "Close", exact: true }).click();
    for (const hasAnalysis of [false, true]) {
      await page.route("**/api/incidents?*", (route) =>
        route.fulfill({
          json: {
            success: true,
            data: {
              items: [
                {
                  ...incident(),
                  title: `Reopened incident ${hasAnalysis}`,
                  status: "open",
                  hasAnalysis,
                },
              ],
              pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
            },
          },
        }),
      );
      await page.reload();
      await expect(
        page.getByText(`Reopened incident ${hasAnalysis}`, { exact: true }),
      ).toBeVisible();
      await actions.click();
      const viewAnalysis = page.getByRole("button", {
        name: "View root cause & lessons learned",
        exact: true,
      });
      if (hasAnalysis) {
        await expect(async () => {
          if (!(await viewAnalysis.isVisible())) await actions.press("Enter");
          await expect(viewAnalysis).toBeVisible();
        }).toPass();
      } else await expect(viewAnalysis).toHaveCount(0);
      await expect(
        page.getByRole("button", {
          name: "Root cause & lessons learned",
          exact: true,
        }),
      ).toHaveCount(0);
    }
    await page.route("**/api/incidents?*", (route) =>
      route.fulfill({
        json: {
          success: true,
          data: {
            items: [
              { ...incident(), title: "Closed incident", status: "closed" },
            ],
            pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
          },
        },
      }),
    );
    await page.route(`**/api/incidents/${id}/severity?*`, (route) =>
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
    await page.reload();
    await expect(
      page.getByText("Closed incident", { exact: true }),
    ).toBeVisible();
    await actions.click();
    const severityHistory = page.getByRole("button", {
      name: "View severity history",
      exact: true,
    });
    await expect(async () => {
      if (!(await severityHistory.isVisible())) await actions.press("Enter");
      await expect(severityHistory).toBeVisible();
    }).toPass();
    await expect(
      page.getByRole("button", { name: /Update progress/ }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: /Close incident/ }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: /Evidence and logs/ }),
    ).toHaveCount(0);
    await severityHistory.click();
    await expect(
      page.getByRole("tab", { name: "History", exact: true }),
    ).toHaveAttribute("aria-selected", "true");
    await expect(
      page.getByRole("tab", { name: "Classification", exact: true }),
    ).toBeDisabled();
  });
}
