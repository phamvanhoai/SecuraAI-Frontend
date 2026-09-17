import { expect, test } from "@playwright/test";

test("Executive can view department training totals and search at responsive widths", async ({
  context,
  page,
}) => {
  await context.addCookies([
    {
      name: "securaai_access",
      value: "report-test-session",
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
            id: "00000000-0000-4000-8000-000000000001",
            email: "executive@example.com",
            fullName: "Executive",
            status: "active",
            mustChangePassword: false,
            mfaEnabled: false,
            roles: [{ code: "EXECUTIVE", name: "Executive" }],
            permissions: [
              "training-department-reports.read",
              "training-completion.read",
            ],
          },
        },
      },
    }),
  );
  const counts = {
    employees: 3,
    assigned: 6,
    completed: 3,
    overdue: 1,
    completionRate: 50,
  };
  await page.route("**/api/training/department-report?*", (route) =>
    route.fulfill({
      json: {
        success: true,
        data: {
          items: [
            { id: "it", name: "Information Technology", code: "IT", ...counts },
          ],
          summary: counts,
          pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
        },
      },
    }),
  );
  await page.route("**/api/training/completion?*", (route) =>
    route.fulfill({
      json: {
        success: true,
        data: {
          items: [],
          pagination: { page: 1, limit: 10, total: 0, totalPages: 1 },
        },
      },
    }),
  );
  await page.goto("/training");
  const trainingSections = page.getByRole("navigation", {
    name: "Training sections",
  });
  await expect(
    trainingSections.getByRole("link", { name: "Department report" }),
  ).toBeVisible();
  await trainingSections
    .getByRole("link", { name: "Department report" })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Department training completion report",
    }),
  ).toBeVisible();
  await expect(page.getByText("Information Technology")).toBeVisible();
  await expect(
    trainingSections.getByRole("link", { name: "Training progress" }),
  ).toBeVisible();
  await page.getByLabel("Search departments").fill("IT");
  const request = page.waitForRequest(
    (req) =>
      req.url().includes("/api/training/department-report?") &&
      new URL(req.url()).searchParams.get("q") === "IT",
  );
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await request;
  for (const width of [375, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(
      page.getByRole("heading", {
        name: "Department training completion report",
      }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await expect(
      trainingSections.getByRole("link", { name: "Training progress" }),
    ).toBeVisible();
  }
  await trainingSections
    .getByRole("link", { name: "Training progress" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Training progress", exact: true }),
  ).toBeVisible();
});
