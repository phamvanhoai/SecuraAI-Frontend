import { expect, test } from "@playwright/test";

const id = "00000000-0000-4000-8000-000000000010";
const at = "2026-11-26T00:00:00Z";
const incident = {
  id,
  incidentCode: "INC-001",
  title: "Ransomware PC-KT-01",
  description: "Accounting files were encrypted and require investigation.",
  category: null,
  severity: "high",
  status: "open",
  occurredAt: at,
  detectedAt: at,
  confirmedAt: at,
  closedAt: null,
  createdAt: at,
  updatedAt: at,
  classified: true,
  hasAnalysis: false,
  classificationCount: 0,
  lastClassification: null,
  currentAssignment: null,
  createdBy: null,
  source: null,
  relatedCounts: { actions: 0, assets: 0, controls: 0, evidence: 0, risks: 0 },
};
for (const width of [390, 768, 1440]) {
  test(`automatic review preserves form and supports separate creation at ${width}px`, async ({
    page,
    context,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    await context.addCookies([
      {
        name: "securaai_access",
        value: "test-session",
        domain: "127.0.0.1",
        path: "/",
      },
    ]);
    await page.route("**/api/auth/session", (route) =>
      route.fulfill({
        json: {
          success: true,
          data: {
            user: {
              id,
              email: "officer@example.test",
              fullName: "Security Officer",
              status: "active",
              mustChangePassword: false,
              roles: [{ code: "SECURITY_OFFICER", name: "Security Officer" }],
              permissions: ["incidents.read", "incidents.create"],
            },
          },
        },
      }),
    );
    await page.route("**/api/incidents/source-options?*", (route) =>
      route.fulfill({
        json: {
          success: true,
          data: {
            items: [],
            pagination: { page: 1, limit: 100, total: 0, totalPages: 0 },
          },
        },
      }),
    );
    await page.route("**/api/incidents/assignment-options", (route) =>
      route.fulfill({ json: { success: true, data: { users: [] } } }),
    );
    await page.route(`**/api/incidents/${id}`, (route) =>
      route.fulfill({
        json: {
          success: true,
          data: {
            ...incident,
            affectedAssets: [],
            responseActions: [],
            handlingHistory: [],
          },
        },
      }),
    );
    let posts = 0;
    let created = false;
    await page.route(/\/api\/incidents(?:\?.*)?$/, async (route) => {
      if (route.request().method() !== "POST") {
        await route.fulfill({
          json: {
            success: true,
            data: {
              items: created ? [{ ...incident, incidentCode: "INC-002" }] : [],
              pagination: {
                page: 1,
                limit: 10,
                total: created ? 1 : 0,
                totalPages: 1,
              },
            },
          },
        });
        return;
      }
      posts++;
      const body = route.request().postDataJSON();
      expect(body.title).toBe(incident.title);
      if (!body.separateReason) {
        await route.fulfill({
          status: 409,
          json: {
            success: false,
            error: {
              code: "INCIDENT_RELATED_REVIEW_REQUIRED",
              message: "Review potentially related incidents.",
              details: {
                items: [
                  {
                    id,
                    incidentCode: "INC-001",
                    title: incident.title,
                    status: "open",
                    detectedAt: at,
                    reason:
                      "Shared title terms: ransomware, pc-kt-01; detection times within 7 days.",
                  },
                ],
              },
            },
          },
        });
      } else {
        expect(body.reviewedIncidentIds).toEqual([id]);
        expect(body.separateReason).toBe("Different attack campaign.");
        created = true;
        await route.fulfill({
          status: 201,
          json: {
            success: true,
            data: { ...incident, incidentCode: "INC-002" },
          },
        });
      }
    });
    await page.goto("/incidents");
    await page
      .getByRole("button", { name: "Create incident", exact: true })
      .click();
    const form = page.getByRole("dialog", {
      name: "Create incident",
      exact: true,
    });
    await form.getByRole("tab", { name: "Manual", exact: true }).click();
    await form
      .getByLabel("Incident title", { exact: true })
      .fill(incident.title);
    await form
      .getByLabel("Description", { exact: true })
      .fill(incident.description);
    await form
      .getByRole("button", { name: "Create incident", exact: true })
      .click();
    await expect(
      form.getByText("Potentially related incidents found"),
    ).toBeVisible();
    await form.getByRole("button", { name: "View existing incident" }).click();
    const detail = page.getByRole("dialog", {
      name: "Incident details",
      exact: true,
    });
    await expect(detail).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(detail).not.toBeVisible();
    await form.getByRole("button", { name: "Back to form" }).click();
    await expect(
      form.getByLabel("Incident title", { exact: true }),
    ).toHaveValue(incident.title);
    await form
      .getByRole("button", { name: "Create incident", exact: true })
      .click();
    await expect(
      form.getByRole("button", { name: "Create separately" }),
    ).toBeDisabled();
    await form
      .getByLabel("Why is this a separate incident?")
      .fill("Different attack campaign.");
    await form.getByRole("button", { name: "Create separately" }).click();
    await expect(form).not.toBeVisible();
    await expect(
      page.getByText("INC-002", { exact: true }).first(),
    ).toBeVisible();
    expect(posts).toBe(3);
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth,
      ),
    ).toBe(true);
  });
}
