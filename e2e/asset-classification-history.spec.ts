import { expect, test } from "@playwright/test";

const id = "00000000-0000-4000-8000-000000000010";
const userId = "00000000-0000-4000-8000-000000000001";
const before = {
  confidentialityImpact: 1,
  integrityImpact: 2,
  availabilityImpact: 3,
  businessImpact: 2,
  criticality: "medium",
  dataClassification: "public",
  rationale: "Previous assessment: service interruption is recoverable.",
  dataClassificationBasis: "Only approved public information is handled.",
  methodVersion: "SECURAAI-ASSET-IMPACT-v1",
  dataClassificationMethodVersion: "SECURAAI-DATA-CLASSIFICATION-v1",
  assessedBy: userId,
  assessedAt: "2026-10-01T00:00:00Z",
};
const after = {
  ...before,
  availabilityImpact: 5,
  criticality: "critical",
  rationale: "An outage now stops essential business operations.",
  assessedAt: "2026-10-26T12:00:00Z",
};
for (const width of [375, 768, 1440]) {
  test(`classification History preserves edits and refreshes at ${width}px`, async ({
    page,
    context,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    if (width === 768)
      await page.addInitScript(() =>
        localStorage.setItem("securaai-theme", "dark"),
      );
    await context.addCookies([
      {
        name: "securaai_access",
        value: "classification-browser-test",
        domain: "127.0.0.1",
        path: "/",
      },
    ]);
    let saved = false;
    let archived = false;
    // Keep unrelated dashboard requests away from a real backend during this fixture-based smoke test.
    await page.route("**/api/**", (route) =>
      route.fulfill({
        status: 503,
        json: {
          success: false,
          error: {
            code: "SERVICE_UNAVAILABLE",
            message: "Outside smoke-test scope",
          },
        },
      }),
    );
    const asset = () => ({
      id,
      assetCode: "TEST-CLASSIFY",
      name: "Public service",
      assetType: "SERVER",
      criticality: saved ? "critical" : "medium",
      dataClassification: "public",
      status: archived ? "archived" : "active",
      owner: null,
      businessService: null,
      description: null,
      createdAt: "2026-10-01T00:00:00Z",
      updatedAt: saved ? after.assessedAt : before.assessedAt,
    });
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
            items: [asset()],
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
            ...asset(),
            archivedAt: archived ? after.assessedAt : null,
            createdBy: null,
            dependencies: [],
            eventSources: [],
            controls: [],
            risks: [],
            incidents: [],
            classification: {
              ...(saved ? after : before),
              assessedBy: { id: userId, fullName: "Officer", inactive: false },
            },
          },
        },
      }),
    );
    await page.route(
      `**/api/assets/${id}/classify-criticality/history?*`,
      (route) =>
        route.fulfill({
          json: {
            success: true,
            data: {
              items: saved
                ? [
                    {
                      id: userId,
                      actor: { id: userId, fullName: "Demo officer" },
                      occurredAt: after.assessedAt,
                      before,
                      after,
                    },
                  ]
                : [],
              pagination: {
                page: 1,
                limit: 10,
                total: saved ? 1 : 0,
                totalPages: saved ? 1 : 0,
              },
            },
          },
        }),
    );
    await page.route(
      `**/api/assets/${id}/classify-criticality`,
      async (route) => {
        expect(route.request().postDataJSON()).toMatchObject({
          availabilityImpact: 5,
          rationale: after.rationale,
        });
        saved = true;
        await route.fulfill({
          json: {
            success: true,
            data: {
              assetId: id,
              previousCriticality: "medium",
              previousDataClassification: "public",
              criticality: "critical",
              dataClassification: "public",
              score: 5,
              methodVersion: before.methodVersion,
              changed: true,
              classifiedAt: after.assessedAt,
            },
          },
        });
      },
    );
    await page.goto("/assets");
    const open = async (label: string) => {
      const trigger = page.getByRole("button", {
        name: "Actions for TEST-CLASSIFY",
      });
      await trigger.scrollIntoViewIfNeeded();
      await trigger.focus();
      await trigger.press("Enter");
      await page.getByRole("button", { name: label, exact: true }).click();
    };
    await open("Classify asset");
    const dialog = page.getByRole("dialog", { name: "Classify Asset" });
    await dialog.getByLabel("Availability impact").fill("5");
    await dialog
      .getByLabel("Criticality assessment basis")
      .fill(after.rationale);
    await dialog.getByRole("tab", { name: "Classify Asset" }).focus();
    await page.keyboard.press("ArrowRight");
    await expect(
      dialog.getByText("No classification history recorded."),
    ).toBeVisible();
    await page.keyboard.press("Home");
    await expect(dialog.getByLabel("Availability impact")).toHaveValue("5");
    await dialog.getByRole("button", { name: "Save classification" }).click();
    await expect(dialog).not.toBeVisible();
    await open("Classify asset");
    await dialog.getByRole("tab", { name: "History (1)" }).click();
    await dialog.getByText("View changes").click();
    await expect(
      dialog
        .getByRole("region", { name: "Previous classification" })
        .getByText(before.rationale),
    ).toBeVisible();
    await expect(
      dialog
        .getByRole("region", { name: "New classification" })
        .getByText(after.rationale),
    ).toBeVisible();
    expect((await dialog.boundingBox())?.width).toBeLessThanOrEqual(width);
    await page.screenshot({
      path: `test-results/asset-classification-history-${width}.png`,
      fullPage: true,
    });
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
    if (width === 1440) {
      archived = true;
      await page.reload();
      await open("Classification history");
      await expect(
        dialog.getByRole("tab", { name: "History (1)" }),
      ).toHaveAttribute("aria-selected", "true");
      await expect(
        dialog.getByRole("tab", { name: "Classify Asset" }),
      ).toBeDisabled();
      await expect(
        dialog.getByRole("button", { name: "Save classification" }),
      ).toHaveCount(0);
    }
  });
}
