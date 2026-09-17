import { expect, test } from "@playwright/test";
test("Training course to campaign to employee certificate flow", async ({
  context,
  page,
}, testInfo) => {
  const id = "00000000-0000-4000-8000-000000000001",
    timestamp = "2026-09-17T00:00:00.000Z";
  let issued = false,
    writes = 0;
  await context.addCookies([
    {
      name: "securaai_access",
      value: "certificate-test-session",
      domain: "127.0.0.1",
      path: "/",
      httpOnly: true,
    },
  ]);
  await page.route("**/api/auth/session", (r) =>
    r.fulfill({
      json: {
        success: true,
        data: {
          user: {
            id,
            email: "officer@example.com",
            fullName: "Security Officer",
            status: "active",
            mustChangePassword: false,
            mfaEnabled: false,
            roles: [{ code: "SECURITY_OFFICER", name: "Security Officer" }],
            permissions: [
              "training-courses.read",
              "training-completion.read",
              "training-certificates.issue",
            ],
          },
        },
      },
    }),
  );
  await page.route("**/api/training/courses?*", (r) =>
    r.fulfill({
      json: {
        success: true,
        data: {
          items: [
            {
              id,
              title: "Phishing awareness",
              description: "Course content",
              content: "Security awareness content",
              status: "published",
              createdByUserId: id,
              createdAt: timestamp,
              updatedAt: timestamp,
            },
          ],
          pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
        },
      },
    }),
  );
  await page.route("**/api/training/completion?*", (r) => {
    expect(new URL(r.request().url()).searchParams.get("courseId")).toBe(id);
    return r.fulfill({
      json: {
        success: true,
        data: {
          items: [
            {
              id,
              title: "Awareness campaign",
              courseTitle: "Phishing awareness",
              startDate: timestamp,
              dueDate: timestamp,
              status: "active",
              assigned: 1,
              completed: 1,
              inProgress: 0,
              notStarted: 0,
              overdue: 0,
              completionRate: 100,
              averageProgress: 100,
            },
          ],
          pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
        },
      },
    });
  });
  await page.route(`**/api/training/completion/${id}?*`, (r) =>
    r.fulfill({
      json: {
        success: true,
        data: {
          campaign: {
            id,
            title: "Awareness campaign",
            courseTitle: "Phishing awareness",
            startDate: timestamp,
            dueDate: timestamp,
          },
          items: [
            {
              id,
              user: {
                id,
                name: "Test Employee",
                email: "employee@example.com",
                employeeCode: null,
              },
              status: "completed",
              progressPercent: 100,
              startedAt: timestamp,
              completedAt: timestamp,
              lastAccessedAt: timestamp,
              certificateNumber: issued ? "SEC-TR-TEST-001" : null,
            },
          ],
          pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
        },
      },
    }),
  );
  await page.route(`**/api/training/enrollments/${id}/certificate`, (r) => {
    if (r.request().method() === "POST") {
      issued = true;
      writes++;
    }
    return r.fulfill({
      json: {
        success: true,
        data: {
          enrollmentId: id,
          learnerName: "Test Employee",
          courseTitle: "Phishing awareness",
          campaignTitle: "Awareness campaign",
          completedAt: timestamp,
          eligible: true,
          certificate: issued
            ? {
                id,
                number: "SEC-TR-TEST-001",
                issuedAt: timestamp,
                issuedBy: "Security Officer",
              }
            : null,
        },
      },
    });
  });
  for (const width of [1440, 768, 375]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/training");
    await expect(
      page.getByRole("heading", { name: "Security awareness courses" }),
    ).toBeVisible();
    await expect(
      page.getByRole("navigation", { name: "Training sections" }),
    ).toHaveCount(0);
    await page
      .getByRole("searchbox", { name: "Search courses" })
      .fill("Phishing");
    const actions = page.getByRole("button", {
      name: "Actions for Phishing awareness",
    });
    await actions.scrollIntoViewIfNeeded();
    await actions.click();
    await page.screenshot({
      path: testInfo.outputPath(`actions-${width}.png`),
    });
    await page.getByRole("button", { name: "View training progress" }).click();
    await expect(
      page.getByRole("heading", { name: "Training progress", exact: true }),
    ).toBeVisible();
    await page.screenshot({
      path: testInfo.outputPath(`progress-${width}.png`),
    });
    await page.getByRole("button", { name: "View employees" }).click();
    await page.screenshot({
      path: testInfo.outputPath(`employees-${width}.png`),
    });
    await page
      .getByRole("button", { name: "Issue certificate", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "Training completion certificate" }),
    ).toBeVisible();
    await expect(
      page
        .getByRole("region", { name: "Training completion certificate" })
        .getByText("Test Employee", { exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
    ).toBe(false);
    await page.getByRole("button", { name: "Back to employees" }).click();
    await page.getByRole("button", { name: "Close", exact: true }).click();
    await page.getByRole("button", { name: "Back to courses" }).click();
    await expect(
      page.getByRole("searchbox", { name: "Search courses" }),
    ).toHaveValue("Phishing");
  }
  await page.getByText("Actions for Phishing awareness").click();
  await page.getByRole("button", { name: "View training progress" }).click();
  await page.getByRole("button", { name: "View employees" }).click();
  await page
    .getByRole("button", { name: "Issue certificate", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Issue certificate", exact: true })
    .click();
  await expect(page.getByText("SEC-TR-TEST-001")).toBeVisible();
  await page.getByRole("button", { name: "Back to employees" }).click();
  await expect(
    page.getByRole("button", { name: "View certificate" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "View certificate" }).click();
  await expect(page.getByText("SEC-TR-TEST-001")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Issue certificate", exact: true }),
  ).toHaveCount(0);
  expect(writes).toBe(1);
});
