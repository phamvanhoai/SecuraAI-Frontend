import { expect, test } from "@playwright/test";

const id = "00000000-0000-4000-8000-000000000010";
const userId = "00000000-0000-4000-8000-000000000001";
const asset = {
  id,
  assetCode: "TEST-ASSET",
  name: "Public service",
  assetType: "SERVER",
  criticality: "low",
  dataClassification: "public",
  status: "active",
  owner: null,
  businessService: null,
  description: null,
  createdAt: "2026-10-02T00:00:00Z",
  updatedAt: "2026-10-02T00:00:00Z",
};

for (const width of [375, 768, 1440]) {
  test(`classification validates, previews and saves at ${width}px`, async ({
    page,
    context,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await context.addCookies([
      {
        name: "securaai_access",
        value: "classification-browser-test",
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
              id: userId,
              email: "officer@example.test",
              fullName: "Security Officer",
              status: "active",
              mustChangePassword: false,
              roles: [{ code: "SECURITY_OFFICER", name: "Security Officer" }],
              permissions: ["assets.read", "assets.update"],
            },
          },
        },
      }),
    );
    await page.route("**/api/assets?*", (route) =>
      route.fulfill({
        json: {
          success: true,
          data: {
            items: [asset],
            pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
          },
        },
      }),
    );
    await page.route(`**/api/assets/${id}`, (route) =>
      route.fulfill({
        json: {
          success: true,
          data: {
            ...asset,
            archivedAt: null,
            createdBy: null,
            dependencies: [],
            controls: [],
            eventSources: [],
            risks: [],
            incidents: [],
            classification: null,
          },
        },
      }),
    );
    await page.route(
      `**/api/assets/${id}/classify-criticality`,
      async (route) => {
        expect(route.request().postDataJSON()).toEqual({
          confidentialityImpact: 1,
          integrityImpact: 1,
          availabilityImpact: 5,
          businessImpact: 1,
          dataClassification: "public",
          dataClassificationBasis:
            "Only approved public information is handled; no sensitive records are stored.",
          rationale:
            "An outage stops the primary public service and essential operations.",
        });
        await route.fulfill({
          json: {
            success: true,
            data: {
              assetId: id,
              previousCriticality: "low",
              criticality: "critical",
              previousDataClassification: "public",
              dataClassification: "public",
              score: 5,
              methodVersion: "SECURAAI-ASSET-IMPACT-v1",
              changed: true,
              classifiedAt: "2026-10-02T00:00:00Z",
            },
          },
        });
      },
    );
    await page.goto("/assets");
    const actions = page.getByRole("button", {
      name: "Actions for TEST-ASSET",
    });
    await actions.scrollIntoViewIfNeeded();
    await actions.focus();
    await actions.press("Enter");
    await page
      .getByRole("button", { name: "Classify asset", exact: true })
      .click();
    const dialog = page.getByRole("dialog", {
      name: "Classify Asset",
    });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByLabel("Confidentiality impact")).toHaveValue("");
    await dialog
      .getByRole("button", { name: "Save classification", exact: true })
      .click();
    await expect(
      dialog.getByText(/Explain the assessment basis/),
    ).toBeVisible();
    for (const label of [
      "Confidentiality impact",
      "Integrity impact",
      "Business impact",
    ])
      await dialog.getByLabel(label).fill("1");
    await dialog.getByLabel("Availability impact").fill("5");
    await expect(dialog.getByText(/Calculated preview:/)).toContainText(
      "5 — Critical",
    );
    await dialog
      .getByLabel("Criticality assessment basis")
      .fill(
        "An outage stops the primary public service and essential operations.",
      );
    await dialog
      .getByLabel("Data classification basis")
      .fill(
        "Only approved public information is handled; no sensitive records are stored.",
      );
    const bounds = await dialog.boundingBox();
    expect(bounds?.width).toBeLessThanOrEqual(width);
    await dialog
      .getByRole("button", { name: "Save classification", exact: true })
      .click();
    await expect(dialog).not.toBeVisible();
    await expect(
      page.getByText("Asset classified", { exact: true }),
    ).toBeVisible();
  });
}
