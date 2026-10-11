import { expect, test } from "@playwright/test";
const id = "00000000-0000-4000-8000-000000000010";
const service = {
  id,
  name: "Customer Support Demo Service",
  description: "Supports customer requests",
  status: "active",
  owner: null,
  linkedAssetsCount: 0,
  createdAt: "2026-10-07T00:00:00Z",
  updatedAt: "2026-10-07T00:00:00Z",
};
test.beforeEach(async ({ page, context }) => {
  await context.addCookies([
    {
      name: "securaai_access",
      value: "service-create-test",
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
              "business-services.create",
            ],
          },
        },
      },
    }),
  );
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
  await page.route("**/api/business-services/owner-options*", (route) =>
    route.fulfill({
      json: {
        success: true,
        data: { items: [{ id, fullName: "Employee Owner", role: "EMPLOYEE" }] },
      },
    }),
  );
  await page.route(`**/api/business-services/${id}`, (route) =>
    route.fulfill({ json: { success: true, data: service } }),
  );
  await page.route(`**/api/business-services/${id}/assets?*`, (route) =>
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
});
for (const width of [375, 768, 1440]) {
  test(`create, validate and view zero-link detail at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    let writes = 0;
    await page.route("**/api/business-services", async (route) => {
      if (route.request().method() !== "POST") return route.continue();
      writes++;
      expect(route.request().postDataJSON()).toEqual({
        name: service.name,
        description: service.description,
        ownerUserId: null,
      });
      await route.fulfill({
        status: 201,
        json: { success: true, data: service },
      });
    });
    await page.goto("/assets/business-services");
    await page
      .getByRole("button", { name: "Create business service", exact: true })
      .click();
    const dialog = page.getByRole("dialog");
    await dialog
      .getByRole("button", { name: "Create service", exact: true })
      .click();
    await expect(dialog.getByText("Enter a service name.")).toBeVisible();
    expect(writes).toBe(0);
    await dialog
      .getByLabel("Service name (required)")
      .fill(` ${service.name} `);
    await dialog.getByLabel("Description (optional)").fill(service.description);
    await dialog
      .getByRole("button", { name: "Create service", exact: true })
      .click();
    await expect(
      page.getByRole("dialog", { name: service.name }),
    ).toBeVisible();
    await expect(page.getByText("No linked assets on this page")).toBeVisible();
    await expect(
      page.getByText("Business service created", { exact: true }),
    ).toBeVisible();
    expect(writes).toBe(1);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });
}
test("conflict retains data; dirty Escape asks before discard", async ({
  page,
}) => {
  await page.route("**/api/business-services", (route) =>
    route.fulfill({
      status: 409,
      json: {
        success: false,
        error: { code: "BUSINESS_SERVICE_NAME_EXISTS", message: "Duplicate" },
      },
    }),
  );
  await page.goto("/assets/business-services");
  await page
    .getByRole("button", { name: "Create business service", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Service name (required)").fill("Support");
  await dialog
    .getByRole("button", { name: "Create service", exact: true })
    .click();
  await expect(
    dialog.getByText("This service name already exists. Use a different name."),
  ).toBeVisible();
  await expect(dialog.getByLabel("Service name (required)")).toHaveValue(
    "Support",
  );
  await page.keyboard.press("Escape");
  await expect(
    dialog.getByRole("button", { name: "Keep editing" }),
  ).toBeVisible();
  await dialog.getByRole("button", { name: "Discard changes" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
