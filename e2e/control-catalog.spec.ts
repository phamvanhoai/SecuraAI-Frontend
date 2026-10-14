import { expect, test, type Page } from "@playwright/test";
const id = "00000000-0000-4000-8000-000000000010";
const actorId = "00000000-0000-4000-8000-000000000001";
const baseControl = {
  id,
  controlCode: "CTRL-DEMO",
  name: "Demo MFA control",
  description: "Require MFA for administrative access",
  owner: null,
  applicability: "under_review",
  implementationStatus: "not_implemented",
  createdAt: "2026-10-07T00:00:00Z",
  updatedAt: "2026-10-07T00:00:00Z",
  configurationLocked: false,
  revision: "a".repeat(64),
};
async function session(
  page: Page,
  permissions = [
    "compliance.assess-controls",
    "controls.create",
    "controls.update",
  ],
) {
  await page
    .context()
    .addCookies([
      {
        name: "securaai_access",
        value: "control-catalog-browser-test",
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
            id: actorId,
            email: "officer@example.test",
            fullName: "Security Officer",
            status: "active",
            mustChangePassword: false,
            roles: [{ code: "SECURITY_OFFICER", name: "Security Officer" }],
            permissions,
          },
        },
      },
    }),
  );
}
for (const width of [375, 768, 1024, 1440]) {
  test(`Create/Edit preserves the assessment workflow at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 });
    await session(page);
    let control = { ...baseControl };
    let created = false;
    await page.route("**/api/compliance/control-assessments?*", (route) =>
      route.fulfill({
        json: {
          success: true,
          data: {
            items: created
              ? [{ ...control, evidence: [], assessments: [] }]
              : [],
            pagination: {
              page: 1,
              limit: 20,
              total: created ? 1 : 0,
              totalPages: created ? 1 : 0,
            },
          },
        },
      }),
    );
    await page.route("**/api/compliance/controls/owner-options?*", (route) =>
      route.fulfill({ json: { success: true, data: { items: [] } } }),
    );
    await page.route("**/api/compliance/controls", async (route) => {
      expect(route.request().method()).toBe("POST");
      expect(route.request().postDataJSON()).toEqual({
        controlCode: "CTRL-DEMO",
        name: "Demo MFA control",
        description: baseControl.description,
        ownerUserId: null,
        applicability: "under_review",
        implementationStatus: "not_implemented",
      });
      created = true;
      await route.fulfill({
        status: 201,
        json: { success: true, data: control },
      });
    });
    await page.route(`**/api/compliance/controls/${id}`, async (route) => {
      if (route.request().method() === "PATCH") {
        const data = route.request().postDataJSON();
        expect(data).not.toHaveProperty("controlCode");
        expect(data).not.toHaveProperty("effectiveness");
        expect(data.expectedRevision).toBe(baseControl.revision);
        expect(data.reason).toBe("Correct the control name for demo");
        control = {
          ...control,
          name: "Demo MFA control updated",
          revision: "b".repeat(64),
        };
      }
      await route.fulfill({ json: { success: true, data: control } });
    });
    await page.goto("/controls");
    if (width === 1024) await page.getByRole("button", { name: "Chuyển giao diện sáng hoặc tối" }).click();
    await page
      .getByRole("button", { name: "Create control", exact: true })
      .click();
    const create = page.getByRole("dialog", {
      name: "Create Control",
      exact: true,
    });
    await create
      .getByLabel("Control code *", { exact: true })
      .fill("CTRL-DEMO");
    await create
      .getByLabel("Control name *", { exact: true })
      .fill("Demo MFA control");
    await create
      .getByLabel("Purpose and description *", { exact: true })
      .fill(baseControl.description);
    expect((await create.boundingBox())?.width).toBeLessThanOrEqual(width);
    await create
      .getByRole("button", { name: "Create control", exact: true })
      .click();
    await expect(create).not.toBeVisible();
    const row = page.getByRole("row").filter({ hasText: "CTRL-DEMO" });
    await expect(row).toContainText("Not assessed");
    await expect(
      row.getByRole("button", { name: "Assess", exact: true }),
    ).toBeDisabled();
    await row.getByRole("button", { name: "Edit", exact: true }).click();
    const edit = page.getByRole("dialog", {
      name: "Edit Control",
      exact: true,
    });
    await expect(
      edit.getByLabel("Control code *", { exact: true }),
    ).toHaveAttribute("readonly", "");
    await expect(
      edit.getByRole("button", { name: "Save control", exact: true }),
    ).toBeDisabled();
    await edit
      .getByLabel("Control name *", { exact: true })
      .fill("Demo MFA control updated");
    await edit
      .getByLabel("Reason for change *", { exact: true })
      .fill("Correct the control name for demo");
    if (width === 375 || width === 1440 || width === 1024) await page.screenshot({ path: testInfo.outputPath("control-edit.png") });
    await edit
      .getByRole("button", { name: "Save control", exact: true })
      .click();
    await expect(edit).not.toBeVisible();
    await expect(row).toContainText("Demo MFA control updated");
    await expect(row).toContainText("Not assessed");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  });
}
test("Control Owner can assess but cannot create or edit the catalog", async ({
  page,
}) => {
  await session(page, ["compliance.assess-controls"]);
  await page.route("**/api/compliance/control-assessments?*", (route) =>
    route.fulfill({
      json: {
        success: true,
        data: {
          items: [{ ...baseControl, evidence: [], assessments: [] }],
          pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
        },
      },
    }),
  );
  await page.goto("/controls");
  await expect(
    page.getByRole("row").filter({ hasText: "CTRL-DEMO" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Create control", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Edit", exact: true }),
  ).toHaveCount(0);
});
test("Assessed Control locks its configuration; stale Edit preserves the draft", async ({ page }) => {
  await session(page);
  const control = { ...baseControl, configurationLocked: true };
  await page.route("**/api/compliance/control-assessments?*", route => route.fulfill({ json: { success: true, data: { items: [{ ...control, evidence: [], assessments: [] }], pagination: { page: 1, limit: 20, total: 1, totalPages: 1 } } } }));
  await page.route("**/api/compliance/controls/owner-options?*", route => route.fulfill({ json: { success: true, data: { items: [] } } }));
  let writes = 0;
  await page.route(`**/api/compliance/controls/${id}`, async route => {
    if (route.request().method() === "PATCH") { writes++; await route.fulfill({ status: 409, json: { success: false, error: { code: "CONTROL_STALE", message: "Control changed. Close and reopen Edit before saving" } } }); }
    else await route.fulfill({ json: { success: true, data: control } });
  });
  await page.goto("/controls");
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Edit Control", exact: true });
  await expect(dialog.getByLabel("Applicability *", { exact: true })).toBeDisabled();
  await expect(dialog.getByLabel("Implementation status *", { exact: true })).toBeDisabled();
  await dialog.getByLabel("Control name *", { exact: true }).fill("Corrected MFA description");
  await dialog.getByLabel("Reason for change *", { exact: true }).fill("Correct the control metadata");
  await dialog.getByRole("button", { name: "Save control", exact: true }).click();
  await expect(dialog.getByText(/Control changed/)).toBeVisible();
  await expect(dialog.getByLabel("Control name *", { exact: true })).toHaveValue("Corrected MFA description");
  await expect(dialog.getByRole("button", { name: "Save control", exact: true })).toBeDisabled();
  expect(writes).toBe(1);
  page.once("dialog", dialog => dialog.dismiss());
  await page.keyboard.press("Escape");
  await expect(dialog).toBeVisible();
  page.once("dialog", dialog => dialog.accept());
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(dialog).not.toBeVisible();
});
