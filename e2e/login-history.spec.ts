import { expect, test, type Page } from "@playwright/test";

async function setup(
  page: Page,
  role = "ADMIN",
  permission = true,
  backendStatus = 200,
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
            id: "11111111-1111-4111-8111-111111111111",
            email: "reviewer@example.test",
            fullName: "History Reviewer",
            status: "active",
            mustChangePassword: false,
            mfaEnabled: false,
            roles: [{ code: role, name: role }],
            permissions: permission ? ["login-history.read", "users.read"] : [],
          },
        },
      },
    }),
  );
  const queries: URLSearchParams[] = [];
  await page.route("**/api/login-history?*", (route) => {
    const params = new URL(route.request().url()).searchParams;
    queries.push(params);
    const empty = params.get("search") === "no-match";
    return route.fulfill({
      status: backendStatus,
      json:
        backendStatus === 200
          ? {
              success: true,
              data: {
                items: empty
                  ? []
                  : [
                      {
                        id: "22222222-2222-4222-8222-222222222222",
                        userId: null,
                        userName: "Another User",
                        email: "another@example.test",
                        loginTime: "2026-09-18T08:00:00Z",
                        status: "failed",
                        ipAddress: "::1",
                        userAgent: "PostmanRuntime / Test browser",
                        failureReason: "INVALID_CREDENTIALS",
                      },
                    ],
                pagination: {
                  page: Number(params.get("page") ?? 1),
                  limit: Number(params.get("limit") ?? 20),
                  total: empty ? 0 : 21,
                  totalPages: empty ? 0 : 2,
                },
              },
            }
          : {
              success: false,
              error: { code: "FORBIDDEN", message: "Access denied" },
            },
    });
  });
  return queries;
}

test("admin searches, filters, pages and views login history at responsive widths", async ({
  page,
}) => {
  const queries = await setup(page);
  await page.goto("/admin/login-history");
  await expect(page.getByText("another@example.test")).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Login History", exact: true }),
  ).toHaveAttribute("href", "/admin/login-history");
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect.poll(() => queries.at(-1)?.get("page")).toBe("2");
  await page.getByLabel("Search by name or email").fill("another");
  await page.getByLabel("Status", { exact: true }).selectOption("failed");
  await page.getByLabel("IP address", { exact: true }).fill("::1");
  await expect.poll(() => queries.at(-1)?.get("search")).toBe("another");
  await expect.poll(() => queries.at(-1)?.get("ipAddress")).toBe("::1");
  expect(queries.at(-1)?.get("status")).toBe("failed");
  expect(queries.at(-1)?.get("page")).toBe("1");
  expect(queries.at(-1)?.get("ipAddress")).toBe("::1");
  for (const width of [1440, 1024, 768, 375]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(
      page.getByRole("heading", { name: "Login History", exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `test-results/login-history-${width}.png`,
      fullPage: true,
    });
  }
  await page
    .getByRole("button", { name: "Clear filters", exact: true })
    .click();
  await expect(page.getByLabel("Search by name or email")).toHaveValue("");
  await page.getByLabel("Search by name or email").fill("no-match");
  await expect(
    page.getByText("No matching login history", { exact: true }),
  ).toBeVisible();
});

test("security officer sees the menu and can navigate directly", async ({
  page,
}) => {
  await setup(page, "SECURITY_OFFICER");
  await page.goto("/login-history");
  await expect(page.getByText("another@example.test")).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Login History", exact: true }),
  ).toHaveAttribute("href", "/login-history");
});

for (const [role, permission] of [
  ["EMPLOYEE", true],
  ["EXECUTIVE", true],
  ["ADMIN", false],
] as const) {
  test(`${role} permission=${permission} cannot access login history directly`, async ({
    page,
  }) => {
    const queries = await setup(page, role, permission);
    await page.goto("/login-history");
    await expect(page).toHaveURL(/\/forbidden$/);
    await expect(
      page.getByText("403 — Không có quyền truy cập", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Login History", exact: true }),
    ).toHaveCount(0);
    expect(queries).toHaveLength(0);
  });
}

test("backend 403 redirects an otherwise permitted reviewer", async ({
  page,
}) => {
  await setup(page, "ADMIN", true, 403);
  await page.goto("/login-history");
  await expect(page).toHaveURL(/\/forbidden$/);
  await expect(page.getByText("another@example.test")).toHaveCount(0);
});

test("matches profile and users page gutters and remains usable in dark mode", async ({
  page,
}) => {
  await setup(page);
  await page.route(/\/api\/users(?:\?.*)?$/, (route) =>
    route.fulfill({
      json: {
        success: true,
        data: {
          items: [
            {
              id: "11111111-1111-4111-8111-111111111111",
              fullName: "History Reviewer",
              email: "reviewer@example.test",
              status: "active",
              employeeCode: "TEST-001",
              department: null,
              roles: [{ code: "ADMIN", name: "Admin" }],
            },
          ],
          pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
          summary: { active: 1, locked: 0, inactive: 0, disabled: 0 },
        },
      },
    }),
  );
  for (const width of [1440, 768, 375]) {
    await page.setViewportSize({ width, height: 900 });
    const positions: number[] = [];
    for (const path of ["/profile", "/admin/users", "/admin/login-history"]) {
      await page.goto(path);
      await expect(page.locator("main h1")).toBeVisible();
      const heading = await page.locator("main h1").boundingBox();
      if (!heading) throw new Error("Missing page heading");
      positions.push(heading.x);
    }
    expect(new Set(positions).size).toBe(1);
    await page.evaluate(() => document.documentElement.classList.add("dark"));
    await expect(page.getByText("another@example.test")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `test-results/login-history-dark-${width}.png`,
      fullPage: true,
      animations: "disabled",
    });
  }
});
