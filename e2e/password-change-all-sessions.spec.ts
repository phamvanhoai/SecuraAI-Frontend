import { expect, test } from "@playwright/test";

test("password change shows success, signs out both devices, and a new login opens Overview", async ({ browser, baseURL }) => {
  test.setTimeout(90_000);
  const origin = new URL(baseURL ?? "http://127.0.0.1:3101").origin;
  const contexts = [await browser.newContext(), await browser.newContext()] as const;
  const authenticated = [true, true];
  let passwordChanged = false;
  const user = {
    id: "00000000-0000-4000-8000-000000000002", email: "session-test@example.test",
    fullName: "Session Test", status: "active", mustChangePassword: false,
    roles: [{ code: "EMPLOYEE", name: "Employee" }], permissions: ["notifications.preferences"],
  };
  try {
    for (const [index, context] of contexts.entries()) {
      await context.addCookies([{ name: "securaai_access", value: "browser-test-session", url: origin, httpOnly: true }]);
      await context.route("**/api/**", async (route) => {
        const path = new URL(route.request().url()).pathname;
        if (path === "/api/auth/session") {
          if (!authenticated[index]) {
            await context.clearCookies();
            await route.fulfill({ status: 401, json: { success: false } });
          } else await route.fulfill({ json: { success: true, data: { user } } });
        } else if (path === "/api/auth/change-password") {
          passwordChanged = true;
          authenticated.fill(false);
          await context.clearCookies();
          await route.fulfill({ json: { success: true, data: { message: "Password changed successfully. Please log in again." } } });
        } else if (path === "/api/auth/login") {
          const body: unknown = route.request().postDataJSON();
          if (!passwordChanged || typeof body !== "object" || body === null || !("password" in body) || body.password !== "NewPassword2@") {
            await route.fulfill({ status: 401, json: { success: false, error: { code: "INVALID_CREDENTIALS", message: "Email or password is incorrect" } } });
            return;
          }
          authenticated[index] = true;
          await context.addCookies([{ name: "securaai_access", value: "new-browser-test-session", url: origin, httpOnly: true }]);
          await route.fulfill({ json: { success: true, data: { authenticated: true } } });
        } else await route.fulfill({ json: { success: true, data: { items: [], total: 0, page: 1, limit: 10, unreadCount: 0 } } });
      });
    }
    const first = await contexts[0].newPage();
    const second = await contexts[1].newPage();
    await first.goto("/change-password");
    await second.goto("/dashboard");
    await expect(second.getByRole("heading", { name: "Welcome back, Session Test" })).toBeVisible();
    await first.getByLabel("Current password", { exact: true }).fill("OldPassword1!");
    await first.getByLabel("New password", { exact: true }).fill("NewPassword2@");
    await first.getByLabel("Confirm new password", { exact: true }).fill("NewPassword2@");
    await first.getByRole("button", { name: "Change password", exact: true }).click();
    await expect(first).toHaveURL(/\/login\?passwordChanged=1$/, { timeout: 15_000 });
    await expect(first.getByText("Password changed successfully. Sign in again with your new password.")).toBeVisible();
    await expect(second).toHaveURL(/\/login\?sessionExpired=1$/, { timeout: 20_000 });
    for (const page of [first, second]) {
      await page.getByLabel("Email", { exact: true }).fill(user.email);
      await page.getByLabel("Password", { exact: true }).fill("NewPassword2@");
      await page.getByRole("button", { name: "Sign in", exact: true }).click();
      await expect(page).toHaveURL(origin + "/dashboard", { timeout: 15_000 });
      await expect(page.getByRole("heading", { name: "Welcome back, Session Test" })).toBeVisible();
    }
  } finally { await Promise.all(contexts.map((context) => context.close())); }
});
