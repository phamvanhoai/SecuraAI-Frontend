import { expect, test } from "@playwright/test";
const id = "00000000-0000-4000-8000-000000000010";
const at = "2026-10-07T00:00:00.000Z";
const service = {
  id,
  name: "Retired Support Service",
  description: "Previous support function",
  status: "active",
  owner: null,
  linkedAssetsCount: 2,
  createdAt: at,
  updatedAt: at,
};
test.beforeEach(async ({ context, page }) => {
  await context.addCookies([
    {
      name: "securaai_access",
      value: "deactivate-test",
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
            permissions: [
              "assets.read",
              "business-services.read",
              "business-services.update",
              "business-services.deactivate",
            ],
          },
        },
      },
    }),
  );
});
for (const width of [375, 768, 1024, 1440]) {
  test(`safe deactivation with historical links at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    let current = { ...service };
    let writes = 0;
    await page.route("**/api/business-services?*", (route) =>
      route.fulfill({
        json: {
          success: true,
          data: {
            items: [current],
            pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
          },
        },
      }),
    );
    await page.route(
      `**/api/business-services/${id}/deactivation-check`,
      (route) =>
        route.fulfill({
          json: {
            success: true,
            data: {
              service: current,
              activeAssetsCount: 0,
              unresolvedRisksCount: 0,
              canDeactivate: true,
            },
          },
        }),
    );
    await page.route(`**/api/business-services/${id}/deactivate`, (route) => {
      expect(route.request().postDataJSON()).toEqual({
        expectedUpdatedAt: at,
        confirmationName: service.name,
        reason: "Service replaced; historical records retained.",
      });
      writes++;
      current = {
        ...current,
        status: "inactive",
        updatedAt: "2026-10-07T01:00:00Z",
      };
      return route.fulfill({ json: { success: true, data: current } });
    });
    await page.goto("/assets/business-services");
    const trigger = page.getByRole("button", {
      name: `Actions for ${service.name}`,
    });
    await trigger.click();
    await page
      .getByRole("button", { name: `Deactivate ${service.name}` })
      .click();
    const dialog = page.getByRole("dialog", {
      name: "Deactivate Business Service",
    });
    await expect(
      dialog.getByRole("button", { name: "Deactivate service" }),
    ).toBeDisabled();
    await dialog
      .getByLabel("Reason for deactivation (required)")
      .fill("Service replaced; historical records retained.");
    await dialog
      .getByLabel("Enter service name to confirm")
      .fill("Wrong service");
    await expect(
      dialog.getByRole("button", { name: "Deactivate service" }),
    ).toBeDisabled();
    await dialog.getByLabel("Enter service name to confirm").fill(service.name);
    await dialog.getByRole("button", { name: "Deactivate service" }).click();
    await expect(dialog).toHaveCount(0);
    await expect(
      page.getByText("Business service deactivated", { exact: true }),
    ).toBeVisible();
    expect(writes).toBe(1);
    expect(current.linkedAssetsCount).toBe(2);
    await trigger.click();
    await expect(
      page.getByRole("button", { name: `Deactivate ${service.name}` }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: `Edit ${service.name}` }),
    ).toHaveCount(0);
    await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });
}
for (const counts of [
  { activeAssetsCount: 1, unresolvedRisksCount: 0 },
  { activeAssetsCount: 0, unresolvedRisksCount: 1 },
]) {
  test(`blocks existing usage ${JSON.stringify(counts)}`, async ({ page }) => {
    let writes = 0;
    await page.route("**/api/business-services?*", (route) =>
      route.fulfill({
        json: {
          success: true,
          data: {
            items: [service],
            pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
          },
        },
      }),
    );
    await page.route(
      `**/api/business-services/${id}/deactivation-check`,
      (route) =>
        route.fulfill({
          json: {
            success: true,
            data: { service, ...counts, canDeactivate: false },
          },
        }),
    );
    await page.route(`**/api/business-services/${id}/deactivate`, (route) => {
      writes++;
      return route.abort();
    });
    await page.goto("/assets/business-services");
    await page
      .getByRole("button", { name: `Actions for ${service.name}` })
      .click();
    await page
      .getByRole("button", { name: `Deactivate ${service.name}` })
      .click();
    const dialog = page.getByRole("dialog");
    await expect(
      dialog.getByText(/Open, Under treatment and Accepted/),
    ).toBeVisible();
    await expect(
      dialog.getByRole("button", { name: "Deactivate service" }),
    ).toHaveCount(0);
    await dialog.getByRole("button", { name: "Close" }).click();
    expect(writes).toBe(0);
  });
}
test("concurrent usage409 preserves draft; Escape requires discard", async ({
  page,
}) => {
  await page.route("**/api/business-services?*", (route) =>
    route.fulfill({
      json: {
        success: true,
        data: {
          items: [service],
          pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
        },
      },
    }),
  );
  await page.route(
    `**/api/business-services/${id}/deactivation-check`,
    (route) =>
      route.fulfill({
        json: {
          success: true,
          data: {
            service,
            activeAssetsCount: 0,
            unresolvedRisksCount: 0,
            canDeactivate: true,
          },
        },
      }),
  );
  await page.route(`**/api/business-services/${id}/deactivate`, (route) =>
    route.fulfill({
      status: 409,
      json: {
        success: false,
        error: { code: "BUSINESS_SERVICE_IN_USE", message: "Service now used" },
      },
    }),
  );
  await page.goto("/assets/business-services");
  await page
    .getByRole("button", { name: `Actions for ${service.name}` })
    .click();
  await page
    .getByRole("button", { name: `Deactivate ${service.name}` })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog
    .getByLabel("Reason for deactivation (required)")
    .fill("No longer used");
  await dialog.getByLabel("Enter service name to confirm").fill(service.name);
  await dialog.getByRole("button", { name: "Deactivate service" }).click();
  await expect(dialog.getByText(/This service is now in use/)).toBeVisible();
  await expect(
    dialog.getByRole("button", { name: "Deactivate service" }),
  ).toBeDisabled();
  await expect(
    dialog.getByLabel("Reason for deactivation (required)"),
  ).toHaveValue("No longer used");
  await page.keyboard.press("Escape");
  await expect(
    dialog.getByRole("button", { name: "Keep editing" }),
  ).toBeVisible();
  await dialog.getByRole("button", { name: "Discard changes" }).click();
  await expect(dialog).toHaveCount(0);
});
