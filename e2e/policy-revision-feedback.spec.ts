import { expect, test } from "@playwright/test";
const id = "00000000-0000-4000-8000-000000000010";
const versionId = "00000000-0000-4000-8000-000000000020";
const at = "2026-10-22T00:00:00Z";
const reason =
  "Clarify the reporting responsibilities.\nAdd the contact point. " +
  "Reference/".repeat(45);
for (const width of [375, 768, 1024, 1440]) {
  test(`revision feedback in details and edit at ${width}px`, async ({
    page,
    context,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({
      colorScheme: width >= 1024 ? "dark" : "light",
      reducedMotion: "reduce",
    });
    await context.addCookies([
      {
        name: "securaai_access",
        value: "test-session",
        domain: "127.0.0.1",
        path: "/",
      },
    ]);
    const draft = {
      policyId: id,
      policyCode: "POL-TEST",
      title: "Security policy",
      description: null,
      ownerUserId: id,
      policyStatus: "DRAFT",
      createdAt: at,
      updatedAt: at,
      revisionRequest: {
        id,
        reason,
        requestedAt: at,
        requestedBy: { id, name: "Reviewing Admin" },
      },
      version: {
        id: versionId,
        versionNumber: "1.0",
        content: "Saved policy content",
        changeSummary: null,
        status: "DRAFT",
        createdByUserId: id,
        createdAt: at,
      },
    };
    await page.route("**/api/auth/session", (route) =>
      route.fulfill({
        json: {
          success: true,
          data: {
            user: {
              id,
              email: "officer@example.test",
              fullName: "Officer",
              status: "active",
              mustChangePassword: false,
              roles: [{ code: "SECURITY_OFFICER", name: "Security Officer" }],
              permissions: ["policies.create"],
            },
          },
        },
      }),
    );
    await page.route("**/api/compliance/policies/drafts/mine?*", (route) =>
      route.fulfill({
        json: {
          success: true,
          data: {
            items: [draft],
            pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
          },
        },
      }),
    );
    await page.route(
      `**/api/compliance/policies/${id}/drafts/${versionId}`,
      (route) => route.fulfill({ json: { success: true, data: draft } }),
    );
    await page.goto("/policies");
    const actions = page.getByRole("button", {
      name: "Actions for Security policy",
    });
    await actions.scrollIntoViewIfNeeded();
    await actions.click();
    await page
      .getByRole("button", { name: "View details", exact: true })
      .click();
    const detail = page.getByRole("dialog", { name: "Draft details" });
    await expect(
      detail.getByRole("heading", { name: "Latest revision request" }),
    ).toBeVisible();
    await expect(
      detail.getByText(/Requested by Reviewing Admin/),
    ).toBeVisible();
    const feedback = detail.getByText(/Clarify the reporting responsibilities/);
    await expect(feedback).toBeVisible();
    expect(
      await detail.evaluate((el) => el.scrollWidth <= el.clientWidth),
    ).toBe(true);
    await detail.getByRole("button", { name: "Edit", exact: true }).click();
    const edit = page.getByRole("dialog", { name: "Edit draft" });
    await expect(
      edit.getByRole("heading", { name: "Latest revision request" }),
    ).toBeVisible();
    await expect(edit.getByText(/Requested by Reviewing Admin/)).toBeVisible();
    expect(await edit.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(
      true,
    );
    await edit.getByLabel("Policy title").fill("Updated security policy");
    await expect(
      edit.getByText(/Clarify the reporting responsibilities/),
    ).toBeAttached();
  });
}
