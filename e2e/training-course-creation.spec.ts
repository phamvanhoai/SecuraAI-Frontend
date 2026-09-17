import { expect, test } from "@playwright/test";

test("creates a course draft with a post-training assessment", async ({
  context,
  page,
}) => {
  const id = "00000000-0000-4000-8000-000000000001";
  let submitted: unknown;
  await context.addCookies([
    {
      name: "securaai_access",
      value: "course-creation-test-session",
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
            id,
            email: "officer@example.com",
            fullName: "Security Officer",
            status: "active",
            mustChangePassword: false,
            mfaEnabled: false,
            roles: [{ code: "SECURITY_OFFICER", name: "Security Officer" }],
            permissions: ["training-courses.read", "training-courses.create"],
          },
        },
      },
    }),
  );
  await page.route("**/api/training/courses?*", (route) =>
    route.fulfill({
      json: {
        success: true,
        data: {
          items: [],
          pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
        },
      },
    }),
  );
  await page.route("**/api/training/courses", async (route) => {
    if (route.request().method() !== "POST") return route.fallback();
    submitted = route.request().postDataJSON();
    return route.fulfill({
      json: {
        success: true,
        data: {
          id,
          title: "Phishing essentials",
          description: "Recognize phishing attempts",
          content: "Learn how to identify and report suspicious messages.",
          status: "draft",
          createdByUserId: id,
          createdAt: "2026-09-17T00:00:00.000Z",
          updatedAt: "2026-09-17T00:00:00.000Z",
        },
      },
    });
  });

  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto("/training");
  await page.getByRole("button", { name: "Create course" }).click();
  await expect(
    page.getByText(
      "Save a draft while you prepare the training material and assessment.",
    ),
  ).toBeVisible();
  await page.getByLabel("Status", { exact: true }).selectOption("published");
  await expect(
    page.getByText(
      "Publishing makes this course ready to assign and requires a valid post-training assessment.",
    ),
  ).toBeVisible();
  await page.getByLabel("Status", { exact: true }).selectOption("draft");
  await page.getByLabel("Title", { exact: true }).fill("Phishing essentials");
  await page
    .getByLabel("Description (optional)")
    .fill("Recognize phishing attempts");
  await page
    .getByLabel("Learning objectives and training material")
    .fill("Learn how to identify and report suspicious messages.");
  await page
    .getByLabel("Question", { exact: true })
    .fill("Which message is suspicious?");
  await page.getByLabel("Answer type").selectOption("multiple_choice");
  await page
    .getByRole("textbox", { name: "Answer 1" })
    .fill("An unexpected password reset link");
  await page
    .getByRole("textbox", { name: "Answer 2" })
    .fill("An unexpected MFA approval request");
  await page
    .getByRole("textbox", { name: "Answer 3" })
    .fill("A scheduled team meeting");
  await page
    .getByRole("textbox", { name: "Answer 4" })
    .fill("An expected payroll notice");
  await page.getByRole("checkbox", { name: "Answer 1 is correct" }).check();
  await page.getByRole("checkbox", { name: "Answer 2 is correct" }).check();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
  await page.getByRole("button", { name: "Create draft" }).click();
  await expect(page.getByText("Course created")).toBeVisible();
  expect(submitted).toMatchObject({
    title: "Phishing essentials",
    assessment: {
      passingScore: 80,
      maxAttempts: 3,
      questions: expect.arrayContaining([
        expect.objectContaining({
          type: "multiple_choice",
          text: "Which message is suspicious?",
          options: expect.arrayContaining([
            expect.objectContaining({
              text: "An unexpected password reset link",
              isCorrect: true,
            }),
            expect.objectContaining({
              text: "An unexpected MFA approval request",
              isCorrect: true,
            }),
          ]),
        }),
      ]),
    },
  });
});
