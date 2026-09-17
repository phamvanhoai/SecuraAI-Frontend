import { expect, test } from "@playwright/test";

test("Employee reads automatic training reminders at desktop, tablet and mobile widths", async ({
  context,
  page,
}) => {
  await context.addCookies([
    {
      name: "securaai_access",
      value: "training-reminder-test-session",
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
            id: "00000000-0000-4000-8000-000000000001",
            email: "employee@example.com",
            fullName: "Test Employee",
            status: "active",
            mustChangePassword: false,
            mfaEnabled: false,
            roles: [{ code: "EMPLOYEE", name: "Employee" }],
            permissions: ["training-assessments.take"],
          },
        },
      },
    }),
  );
  let read = false;
  const notificationId = "00000000-0000-5000-8000-000000000002";
  const reminder = () => ({
    notificationId,
    enrollmentId: "00000000-0000-4000-8000-000000000003",
    title: "Training deadline approaching",
    message: 'Complete "Phishing awareness" by 2026-09-19 (end of day UTC).',
    isRead: read,
    readAt: read ? "2026-09-16T02:00:00.000Z" : null,
    createdAt: "2026-09-16T01:00:00.000Z",
  });
  await page.route("**/api/training/deadline-reminders?*", (route) => {
    const search = new URL(route.request().url()).searchParams.get("search");
    const items =
      !search || reminder().message.toLowerCase().includes(search.toLowerCase())
        ? [reminder()]
        : [];
    return route.fulfill({
      json: {
        success: true,
        data: {
          items,
          pagination: {
            page: 1,
            limit: 10,
            total: items.length,
            totalPages: 1,
          },
        },
      },
    });
  });
  await page.route(
    `**/api/training/deadline-reminders/${notificationId}/read`,
    (route) => {
      expect(route.request().method()).toBe("PATCH");
      read = true;
      return route.fulfill({ json: { success: true, data: reminder() } });
    },
  );
  for (const width of [1440, 768, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/notifications");
    await expect(
      page.getByRole("heading", { level: 1, name: "Notifications" }),
    ).toBeVisible();
    await expect(page.getByText(reminder().message)).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Open training" }),
    ).toHaveAttribute("href", "/training");
    await expect(page.getByRole("button", { name: /send/i })).toHaveCount(0);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(overflow).toBe(false);
  }
  await page
    .getByRole("searchbox", { name: "Search training reminders" })
    .fill("Phishing");
  const searchRequest = page.waitForRequest(
    (request) =>
      new URL(request.url()).searchParams.get("search") === "Phishing",
  );
  await page.getByRole("button", { name: "Search", exact: true }).click();
  expect(new URL((await searchRequest).url()).searchParams.get("page")).toBe(
    "1",
  );
  await expect(page.getByText(reminder().message)).toBeVisible();
  await page
    .getByRole("searchbox", { name: "Search training reminders" })
    .fill("does-not-exist");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(page.getByText("No reminders match your search")).toBeVisible();
  await page.getByRole("button", { name: "Clear search" }).click();
  await expect(page.getByText(reminder().message)).toBeVisible();
  await page.getByRole("button", { name: "Mark as read" }).click();
  await expect(page.getByText("Read", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Mark as read" })).toHaveCount(
    0,
  );
});
