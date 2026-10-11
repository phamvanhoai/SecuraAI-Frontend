import { expect, test, type Page } from "@playwright/test";
import {
  addControlEvidenceSchema,
  type ControlEvidenceItem,
} from "../src/features/control-assessments/schemas/control-evidence-schema";
const actorId = "00000000-0000-4000-8000-000000000001";
const controlId = "00000000-0000-4000-8000-000000000010";
const evidenceId = "00000000-0000-4000-8000-000000000011";
const control = {
  id: controlId,
  controlCode: "CTRL-MFA",
  name: "Administrator MFA",
  description: "Require MFA for all administrative accounts",
  applicability: "applicable",
  implementationStatus: "implemented",
  owner: { id: actorId, fullName: "Control Owner" },
  canManageEvidence: true,
};
const candidate: ControlEvidenceItem = {
  id: evidenceId,
  name: "Existing MFA configuration review",
  source: "Configuration audit",
  description:
    "Configuration review confirms the relevant administrative access policy.",
  documentUrl: "https://docs.example.test/reports/mfa-config",
  status: "active",
  usable: true,
  collectedAt: "2020-01-01T00:00:00Z",
  validFrom: null,
  validUntil: null,
  owner: { id: actorId, fullName: "Control Owner" },
  reviewedAt: null,
  reviewedBy: null,
  createdAt: "2020-01-01T00:00:00Z",
  linkedAt: null,
  linkedBy: null,
};
async function prepare(page: Page) {
  await page
    .context()
    .addCookies([
      {
        name: "securaai_access",
        value: "evidence-browser-test",
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
}
for (const width of [375, 768, 1024, 1440]) {
  test(`Add / Link Evidence then assess at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await prepare(page);
    let records: ControlEvidenceItem[] = [];
    let assessed = false;
    await page.route("**/api/compliance/control-assessments?*", (route) =>
      route.fulfill({
        json: {
          success: true,
          data: {
            items: [
              {
                ...control,
                evidence: records.map((item) => ({
                  id: item.id,
                  name: item.name,
                  source: item.source,
                  collectedAt: item.collectedAt,
                  reviewedAt: null,
                })),
                assessments: assessed
                  ? [
                      {
                        id: evidenceId,
                        testMethod:
                          "Verify MFA enforcement using sign-in tests",
                        result: "effective",
                        effectiveness: 100,
                        notes:
                          "All tested administrative accounts required a second factor.",
                        assessedAt: "2020-01-02T00:00:00Z",
                        assessor: { id: actorId, fullName: "Control Owner" },
                      },
                    ]
                  : [],
              },
            ],
            pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
          },
        },
      }),
    );
    await page.route(
      `**/api/compliance/controls/${controlId}/evidence?*`,
      (route) => {
        const url = new URL(route.request().url());
        expect(url.searchParams.get("limit")).toBe("10");
        const available = records.some((item) => item.id === evidenceId)
          ? []
          : [candidate];
        const q = url.searchParams.get("q") ?? "";
        const items = (
          url.searchParams.get("view") === "available" ? available : records
        ).filter((item) => item.name.toLowerCase().includes(q.toLowerCase()));
        return route.fulfill({
          json: {
            success: true,
            data: {
              control: {
                id: controlId,
                controlCode: control.controlCode,
                name: control.name,
              },
              canAdd: true,
              canLink: true,
              items,
              pagination: {
                page: 1,
                limit: 10,
                total: items.length,
                totalPages: items.length ? 1 : 0,
              },
            },
          },
        });
      },
    );
    await page.route(
      `**/api/compliance/controls/${controlId}/evidence`,
      async (route) => {
        const raw: unknown = route.request().postDataJSON();
        const body = addControlEvidenceSchema.parse(raw);
        expect(body).toEqual({
          requestId: expect.stringMatching(/^[a-f0-9-]{36}$/),
          name: "New MFA sign-in report",
          source: "Authentication test",
          description:
            "All administrative accounts tested required a second factor.",
          documentUrl: "https://docs.example.test/reports/mfa-sign-in",
          collectedAt: "2020-01-01T03:20:00.000Z",
          validUntil: null,
        });
        expect(body).not.toHaveProperty("reviewedAt");
        const item = {
          ...candidate,
          id: body.requestId,
          name: body.name,
          source: body.source,
          description: body.description,
          documentUrl: body.documentUrl,
          collectedAt: body.collectedAt,
          linkedAt: "2020-01-02T00:00:00Z",
          linkedBy: { id: actorId, fullName: "Control Owner" },
        };
        records = [...records, item];
        await route.fulfill({
          status: 201,
          json: { success: true, data: { created: true, evidence: item } },
        });
      },
    );
    await page.route(
      `**/api/compliance/controls/${controlId}/evidence-links`,
      async (route) => {
        expect(route.request().postDataJSON()).toEqual({
          evidenceId,
          reason: "Confirms configuration for administrative MFA",
        });
        records = [
          ...records,
          {
            ...candidate,
            linkedAt: "2020-01-02T00:00:00Z",
            linkedBy: { id: actorId, fullName: "Control Owner" },
          },
        ];
        await route.fulfill({
          status: 201,
          json: { success: true, data: { linked: true, evidence: candidate } },
        });
      },
    );
    await page.route(
      `**/api/compliance/controls/${controlId}/assessments`,
      async (route) => {
        expect(route.request().postDataJSON()).toEqual({
          testMethod: "Verify MFA enforcement using sign-in tests",
          result: "effective",
          effectiveness: 100,
          notes: "All tested administrative accounts required a second factor.",
        });
        assessed = true;
        await route.fulfill({
          status: 201,
          json: { success: true, data: { assessmentId: evidenceId } },
        });
      },
    );
    await page.goto("/controls");
    if (width === 1024)
      await page
        .getByRole("button", { name: "Chuyển giao diện sáng hoặc tối" })
        .click();
    const row = page.getByRole("row").filter({ hasText: "CTRL-MFA" });
    await expect(
      row.getByRole("button", { name: "Assess", exact: true }),
    ).toBeDisabled();
    await row.getByRole("button", { name: "Evidence", exact: true }).click();
    const dialog = page.getByRole("dialog", {
      name: "Control Evidence",
      exact: true,
    });
    await expect(dialog.getByText("No evidence linked")).toBeVisible();
    await dialog
      .getByRole("button", { name: "Add evidence", exact: true })
      .click();
    await dialog
      .getByRole("button", { name: "Add and link evidence", exact: true })
      .click();
    await expect(
      dialog.getByLabel("Evidence name *", { exact: true }),
    ).toBeFocused();
    await dialog
      .getByLabel("Evidence name *", { exact: true })
      .fill("New MFA sign-in report");
    await dialog
      .getByLabel("Source *", { exact: true })
      .fill("Authentication test");
    await dialog
      .getByLabel("Results, scope and supporting context *", { exact: true })
      .fill("All administrative accounts tested required a second factor.");
    await dialog
      .getByLabel("Supporting document URL (HTTPS) *", { exact: true })
      .fill("https://docs.example.test/reports/mfa-sign-in");
    await dialog
      .getByLabel("Collected at (UTC+7) *", { exact: true })
      .fill("2020-01-01T10:20");
    if (width === 375 || width === 1440 || width === 1024)
      await page.screenshot({ path: testInfo.outputPath("add-evidence.png") });
    expect((await dialog.boundingBox())?.width).toBeLessThanOrEqual(width);
    await dialog
      .getByRole("button", { name: "Add and link evidence", exact: true })
      .click();
    await expect(
      dialog.getByText("New MFA sign-in report", { exact: true }),
    ).toBeVisible();
    await expect(dialog.getByText(/Not reviewed/)).toBeVisible();
    await expect(row).toContainText("Not assessed");
    await dialog
      .getByRole("button", { name: "Link existing evidence" })
      .click();
    await dialog
      .getByLabel("Search evidence", { exact: true })
      .fill("configuration");
    await dialog.getByRole("button", { name: "Search", exact: true }).click();
    await dialog
      .getByRole("radio", { name: `Select ${candidate.name}` })
      .check();
    await dialog
      .getByLabel("Why does this evidence support the Control? *", {
        exact: true,
      })
      .fill("Confirms configuration for administrative MFA");
    await dialog
      .getByRole("button", { name: "Link selected evidence" })
      .click();
    await expect(
      dialog.getByText(candidate.name, { exact: true }),
    ).toBeVisible();
    await expect(dialog.getByText(/Not reviewed/)).toHaveCount(2);
    await dialog.getByRole("button", { name: "Close", exact: true }).click();
    await expect(dialog).not.toBeVisible();
    await expect(row).toContainText("2 eligible");
    await expect(row).toContainText("Not assessed");
    await row.getByRole("button", { name: "Assess", exact: true }).click();
    const assessment = page.getByRole("dialog", {
      name: "Assess CTRL-MFA",
      exact: true,
    });
    await assessment
      .getByLabel("Test method", { exact: true })
      .fill("Verify MFA enforcement using sign-in tests");
    await assessment
      .getByLabel("Assessment notes", { exact: true })
      .fill("All tested administrative accounts required a second factor.");
    await assessment.getByRole("button", { name: "Save assessment" }).click();
    await expect(assessment).not.toBeVisible();
    await expect(row).toContainText("Effective");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  });
}
test("Evidence reassignment/conflict preserves the draft and blocks repeat writes", async ({
  page,
}) => {
  await prepare(page);
  await page.route("**/api/compliance/control-assessments?*", (route) =>
    route.fulfill({
      json: {
        success: true,
        data: {
          items: [{ ...control, evidence: [], assessments: [] }],
          pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
        },
      },
    }),
  );
  await page.route(
    `**/api/compliance/controls/${controlId}/evidence?*`,
    (route) =>
      route.fulfill({
        json: {
          success: true,
          data: {
            control: {
              id: controlId,
              controlCode: control.controlCode,
              name: control.name,
            },
            canAdd: true,
            canLink: true,
            items: [candidate],
            pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
          },
        },
      }),
  );
  let writes = 0;
  await page.route(
    `**/api/compliance/controls/${controlId}/evidence-links`,
    async (route) => {
      writes++;
      await route.fulfill({
        status: 409,
        json: {
          success: false,
          error: {
            code: "EVIDENCE_NOT_USABLE",
            message: "Evidence is expired. Select another item",
          },
        },
      });
    },
  );
  await page.goto("/controls");
  await page.getByRole("button", { name: "Evidence", exact: true }).click();
  const dialog = page.getByRole("dialog", {
    name: "Control Evidence",
    exact: true,
  });
  await dialog.getByRole("button", { name: "Link existing evidence" }).click();
  await dialog.getByRole("radio", { name: `Select ${candidate.name}` }).check();
  await dialog
    .getByLabel("Why does this evidence support the Control? *", {
      exact: true,
    })
    .fill("Confirms administrative MFA configuration");
  await dialog.getByRole("button", { name: "Link selected evidence" }).click();
  await expect(dialog.getByText(/Evidence is expired/)).toBeVisible();
  await expect(
    dialog.getByRole("button", { name: "Link selected evidence" }),
  ).toBeDisabled();
  await expect(
    dialog.getByLabel("Why does this evidence support the Control? *", {
      exact: true,
    }),
  ).toHaveValue("Confirms administrative MFA configuration");
  expect(writes).toBe(1);
  page.once("dialog", (dialog) => dialog.dismiss());
  await page.keyboard.press("Escape");
  await expect(dialog).toBeVisible();
  page.once("dialog", (dialog) => dialog.accept());
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(dialog).not.toBeVisible();
});
