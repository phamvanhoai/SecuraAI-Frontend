import { expect, test, type Page } from "@playwright/test";
const account = "00000000-0000-4000-8000-000000000001";
const id = "00000000-0000-4000-8000-000000000010";
const notification = {
  id,
  title: "Review required",
  message: "Review assigned assets",
  priority: "IMPORTANT",
  sender: "Administrator",
  createdAt: "2026-10-15T00:00:00Z",
  readAt: null,
};
async function setup(page: Page) {
  await page.context().addCookies([
    {
      name: "securaai_access",
      value: "notification-feedback-browser-test",
      domain: "127.0.0.1",
      path: "/",
    },
  ]);
  // All API interactions are fixtures. No requests are sent to real accounts.
  await page.route("**/api/**", (route) => route.abort());
  await page.route("**/api/auth/session", (route) =>
    route.fulfill({
      json: {
        success: true,
        data: {
          user: {
            id: account,
            email: "demo@example.test",
            fullName: "Demo Admin",
            status: "ACTIVE",
            mustChangePassword: false,
            roles: [{ code: "ADMIN", name: "Admin" }],
            permissions: [
              "notifications.preferences",
              "notifications.send",
              "system-logs.search",
              "system-logs.export",
              "assets.read",
              "assets.create",
            ],
          },
        },
      },
    }),
  );
}
for (const width of [375, 768, 1024, 1440]) {
  test(`bell updates and shares read state at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 960 });
    await setup(page);
    let unread = 1;
    let readAt: string | null = null;
    let readRequests = 0;
    await page.route(`**/api/notifications/inbox/${id}/read`, async (route) => {
      readRequests++;
      unread = Math.max(0, unread - 1);
      readAt = "2026-10-15T00:10:00Z";
      await route.fulfill({
        json: { success: true, data: { id, read: true } },
      });
    });
    await page.route("**/api/notifications/inbox?*", (route) =>
      route.fulfill({
        json: {
          success: true,
          data: { items: [{ ...notification, readAt }], unreadCount: unread },
        },
      }),
    );
    await page.route("**/api/notifications/inbox", async (route) => {
      expect(route.request().method()).toBe("PATCH");
      unread = 0;
      await route.fulfill({
        json: { success: true, data: { updatedCount: 2 } },
      });
    });
    await page.goto("/notifications");
    await expect(
      page.getByRole("button", {
        name: "Notifications, 1 unread",
        exact: true,
      }),
    ).toBeVisible();
    await page.bringToFront();
    unread = 2;
    await expect(
      page.getByRole("button", {
        name: "Notifications, 2 unread",
        exact: true,
      }),
    ).toBeVisible({ timeout: 20000 });
    const bell = page.getByRole("button", {
      name: "Notifications, 2 unread",
      exact: true,
    });
    const beforeOpening = page.url();
    await bell.click();
    await expect(
      page.getByRole("region", { name: "Recent notifications" }),
    ).toBeVisible();
    expect(page.url()).toBe(beforeOpening);
    expect(readRequests).toBe(0);
    await page.keyboard.press("Escape");
    await expect(
      page.getByRole("region", { name: "Recent notifications" }),
    ).toHaveCount(0);
    await expect(bell).toBeFocused();
    await page.getByRole("tab", { name: "Personal Channels" }).click();
    await bell.click();
    const preview = page.getByRole("region", { name: "Recent notifications" });
    expect((await preview.boundingBox())?.width).toBeLessThanOrEqual(width);
    await preview.getByRole("link", { name: /Review required/ }).click();
    await expect(page).toHaveURL(
      new RegExp(`/notifications#notification-${id}$`),
    );
    await expect(
      page.getByRole("region", { name: "Recent notifications" }),
    ).toHaveCount(0);
    await expect(page.locator(`#notification-${id}`)).toBeFocused();
    expect(readRequests).toBe(1);
    await expect(
      page.getByRole("button", {
        name: "Notifications, 1 unread",
        exact: true,
      }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Mark all as read" }).click();
    await expect(
      page.getByRole("button", {
        name: "Notifications, 0 unread",
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.getByText("0 unread notifications", { exact: true }).first(),
    ).toBeVisible();
    if (width === 1440) {
      await page.goto("/system-logs");
      await page
        .getByRole("button", { name: "Notifications, 0 unread", exact: true })
        .click();
      await page
        .getByRole("region", { name: "Recent notifications" })
        .getByRole("link", { name: /Review required/ })
        .click();
      await expect(page).toHaveURL(
        new RegExp(`/notifications#notification-${id}$`),
      );
      await expect(page.locator(`#notification-${id}`)).toBeFocused();
    }
  });
  test(`export validation and request errors stay inside modal at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 960 });
    await setup(page);
    await page.route("**/api/notifications/inbox?*", (route) =>
      route.fulfill({
        json: { success: true, data: { items: [], unreadCount: 0 } },
      }),
    );
    await page.route("**/api/system-logs?*", (route) =>
      route.fulfill({
        json: {
          success: true,
          data: {
            items: [
              {
                id,
                occurredAt: notification.createdAt,
                eventType: "IN_SYSTEM_NOTIFICATION_SENT",
                source: "API",
                actor: "Admin",
                actorDetail: null,
                status: "SUCCESS",
                resourceType: "NOTIFICATION",
                correlationId: null,
                errorCode: null,
              },
            ],
            pagination: { page: 1, limit: 20, total: 1, pageCount: 1 },
          },
        },
      }),
    );
    let attempts = 0;
    await page.route("**/api/system-logs/export", async (route) => {
      attempts++;
      await route.fulfill({
        status: 500,
        json: {
          success: false,
          error: {
            code: "INTERNAL_ERROR",
            message: "Export unavailable. Please try again.",
          },
        },
      });
    });
    await page.goto("/system-logs");
    await page
      .getByRole("button", { name: "Export logs", exact: true })
      .click();
    const dialog = page.getByRole("dialog", {
      name: "Export Investigation Logs",
    });
    await dialog.getByRole("button", { name: "Generate export" }).click();
    await expect(
      dialog.getByText(/Select at least one log from the table/),
    ).toBeVisible();
    await expect(
      dialog.getByText(
        /Enter an investigation purpose of at least 10 characters/,
      ),
    ).toBeVisible();
    expect(attempts).toBe(0);
    await dialog.getByRole("radio", { name: /All matching results/ }).check();
    await dialog.getByRole("button", { name: "Generate export" }).click();
    await expect(
      dialog.getByRole("textbox", {
        name: "Investigation purpose",
        exact: true,
      }),
    ).toBeFocused();
    await dialog
      .getByRole("textbox", { name: "Investigation purpose", exact: true })
      .fill("Investigate notification delivery");
    await dialog.getByRole("button", { name: "Generate export" }).click();
    await expect(dialog.getByRole("alert")).toHaveText(
      "Export unavailable. Please try again.",
    );
    await expect(dialog).toBeVisible();
    expect(attempts).toBe(1);
    await page.screenshot({
      path: testInfo.outputPath("export-errors.png"),
      fullPage: true,
    });
    expect((await dialog.boundingBox())?.width).toBeLessThanOrEqual(width);
  });
}

test("shared error toast stays visible and dismissible above another feature's modal", async ({
  page,
}) => {
  await setup(page);
  await page.route("**/api/notifications/inbox?*", (route) =>
    route.fulfill({
      json: { success: true, data: { items: [], unreadCount: 0 } },
    }),
  );
  await page.route("**/api/assets?*", (route) =>
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
  await page.route("**/api/assets/create-options", (route) =>
    route.fulfill({
      json: {
        success: true,
        data: {
          owners: [],
          businessServices: [],
          assets: [],
          eventSources: [],
        },
      },
    }),
  );
  await page.route("**/api/assets", (route) =>
    route.fulfill({
      status: 500,
      json: {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Please retry asset creation.",
        },
      },
    }),
  );
  await page.goto("/assets");
  await page.getByRole("button", { name: "Add asset", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Create IT Asset" });
  await dialog.getByLabel("Asset name", { exact: true }).fill("Demo server");
  await dialog.getByLabel("Asset type", { exact: true }).fill("SERVER");
  await dialog
    .getByRole("button", { name: "Create asset", exact: true })
    .click();
  await expect(dialog.getByRole("alert")).toContainText(
    "Unable to create asset",
  );
  const dismiss = dialog.getByRole("button", { name: "Đóng thông báo" });
  await expect(dismiss).toBeVisible();
  // Trial-click verifies that the toast is not hidden or blocked by the backdrop.
  await dismiss.click({ trial: true });
  await dismiss.click();
  await expect(dialog.getByRole("alert")).toHaveCount(0);
  await expect(dialog).toBeVisible();
  await page.evaluate(() => document.documentElement.classList.add("dark"));
  await dialog
    .getByRole("button", { name: "Create asset", exact: true })
    .click();
  await expect(dialog.getByRole("alert")).toContainText(
    "Unable to create asset",
  );
  await dialog
    .getByRole("button", { name: "Đóng thông báo" })
    .click({ trial: true });
  await page.screenshot({
    path: "test-results/modal-toast-dark.png",
    fullPage: true,
  });
});
