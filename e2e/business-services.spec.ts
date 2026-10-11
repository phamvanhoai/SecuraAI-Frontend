import { expect, test } from "@playwright/test";

const id = "00000000-0000-4000-8000-000000000010";
const service = {
  id,
  name: "Customer Support Service",
  description: "Business service browser fixture",
  status: "inactive",
  owner: null,
  linkedAssetsCount: 11,
  createdAt: "2026-10-01T00:00:00Z",
  updatedAt: "2026-10-02T00:00:00Z",
};
const pagination = { page: 1, limit: 10, total: 11, totalPages: 2 };
test.beforeEach(async ({ context, page }) => {
  await context.addCookies([
    {
      name: "securaai_access",
      value: "business-service-browser-test",
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
            permissions: ["assets.read", "business-services.read"],
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
          items: [],
          pagination: { ...pagination, total: 0, totalPages: 0 },
        },
      },
    }),
  );
  await page.route("**/api/business-services?*", (route) => {
    const query = new URL(route.request().url()).searchParams;
    return route.fulfill({
      json: {
        success: true,
        data: {
          items: [service],
          pagination: { ...pagination, page: Number(query.get("page") ?? 1) },
        },
      },
    });
  });
  await page.route(`**/api/business-services/${id}`, (route) =>
    route.fulfill({ json: { success: true, data: service } }),
  );
  await page.route(`**/api/business-services/${id}/assets?*`, (route) =>
    route.fulfill({
      json: {
        success: true,
        data: {
          items: [
            {
              id,
              name: "Support Database",
              assetCode: "AST-DEMO-01",
              assetType: "DATABASE",
              status: "archived",
            },
          ],
          pagination: {
            ...pagination,
            page: Number(
              new URL(route.request().url()).searchParams.get("page"),
            ),
          },
        },
      },
    }),
  );
});

for (const width of [375, 768, 1024, 1440]) {
  test(`read-only list/search/detail and keyboard at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/assets");
    await page
      .getByRole("link", { name: "Business Services", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "Business Services", exact: true }),
    ).toBeVisible();
    await page.getByLabel("Search", { exact: true }).fill("Support");
    await page
      .getByRole("combobox", { name: "Status", exact: true })
      .selectOption("inactive");
    const request = page.waitForRequest(
      (request) =>
        request.url().includes("/api/business-services?") &&
        request.url().includes("q=Support") &&
        request.url().includes("status=inactive"),
    );
    await page.getByRole("button", { name: "Search", exact: true }).click();
    await request;
    await expect(page).toHaveURL(/q=Support.*status=inactive/);
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await expect(page).toHaveURL(/page=2/);
    const trigger = page.getByRole("button", { name: "Actions for Customer Support Service" });
    await trigger.scrollIntoViewIfNeeded();
    await trigger.focus();
    await page.keyboard.press("Enter");
    await page.getByRole("button", { name: "View details for Customer Support Service" }).focus();
    await page.keyboard.press("Enter");
    const dialog = page.getByRole("dialog");
    await expect(
      dialog.getByText("Support Database", { exact: true }),
    ).toBeVisible();
    await expect(dialog.getByText("Archived", { exact: true })).toBeVisible();
    await expect(dialog.getByText("01/10/2026, 07:00")).toBeVisible();
    await expect(
      dialog.getByText(/does not update any existing Risk scope/),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await dialog.getByRole("button", { name: "Next", exact: true }).click();
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await page
      .getByRole("button", { name: "Clear filters", exact: true })
      .click();
    await expect(page).toHaveURL(/\/assets\/business-services$/);
    await expect(
      page.getByRole("button", { name: /Create|Edit|Deactivate/ }),
    ).toHaveCount(0);
  });
}
test("empty/error/retry and dark theme", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.route("**/api/business-services?*", (route) =>
    route.fulfill({
      status: 503,
      json: { success: false, error: { message: "Unavailable" } },
    }),
  );
  await page.goto("/assets/business-services");
  await expect(
    page.getByText("Unable to load business services"),
  ).toBeVisible();
  await page.route("**/api/business-services?*", (route) =>
    route.fulfill({
      json: {
        success: true,
        data: {
          items: [],
          pagination: { ...pagination, total: 0, totalPages: 0 },
        },
      },
    }),
  );
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByText("No business services found")).toBeVisible();
});
test("ownership-scoped asset access does not expose the service catalog", async ({
  page,
}) => {
  await page.route("**/api/auth/session", (route) =>
    route.fulfill({
      json: {
        success: true,
        data: {
          user: {
            id,
            email: "owner@example.test",
            fullName: "Asset Owner",
            status: "active",
            mustChangePassword: false,
            roles: [{ code: "EMPLOYEE", name: "Employee" }],
            permissions: ["assets.read"],
          },
        },
      },
    }),
  );
  let requests = 0;
  page.on("request", (request) => {
    if (request.url().includes("/api/business-services")) requests++;
  });
  await page.goto("/assets/business-services");
  await expect(
    page.getByText("You do not have permission to view business services"),
  ).toBeVisible();
  expect(requests).toBe(0);
  await page.goto("/assets");
  await expect(page.getByText("No assets found")).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Business Services", exact: true }),
  ).toHaveCount(0);
});
