import { expect, test } from "@playwright/test";
const id = "00000000-0000-4000-8000-000000000010";
for (const width of [375, 768, 1024, 1440]) {
  test(`requires justified phase transitions and verifies recovery at ${width}px`, async ({
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
    let phase = "triage";
    let updatedAt = "2026-01-01T00:00:00.000Z";
    let actions = 0;
    let transitions = 0;
    const history: unknown[] = [];
    const incident = () => ({
      id,
      incidentCode: "INC-PHASE-001",
      title: "Incident phase test",
      description: null,
      category: null,
      severity: "medium",
      status: phase,
      occurredAt: null,
      detectedAt: null,
      confirmedAt: null,
      closedAt: null,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt,
      classified: true,
      classificationCount: 0,
      lastClassification: null,
      currentAssignment: null,
      createdBy: null,
      relatedCounts: { actions, assets: 0, controls: 0, evidence: 0, risks: 0 },
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
    await page.route(`**/api/incidents/${id}/progress**`, async (route) => {
      if (route.request().method() === "GET")
        return route.fulfill({
          json: {
            success: true,
            data: {
              items: history,
              pagination: {
                page: 1,
                limit: 10,
                total: history.length,
                totalPages: history.length ? 1 : 0,
              },
            },
          },
        });
      const input = route.request().postDataJSON();
      expect(input.confirmed).toBe(true);
      expect(input.expectedStatus).toBe(phase);
      expect(input.expectedUpdatedAt).toBe(updatedAt);
      if (phase === "triage") {
        expect(input.status).toBe("recovery");
        expect(input.skipReason).toContain("Urgent service restoration");
      } else {
        expect(phase).toBe("recovery");
        expect(input.status).toBe("lessons_learned");
        expect(actions).toBe(1);
      }
      transitions++;
      const before = phase;
      phase = input.status;
      updatedAt = `2026-01-01T00:00:0${transitions}.000Z`;
      history.unshift({
        id,
        occurredAt: updatedAt,
        actor: { id, name: "Officer" },
        before: { status: before.toUpperCase() },
        after: {
          status: phase.toUpperCase(),
          note: input.note,
          skipReason: input.skipReason ?? null,
          skippedPhases:
            before === "triage" ? ["CONTAINMENT", "ERADICATION"] : [],
          currentPhaseCompleted: !input.skipReason,
          recoveryVerified: phase === "lessons_learned",
        },
      });
      return route.fulfill({ json: { success: true, data: incident() } });
    });
    const action = {
      id,
      phase: "recovery",
      description:
        "Restored service and verified normal operation with monitoring.",
      performedAt: "2026-01-01T00:00:00Z",
      recordedAt: "2026-01-01T00:00:00Z",
      performedBy: { id, name: "Officer" },
    };
    await page.route(`**/api/incidents/${id}/recovery-actions**`, (route) => {
      if (route.request().method() === "POST") {
        expect(route.request().postDataJSON()).not.toHaveProperty(
          "recoveryCompleted",
        );
        actions++;
        return route.fulfill({
          status: 201,
          json: { success: true, data: action },
        });
      }
      return route.fulfill({
        json: {
          success: true,
          data: {
            items: actions ? [action] : [],
            pagination: {
              page: 1,
              limit: 10,
              total: actions,
              totalPages: actions ? 1 : 0,
            },
          },
        },
      });
    });
    await page.goto("/incidents");
    const menu = page.getByRole("button", {
      name: "Actions for INC-PHASE-001",
    });
    const openMenu = async (label: string) => {
      const entry = page.getByRole("button", { name: label, exact: true });
      await menu.scrollIntoViewIfNeeded();
      await expect(async () => {
        if (!(await entry.isVisible())) await menu.click();
        await expect(entry).toBeVisible();
      }).toPass();
      await entry.click();
    };
    await openMenu("View recovery history");
    const recovery = page.getByRole("dialog", {
      name: "Record recovery action",
    });
    await expect(
      recovery.getByRole("tab", { name: "Record action" }),
    ).toBeDisabled();
    await recovery.getByRole("button", { name: "Close", exact: true }).click();
    await openMenu("Update handling phase");
    const progress = page.getByRole("dialog", {
      name: "Incident handling phase",
    });
    await progress.getByLabel("Next handling phase").selectOption("recovery");
    await progress
      .getByLabel("Transition assessment and results")
      .fill(
        "Critical service restoration required immediately; earlier work deferred.",
      );
    await progress.getByRole("button", { name: "Save progress" }).click();
    await expect(
      progress.getByText("Confirm the phase transition."),
    ).toBeVisible();
    await progress.getByRole("checkbox").check();
    await progress.getByRole("button", { name: "Save progress" }).click();
    await expect(
      progress.getByText(/Explain why phases must be skipped/),
    ).toBeVisible();
    expect(transitions).toBe(0);
    await progress
      .getByLabel("Emergency skip reason (optional)")
      .fill(
        "Urgent service restoration; containment and eradication tasks will be documented retrospectively.",
      );
    await progress.getByRole("button", { name: "Save progress" }).click();
    await expect(progress).not.toBeVisible();
    await openMenu("Record recovery action");
    await recovery
      .getByLabel("Recovery action", { exact: true })
      .fill(action.description);
    await recovery.getByLabel("Performed at").fill("2026-01-01T09:30");
    await recovery
      .getByRole("button", { name: "Record action", exact: true })
      .click();
    await expect(
      recovery.getByText(action.description, { exact: true }),
    ).toBeVisible();
    expect(phase).toBe("recovery");
    await recovery.getByRole("button", { name: "Close", exact: true }).click();
    await openMenu("Update handling phase");
    await progress
      .getByLabel("Next handling phase")
      .selectOption("lessons_learned");
    await progress
      .getByLabel("Transition assessment and results")
      .fill(
        "Systems restored; validation and monitoring show normal operation.",
      );
    await progress.getByRole("checkbox").check();
    await progress.getByRole("button", { name: "Save progress" }).click();
    await expect(progress).not.toBeVisible();
    await openMenu("View phase history");
    await progress
      .getByText("Phase transition history", { exact: true })
      .click();
    await expect(
      progress.getByText(/Skipped phases: containment, eradication/),
    ).toBeVisible();
    await expect(
      progress.getByText("recovery → lessons learned", { exact: true }),
    ).toBeVisible();
    await expect(
      progress.getByRole("button", { name: "Save progress" }),
    ).toHaveCount(0);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });
}
