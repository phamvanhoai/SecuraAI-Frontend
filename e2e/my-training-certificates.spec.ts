import { expect, test } from "@playwright/test";

test("Employee views only issued certificate metadata across screen widths", async ({
  context,
  page,
}) => {
  await context.addCookies([
    {
      name: "securaai_access",
      value: "certificate-test-session",
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
            permissions: [
              "training-assessments.take",
              "training-certificates.read-own",
            ],
          },
        },
      },
    }),
  );
  await page.route("**/api/training/my-certificates?*", (route) =>
    route.fulfill({
      json: {
        success: true,
        data: {
          items: [
            {
              id: "00000000-0000-4000-8000-000000000002",
              number: "SEC-TR-123",
              issuedAt: "2026-09-20T00:00:00.000Z",
              issuedBy: "Security Officer",
              enrollmentId: "00000000-0000-4000-8000-000000000003",
              completedAt: "2026-09-19T00:00:00.000Z",
              campaignTitle: "Autumn campaign",
              courseTitle: "Phishing awareness",
            },
          ],
          pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
        },
      },
    }),
  );
  for (const width of [1440, 768, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/training/my-certificates");
    await expect(
      page.getByRole("heading", { level: 1, name: "My training certificates" }),
    ).toBeVisible();
    await expect(page.getByText("SEC-TR-123")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "View details" }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
    ).toBe(false);
  }
  await page.getByRole("button", { name: "View details" }).click();
  await expect(page.getByText("Security Officer")).toBeVisible();
  await expect(page.getByRole("button", { name: /download/i })).toHaveCount(0);
});
