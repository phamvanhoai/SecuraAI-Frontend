import { expect, test } from "@playwright/test";

const policyId = "00000000-0000-4000-8000-000000000010";

test("a security officer creates a new draft policy version", async ({
  context,
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await context.addCookies([
    {
      name: "securaai_access",
      value: "policy-version-test-session",
      domain: "127.0.0.1",
      path: "/",
    },
  ]);
  await page.route("**/api/auth/session", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      json: {
        success: true,
        data: {
          user: {
            id: "00000000-0000-4000-8000-000000000001",
            email: "officer@securaai.local",
            fullName: "Security Officer",
            status: "active",
            mustChangePassword: false,
            roles: [{ code: "SECURITY_OFFICER", name: "Security Officer" }],
            permissions: ["policies.create", "policies.update"],
          },
        },
      },
    });
  });
  await page.route(
    "**/api/compliance/policies/drafts/mine?*",
    async (route) => {
      await route.fulfill({
        contentType: "application/json",
        json: {
          success: true,
          data: {
            items: [],
            pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
          },
        },
      });
    },
  );
  await page.route(
    `**/api/compliance/policies/${policyId}/versions`,
    async (route) => {
      expect(route.request().method()).toBe("POST");
      expect(route.request().postDataJSON()).toEqual({
        versionNumber: "1.1",
        content: "Updated policy content",
        changeSummary: "Added access review requirements",
      });
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        json: {
          success: true,
          data: {
            policyId,
            policyCode: "ISP-001",
            title: "Information Security Policy",
            description: null,
            ownerUserId: "00000000-0000-4000-8000-000000000001",
            policyStatus: "draft",
            version: {
              id: "00000000-0000-4000-8000-000000000011",
              versionNumber: "1.1",
              content: "Updated policy content",
              changeSummary: "Added access review requirements",
              status: "draft",
              createdByUserId: "00000000-0000-4000-8000-000000000001",
              createdAt: "2026-09-13T00:00:00.000Z",
            },
            updatedAt: "2026-09-13T00:00:00.000Z",
          },
        },
      });
    },
  );

  await page.goto("/policies");
  await page.getByRole("button", { name: "Create new version" }).click();
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Update policy and create new version",
    }),
  ).toBeVisible();

  await page.getByLabel("Policy ID").fill(policyId);
  await page.getByLabel("New version number").fill("1.1");
  await page.getByLabel("Policy content").fill("Updated policy content");
  await page
    .getByLabel("Change summary")
    .fill("Added access review requirements");
  await page.getByRole("button", { name: "Create draft version" }).click();

  await expect(
    page.getByRole("heading", { name: "Version created" }),
  ).toBeVisible();
  await expect(page.getByText("ISP-001")).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);
});
