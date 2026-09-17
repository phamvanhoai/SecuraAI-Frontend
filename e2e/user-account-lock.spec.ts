import { expect, test, type Page } from "@playwright/test";

const adminId = "00000000-0000-4000-8000-000000000001";
const employeeId = "00000000-0000-4000-8000-000000000002";

async function setup(
  page: Page,
  options: { role?: string; permissions?: string[]; conflict?: boolean } = {},
) {
  await page.context().addCookies([
    {
      name: "securaai_access",
      value: "e2e-placeholder",
      domain: "127.0.0.1",
      path: "/",
      httpOnly: true,
    },
  ]);
  await page.route("**/api/auth/session", (route) =>
    route.fulfill({
      json: {
        success: true,
        data: {
          user: {
            id: adminId,
            email: "admin@example.test",
            fullName: "Preview Administrator",
            status: "active",
            mustChangePassword: false,
            mfaEnabled: false,
            roles: [{ code: options.role ?? "ADMIN", name: "Administrator" }],
            permissions: options.permissions ?? [
              "users.read",
              "users.lock",
              "users.unlock",
            ],
          },
        },
      },
    }),
  );
  let status = "active";
  let requests = 0;
  const base = {
    employeeCode: "EMP-001",
    department: null,
    roles: [{ code: "EMPLOYEE", name: "Employee" }],
  };
  await page.route(/\/api\/users(?:\?.*)?$/, (route) =>
    route.fulfill({
      json: {
        success: true,
        data: {
          items: [
            {
              ...base,
              id: adminId,
              fullName: "Preview Administrator",
              email: "admin@example.test",
              status: "active",
            },
            {
              ...base,
              id: employeeId,
              fullName: "Employee Test",
              email: "employee@example.test",
              status,
            },
            {
              ...base,
              id: "00000000-0000-4000-8000-000000000003",
              fullName: "Disabled User",
              email: "disabled@example.test",
              status: "disabled",
            },
          ],
          pagination: { page: 1, limit: 20, total: 3, totalPages: 1 },
          summary: {
            active: status === "active" ? 2 : 1,
            locked: status === "locked" ? 1 : 0,
            inactive: 0,
            disabled: 1,
          },
        },
      },
    }),
  );
  await page.route(`**/api/users/${employeeId}/*`, (route) => {
    requests += 1;
    expect(route.request().method()).toBe("POST");
    expect(route.request().postDataJSON()).toEqual({
      reason: "Security investigation completed",
    });
    if (options.conflict)
      return route.fulfill({
        status: 409,
        json: {
          success: false,
          error: { code: "LAST_ACCOUNT_MANAGER", message: "Last manager" },
        },
      });
    status = route.request().url().endsWith("/unlock") ? "active" : "locked";
    return route.fulfill({
      json: {
        success: true,
        data: {
          id: employeeId,
          status,
          lastLockedAt: "2026-09-17T08:00:00.000Z",
          updatedAt: "2026-09-17T09:00:00.000Z",
          changed: true,
        },
      },
    });
  });
  return { requests: () => requests };
}

test("an authorized admin locks and unlocks users at desktop, tablet and mobile widths", async ({
  page,
}) => {
  const state = await setup(page);
  for (const width of [1440, 768, 375]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/admin/users");
    const row = page
      .getByRole("row")
      .filter({ hasText: "employee@example.test" });
    await expect(page.getByText("Your account")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Lock Preview Administrator" }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: /Lock Disabled User/ }),
    ).toHaveCount(0);
    const before = state.requests();
    await row.getByRole("button", { name: "Lock Employee Test" }).click();
    const dialog = page.getByRole("dialog", { name: "Lock account" });
    await expect(dialog.getByLabel("Reason (required)")).toBeFocused();
    await dialog
      .getByRole("button", { name: "Lock account", exact: true })
      .click();
    await expect(dialog.getByText(/at least 10 characters/)).toBeVisible();
    expect(state.requests()).toBe(before);
    await dialog
      .getByLabel("Reason (required)")
      .fill("  Security investigation completed  ");
    if (width === 1440)
      await page.screenshot({
        path: "test-results/user-account-lock-dialog.png",
        fullPage: true,
      });
    await dialog
      .getByRole("button", { name: "Lock account", exact: true })
      .click();
    await expect(dialog).not.toBeVisible();
    await expect(row.getByText("Locked", { exact: true })).toBeVisible();
    await expect(
      page
        .getByLabel("User summary")
        .getByText("Locked users", { exact: true })
        .locator("..")
        .getByText("1", { exact: true }),
    ).toBeVisible();
    if (width === 1440)
      await page.screenshot({
        path: "test-results/user-account-lock-list.png",
        fullPage: true,
      });
    await row.getByRole("button", { name: "Unlock Employee Test" }).click();
    const unlock = page.getByRole("dialog", { name: "Unlock account" });
    await unlock
      .getByLabel("Reason (required)")
      .fill("Security investigation completed");
    await unlock
      .getByRole("button", { name: "Unlock account", exact: true })
      .click();
    await expect(unlock).not.toBeVisible();
    await expect(row.getByText("Active", { exact: true })).toBeVisible();
    await expect(
      row.getByRole("button", { name: "Lock Employee Test" }),
    ).toBeFocused();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth,
      ),
    ).toBe(false);
  }
  expect(state.requests()).toBe(6);
});

test("backend refusal keeps the confirmation open and does not announce success", async ({
  page,
}) => {
  await setup(page, { conflict: true });
  await page.goto("/admin/users");
  await page.getByRole("button", { name: "Lock Employee Test" }).click();
  const dialog = page.getByRole("dialog");
  await dialog
    .getByLabel("Reason (required)")
    .fill("Security investigation completed");
  await dialog
    .getByRole("button", { name: "Lock account", exact: true })
    .click();
  await expect(dialog.getByText(/last active administrator/)).toBeVisible();
  await expect(dialog.getByLabel("Reason (required)")).toHaveValue(
    "Security investigation completed",
  );
  await expect(page.getByText("Account locked", { exact: true })).toHaveCount(
    0,
  );
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(
    page.getByRole("button", { name: "Lock Employee Test" }),
  ).toBeFocused();
});

test("ADMIN without operation permissions cannot manage account locks", async ({
  page,
}) => {
  await setup(page, { permissions: ["users.read"] });
  await page.goto("/admin/users");
  await expect(page.getByText("employee@example.test")).toBeVisible();
  await expect(
    page.getByRole("button", { name: /^(Lock|Unlock) / }),
  ).toHaveCount(0);
});

test("a non-admin with operation permissions still cannot manage account locks", async ({
  page,
}) => {
  await setup(page, { role: "SECURITY_OFFICER" });
  await page.goto("/users");
  await expect(page.getByText("employee@example.test")).toBeVisible();
  await expect(
    page.getByRole("button", { name: /^(Lock|Unlock) / }),
  ).toHaveCount(0);
});
