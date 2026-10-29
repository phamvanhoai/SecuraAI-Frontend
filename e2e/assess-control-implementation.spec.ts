import { expect, test, type Page } from "@playwright/test";
const id = "00000000-0000-4000-8000-000000000010";
const actorId = "00000000-0000-4000-8000-000000000001";
async function setup(page: Page) {
  await page.context().addCookies([
    {
      name: "securaai_access",
      value: "assessment-browser-test",
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
            email: "owner@example.test",
            fullName: "Control Owner",
            status: "active",
            mustChangePassword: false,
            roles: [{ code: "EMPLOYEE", name: "Employee" }],
            permissions: ["compliance.assess-controls"],
          },
        },
      },
    }),
  );
  await page.route("**/api/compliance/control-assessments?*", (route) =>
    route.fulfill({
      json: {
        success: true,
        data: {
          items: [
            {
              id,
              controlCode: "CTRL-DEMO",
              name: "Appointment access restriction",
              description: "Limit access to assigned appointments",
              applicability: "applicable",
              implementationStatus: "planned",
              owner: { id: actorId, fullName: "Control Owner" },
              evidence: [
                {
                  id: actorId,
                  name: "Authorization test",
                  source: "Access tests",
                  collectedAt: "2026-10-01T00:00:00Z",
                  reviewedAt: null,
                },
              ],
              assessments: [
                {
                  id: actorId,
                  testMethod: "Inspect authorization",
                  result: "partially_effective",
                  effectiveness: 60,
                  notes: "Initial authorization tests completed.",
                  assessedAt: "2026-10-01T00:00:00Z",
                  assessor: { id: actorId, fullName: "Control Owner" },
                },
              ],
            },
          ],
          pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
        },
      },
    }),
  );
  await page.goto("/controls");
  const trigger = page.getByRole("button", { name: "Actions for CTRL-DEMO" });
  await trigger.scrollIntoViewIfNeeded();
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  await trigger.focus();
  await page.keyboard.press("Enter");
  await page.getByRole("button", { name: "Assess", exact: true }).click();
}
for (const width of [375, 768, 1440]) {
  test(`owner updates implementation with assessment at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 });
    let writes = 0;
    await page.route(
      `**/api/compliance/controls/${id}/assessments`,
      async (route) => {
        writes++;
        expect(route.request().postDataJSON()).toMatchObject({
          result: "partially_effective",
          effectiveness: 60,
          implementationStatus: "partially_implemented",
          expectedImplementationStatus: "planned",
          implementationChangeReason:
            "Appointment authorization is now deployed to the pilot team.",
        });
        await route.fulfill({
          status: 201,
          json: { success: true, data: { assessmentId: actorId } },
        });
      },
    );
    await setup(page);
    const dialog = page.getByRole("dialog", { name: "Assess CTRL-DEMO" });
    await dialog.getByRole("tab", { name: "History (1)" }).click();
    await expect(
      dialog.getByText("Initial authorization tests completed."),
    ).toBeVisible();
    await dialog
      .getByRole("tab", { name: "Assess control", exact: true })
      .click();
    const result = dialog.getByLabel("Testing result", { exact: true });
    await expect(result).toHaveRole("combobox");
    await expect(result).toHaveValue("partially_effective");
    const effectiveness = dialog.getByLabel("Effectiveness (%)", {
      exact: true,
    });
    for (const [score, value] of [
      ["0", "ineffective"],
      ["49.99", "ineffective"],
      ["50", "partially_effective"],
      ["79.99", "partially_effective"],
      ["80", "effective"],
      ["100", "effective"],
      ["", ""],
      ["60", "partially_effective"],
    ] as const) {
      await effectiveness.fill(score);
      await expect(result).toHaveValue(value);
    }
    await result.selectOption("partially_effective");
    await expect(effectiveness).toHaveValue("60");
    await result.selectOption("effective");
    await expect(effectiveness).toHaveValue("80");
    await result.selectOption("ineffective");
    await expect(effectiveness).toHaveValue("0");
    await result.selectOption("partially_effective");
    await expect(effectiveness).toHaveValue("50");
    await effectiveness.fill("60");

    await dialog
      .getByLabel("Implementation status *", { exact: true })
      .selectOption("partially_implemented");
    await expect(
      dialog.getByLabel("Reason for implementation change *"),
    ).toHaveAttribute("required", "");
    await dialog
      .getByLabel("Test method", { exact: true })
      .fill("Inspect appointment authorization");
    await dialog
      .getByLabel("Assessment notes", { exact: true })
      .fill("Pilot users can access only their assigned appointments.");
    await dialog
      .getByRole("button", { name: "Save assessment", exact: true })
      .click();
    expect(writes).toBe(0);
    await dialog
      .getByLabel("Reason for implementation change *")
      .fill("Appointment authorization is now deployed to the pilot team.");
    await page.screenshot({
      path: testInfo.outputPath("assessment-implementation.png"),
    });
    await dialog
      .getByRole("button", { name: "Save assessment", exact: true })
      .click();
    await expect(dialog).not.toBeVisible();
    expect(writes).toBe(1);
  });
}
test("stale configuration preserves draft and requires reopening", async ({
  page,
}) => {
  let writes = 0;
  await page.route(
    `**/api/compliance/controls/${id}/assessments`,
    async (route) => {
      writes++;
      await route.fulfill({
        status: 409,
        json: {
          success: false,
          error: {
            code: "CONTROL_STALE",
            message:
              "Implementation status changed. Close and reopen Assess Control before saving",
          },
        },
      });
    },
  );
  await setup(page);
  const dialog = page.getByRole("dialog", { name: "Assess CTRL-DEMO" });
  await dialog
    .getByLabel("Test method", { exact: true })
    .fill("Inspect appointment authorization");
  await dialog
    .getByLabel("Assessment notes", { exact: true })
    .fill("Pilot users can access only their assigned appointments.");
  await dialog
    .getByRole("button", { name: "Save assessment", exact: true })
    .click();
  await expect(dialog.getByText(/Close and reopen/)).toBeVisible();
  await expect(
    dialog.getByLabel("Assessment notes", { exact: true }),
  ).toHaveValue("Pilot users can access only their assigned appointments.");
  await expect(
    dialog.getByRole("button", { name: "Save assessment", exact: true }),
  ).toBeDisabled();
  expect(writes).toBe(1);
});
