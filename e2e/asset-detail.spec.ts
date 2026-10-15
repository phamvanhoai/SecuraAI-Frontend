import { expect, test } from "@playwright/test";

const id = "00000000-0000-4000-8000-000000000010";
const userId = "00000000-0000-4000-8000-000000000001";
for (const width of [375, 768, 1024, 1440]) {
  for (const theme of ["light", "dark"] as const) {
    test(`asset detail layout and disclosure at ${width}px in ${theme}`, async ({
      page,
      context,
    }, testInfo) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
      await context.addCookies([
        {
          name: "securaai_access",
          value: "detail-browser-test",
          domain: "127.0.0.1",
          path: "/",
        },
      ]);
      const asset = {
        id,
        assetCode: "TEST-DETAIL",
        name: "Customer Identity Platform — Production Authentication Service",
        assetType: "APPLICATION",
        criticality: "critical",
        dataClassification: "confidential",
        status: "active",
        owner: { id: userId, fullName: "Security Officer", inactive: false },
        businessService: {
          id: userId,
          name: "Customer Authentication Service",
          inactive: false,
        },
        description:
          "Production identity platform supporting customer authentication and account management.",
        createdAt: "2026-10-02T00:00:00Z",
        updatedAt: "2026-10-02T00:00:00Z",
      };
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
                permissions: ["assets.read"],
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
              createdBy: asset.owner,
              dependencies: [
                {
                  id: userId,
                  type: "operational",
                  description: null,
                  asset: {
                    id: userId,
                    assetCode: "AST-DB",
                    name: "Customer Database Server",
                    status: "ACTIVE",
                  },
                },
              ],
              controls: [],
              eventSources: [],
              incidents: [],
              risks: [
                {
                  id: userId,
                  code: "RSK-01",
                  title: "Unauthorized access to customer accounts",
                  status: "open",
                },
              ],
              classification: {
                confidentialityImpact: 4,
                integrityImpact: 3,
                availabilityImpact: 5,
                businessImpact: 4,
                rationale:
                  "Unauthorized disclosure exposes private customer records. Loss of availability stops the primary authentication service.",
                dataClassificationBasis:
                  "Customer profiles and non-public contract information require limited authorized access.",
                methodVersion: "SECURAAI-ASSET-IMPACT-v1",
                dataClassificationMethodVersion:
                  "SECURAAI-DATA-CLASSIFICATION-v1",
                assessedAt: "2026-10-02T00:00:00Z",
                assessedBy: asset.owner,
              },
            },
          },
        }),
      );
      await page.goto("/assets");
      const actions = page.getByRole("button", {
        name: "Actions for TEST-DETAIL",
      });
      await actions.scrollIntoViewIfNeeded();
      await actions.focus();
      await actions.press("Enter");
      await page
        .getByRole("button", { name: "View details", exact: true })
        .click();
      const dialog = page.getByRole("dialog");
      await expect(
        dialog.getByRole("region", { name: "Asset overview" }),
      ).toContainText("Customer Authentication Service");
      await expect(dialog.getByLabel("Impact scores")).toContainText(
        "Availability5 / 5",
      );
      await expect(dialog.getByText("No controls linked.")).toBeVisible();
      expect((await dialog.boundingBox())?.width).toBeLessThanOrEqual(width);
      expect(
        await dialog.evaluate(
          (element) => element.scrollWidth <= element.clientWidth,
        ),
      ).toBe(true);
      const summary = dialog.getByText("Methodology and references");
      await summary.focus();
      await summary.press("Enter");
      await expect(dialog.getByText(/FIPS PUB 199/)).toBeVisible();
      await expect(dialog.getByText(/ISO\/IEC 27002:2022/)).toBeVisible();
      await summary.press("Enter");
      await dialog
        .getByRole("region", { name: "Record information" })
        .scrollIntoViewIfNeeded();
      await expect(
        dialog.getByText("Created at", { exact: true }),
      ).toBeVisible();
      await dialog.evaluate((element) => {
        element.scrollTop = 0;
      });
      if (width === 1440)
        await page.screenshot({
          path: testInfo.outputPath("asset-detail.png"),
        });
      await page.keyboard.press("Escape");
      await expect(dialog).not.toBeVisible();
      await expect(actions).toBeFocused();
    });
  }
}
