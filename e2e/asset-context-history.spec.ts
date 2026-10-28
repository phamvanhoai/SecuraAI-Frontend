import { expect, test } from "@playwright/test";

const id = "00000000-0000-4000-8000-000000000010";
const serviceId = "00000000-0000-4000-8000-000000000020";
const userId = "00000000-0000-4000-8000-000000000001";
const asset = {
  id,
  assetCode: "TEST-CONTEXT",
  name: "Context demo asset",
  assetType: "SERVER",
  criticality: null,
  dataClassification: null,
  description: null,
  status: "active",
  owner: null,
  businessService: null,
  createdAt: "2026-10-01T00:00:00Z",
  updatedAt: "2026-10-01T00:00:00Z",
};
for (const width of [375, 768, 1440]) {
  test(`context tabs preserve edits and refresh real API history at ${width}px`, async ({
    page,
    context,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await context.addCookies([
      {
        name: "securaai_access",
        value: "context-browser-test",
        domain: "127.0.0.1",
        path: "/",
      },
    ]);
    let saved = false;
    await page.route("**/api/auth/session", (route) =>
      route.fulfill({
        json: {
          success: true,
          data: {
            user: {
              id: userId,
              email: "officer@example.test",
              fullName: "Security Officer",
              status: "active",
              mustChangePassword: false,
              roles: [{ code: "SECURITY_OFFICER", name: "Security Officer" }],
              permissions: ["assets.read", "assets.update"],
            },
          },
        },
      }),
    );
    await page.route("**/api/assets?*", (route) =>
      route.fulfill({
        json: {
          success: true,
          data: {
            items: [asset],
            pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
          },
        },
      }),
    );
    await page.route("**/api/assets/create-options", (route) =>
      route.fulfill({
        json: {
          success: true,
          data: {
            owners: [],
            assets: [],
            eventSources: [],
            businessServices: [{ id: serviceId, name: "Payment service" }],
          },
        },
      }),
    );
    await page.route(`**/api/assets/${id}`, (route) =>
      route.fulfill({
        json: {
          success: true,
          data: {
            ...asset,
            businessService: saved
              ? { id: serviceId, name: "Payment service", inactive: false }
              : null,
            archivedAt: null,
            createdBy: null,
            dependencies: [],
            eventSources: [],
            controls: [],
            risks: [],
            incidents: [],
          },
        },
      }),
    );
    await page.route(`**/api/assets/${id}/context/history?*`, (route) =>
      route.fulfill({
        json: {
          success: true,
          data: {
            items: saved
              ? [
                  {
                    id: serviceId,
                    occurredAt: "2026-10-26T12:00:00Z",
                    actor: { id: userId, fullName: "Demo officer" },
                    before: {
                      businessService: null,
                      dependencies: [],
                      eventSources: [],
                    },
                    after: {
                      businessService: {
                        id: serviceId,
                        name: "Payment service",
                      },
                      dependencies: [],
                      eventSources: [],
                    },
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
    await page.route(`**/api/assets/${id}/context`, async (route) => {
      expect(route.request().postDataJSON()).toEqual({
        businessServiceId: serviceId,
        dependencyIds: [],
        eventSourceIds: [],
      });
      saved = true;
      await route.fulfill({
        json: {
          success: true,
          data: {
            assetId: id,
            businessServiceId: serviceId,
            dependencyIds: [],
            eventSourceIds: [],
            linkedAt: "2026-10-26T12:00:00Z",
          },
        },
      });
    });
    await page.goto("/assets");
    const open = async () => {
      const trigger = page.getByRole("button", { name: "Actions for TEST-CONTEXT" });
      await trigger.scrollIntoViewIfNeeded();
      await trigger.focus();
      await trigger.press("Enter");
      await page
        .getByRole("button", { name: "Manage links", exact: true })
        .click();
    };
    await open();
    const dialog = page.getByRole("dialog", { name: "Link Asset Context" });
    await dialog
      .getByLabel("Business service", { exact: true })
      .selectOption(serviceId);
    await dialog.getByRole("tab", { name: "Link Asset Context" }).focus();
    await page.keyboard.press("ArrowRight");
    await expect(
      dialog.getByText("No context history recorded."),
    ).toBeVisible();
    await page.keyboard.press("Home");
    await expect(
      dialog.getByLabel("Business service", { exact: true }),
    ).toHaveValue(serviceId);
    await dialog.getByRole("button", { name: "Save links" }).click();
    await expect(dialog).not.toBeVisible();
    await open();
    await dialog.getByRole("tab", { name: "History (1)" }).click();
    await dialog.getByText("View changes").click();
    await expect(
      dialog
        .getByRole("region", { name: "Previous context" })
        .getByText("Unassigned"),
    ).toBeVisible();
    await expect(
      dialog
        .getByRole("region", { name: "New context" })
        .getByText("Payment service"),
    ).toBeVisible();
    expect((await dialog.boundingBox())?.width).toBeLessThanOrEqual(width);
    await page.screenshot({
      path: `test-results/asset-context-history-${width}.png`,
      fullPage: true,
    });
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
  });
}
