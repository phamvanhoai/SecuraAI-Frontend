import { expect, test } from "@playwright/test";

test("edits a structured course draft without losing its existing material", async ({
  context,
  page,
}) => {
  const id = "00000000-0000-4000-8000-000000000001";
  const courseId = "e2ef8324-9ac0-4e7f-b16d-50050274a72e";
  const fileId = "8aa86891-5d1d-4053-9859-2934f886476e";
  const draft = {
    id: courseId,
    title: "Security basics",
    description: "Current draft",
    content: "Learn safe daily practices.",
    status: "draft",
    updatedAt: "2026-09-19T08:00:00.000Z",
    lessons: [
      {
        title: "Password safety",
        isRequired: true,
        materials: [
          {
            title: "Video guide",
            type: "video",
            existingFileId: fileId,
            existingFile: {
              name: "guide.mp4",
              mimeType: "video/mp4",
              sizeBytes: 100,
            },
          },
        ],
      },
    ],
    assessment: null,
  };
  let submitted: unknown;
  await context.addCookies([
    {
      name: "securaai_access",
      value: "course-edit-test-session",
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
            permissions: ["training-courses.read", "training-courses.update"],
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
          items: [
            {
              id: courseId,
              title: draft.title,
              description: draft.description,
              content: draft.content,
              status: "draft",
              createdByUserId: id,
              createdAt: draft.updatedAt,
              updatedAt: draft.updatedAt,
            },
          ],
          pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
        },
      },
    }),
  );
  await page.route(`**/api/training/courses/${courseId}`, async (route) => {
    if (route.request().method() === "PATCH") {
      submitted = route.request().postDataJSON();
      return route.fulfill({ json: { success: true, data: draft } });
    }
    return route.fulfill({ json: { success: true, data: draft } });
  });

  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto(`/training/${courseId}/edit`);
  await expect(page).toHaveURL(new RegExp(`/training/${courseId}/edit$`));
  await expect(page.getByLabel("Course title *")).toHaveValue(draft.title);
  await expect(page.getByText("guide.mp4")).toBeVisible();
  await page.getByLabel("Course title *").fill("Security basics updated");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Course draft updated")).toBeVisible();
  expect(submitted).toMatchObject({
    title: "Security basics updated",
    expectedUpdatedAt: draft.updatedAt,
    lessons: [{ materials: [{ existingFileId: fileId }] }],
  });
});
