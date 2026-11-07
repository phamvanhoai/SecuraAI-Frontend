import { expect, test } from "@playwright/test";

const id = "00000000-0000-4000-8000-000000000010";
const at = "2026-10-22T00:00:00Z";
const incident = {
  id,
  incidentCode: "INC-READ-001",
  title: "Suspicious activity",
  description: "Retained incident details for investigation.",
  category: null,
  severity: "medium",
  status: "open",
  occurredAt: null,
  detectedAt: at,
  confirmedAt: null,
  closedAt: null,
  createdAt: at,
  updatedAt: at,
  classified: true,
  hasAnalysis: false,
  classificationCount: 0,
  lastClassification: null,
  currentAssignment: null,
  createdBy: null,
  relatedCounts: { actions: 0, assets: 0, controls: 0, evidence: 0, risks: 0 },
};

for (const width of [375, 1440]) {
  for (const role of ["SECURITY_OFFICER", "EXECUTIVE", "ADMIN", "EMPLOYEE"]) {
    test(`${role} incident creation access at ${width}px`, async ({
      page,
      context,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({
        colorScheme: width === 375 ? "light" : "dark",
        reducedMotion: "reduce",
      });
      const cookie = {
        name: "securaai_access",
        value: "incident-access-fixture",
        domain: "127.0.0.1",
        path: "/",
      };
      await context.addCookies([cookie]);
      await page.route("**/api/auth/session", (route) =>
        route.fulfill({
          json: {
            success: true,
            data: {
              user: {
                id,
                email: "actor@example.test",
                fullName: "Actor",
                status: "active",
                mustChangePassword: false,
                roles: [{ code: role, name: role }],
                permissions:
                  role === "SECURITY_OFFICER"
                    ? ["incidents.read", "incidents.report"]
                    : ["incidents.read"],
              },
            },
          },
        }),
      );
      let empty = false;
      const list = () => ({
        success: true,
        data: {
          items: empty ? [] : [incident],
          pagination: {
            page: 1,
            limit: 10,
            total: empty ? 0 : 1,
            totalPages: 1,
          },
        },
      });
      await page.route("**/api/incidents?*", (route) =>
        route.fulfill({ json: list() }),
      );
      await page.route("**/api/incidents/mine?*", (route) =>
        route.fulfill({ json: list() }),
      );
      await page.route("**/api/incidents/source-options?*", (route) =>
        route.fulfill({
          json: {
            success: true,
            data: {
              items: [],
              pagination: { page: 1, limit: 20, total: 0, totalPages: 1 },
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
      await page.goto("/incidents");
      await expect(
        page.getByText("INC-READ-001", { exact: true }),
      ).toBeVisible();
      if (role === "SECURITY_OFFICER") {
        await page
          .getByRole("button", { name: "Create incident", exact: true })
          .click();
        const dialog = page.getByRole("dialog", {
          name: "Create incident",
          exact: true,
        });
        await dialog.getByRole("tab", { name: "Manual", exact: true }).click();
        await expect(dialog.getByLabel("Incident title")).toBeVisible();
        await dialog
          .getByRole("button", { name: "Cancel", exact: true })
          .click();
      } else {
        await expect(
          page.getByRole("button", { name: "Create incident", exact: true }),
        ).toHaveCount(0);
        await page
          .getByRole("button", { name: "View details", exact: true })
          .click();
        await expect(
          page
            .getByRole("dialog", { name: "Incident details" })
            .getByText(incident.description),
        ).toBeVisible();
      }
      empty = true;
      await context.addCookies([cookie]);
      await page.reload();
      await expect(
        page.getByRole("heading", { name: /No incidents (found|reported)/ }),
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Create incident", exact: true }),
      ).toHaveCount(role === "SECURITY_OFFICER" ? 1 : 0);
    });
  }
}
