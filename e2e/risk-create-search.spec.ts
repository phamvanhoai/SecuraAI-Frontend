import { expect, test } from "@playwright/test";

const ownerId = "00000000-0000-4000-8000-000000000001";
const serviceId = "00000000-0000-4000-8000-000000000002";
for (const width of [375, 768, 1440]) {
  test(`Create Risk remote search and scope reset at ${width}px`, async ({
    page,
    context,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await context.addCookies([
      {
        name: "securaai_access",
        value: "browser-test",
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
              id: ownerId,
              email: "officer@example.test",
              fullName: "Security Officer",
              status: "active",
              mustChangePassword: false,
              roles: [{ code: "SECURITY_OFFICER", name: "Security Officer" }],
              permissions: ["risks.read", "risks.create"],
            },
          },
        },
      }),
    );
    await page.route("**/api/risks?*", (route) =>
      route.fulfill({
        json: {
          success: true,
          data: {
            items: [],
            pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
          },
        },
      }),
    );
    const searches: string[] = [];
    await page.route("**/api/risks/create-options?*", (route) => {
      const url = new URL(route.request().url());
      expect(url.searchParams.get("limit")).toBe("10");
      const q = url.searchParams.get("q") ?? "";
      searches.push(q);
      return route.fulfill({
        json: {
          success: true,
          data: {
            owners: [
              {
                id: ownerId,
                fullName: "Employee",
                email: "employee@example.test",
                role: "employee",
              },
            ],
            assets: Array.from({ length: q ? 1 : 10 }, (_, i) => ({
              id: `00000000-0000-4000-8000-${String(i + 10).padStart(12, "0")}`,
              code: `AST-${i}`,
              name: q || `Asset ${i}`,
              criticality: null,
            })),
            businessServices: [
              {
                id: serviceId,
                name: "Customer service",
                description: null,
                assetCount: 1,
              },
            ],
          },
        },
      });
    });
    let submitted: unknown;
    await page.route("**/api/risks", (route) => {
      submitted = route.request().postDataJSON();
      return route.fulfill({
        json: {
          success: true,
          data: {
            id: serviceId,
            riskCode: "TEST-RSK-001",
            title: "Customer data exposure",
            status: "open",
            createdAt: "2026-10-03T00:00:00Z",
          },
        },
      });
    });
    await page.goto("/risks");
    await page
      .getByRole("button", { name: "Create Risk", exact: true })
      .click();
    const dialog = page.getByRole("dialog", { name: "Create Risk" });
    const asset = dialog.getByRole("combobox", { name: "Asset", exact: true });
    await asset.click();
    await expect(dialog.getByRole("listbox").getByRole("option")).toHaveCount(
      10,
    );
    await asset.fill("Database");
    await expect.poll(() => searches.includes("Database")).toBe(true);
    await expect(dialog.getByRole("listbox").getByRole("option")).toHaveCount(
      1,
    );
    await asset.press("ArrowDown");
    await asset.press("Enter");
    await expect(asset).toHaveValue("AST-0 — Database");
    await dialog
      .getByLabel("Risk scope", { exact: true })
      .selectOption("business_service");
    const service = dialog.getByRole("combobox", {
      name: "Business service",
      exact: true,
    });
    await expect(service).toHaveValue("");
    await service.click();
    await dialog
      .getByRole("option", { name: "Customer service (1 active assets)" })
      .click();
    const owner = dialog.getByRole("combobox", {
      name: "Risk owner",
      exact: true,
    });
    await owner.fill("Employee");
    await expect.poll(() => searches.includes("Employee")).toBe(true);
    await expect(
      dialog
        .getByRole("listbox")
        .getByRole("option", { name: /Employee — employee/ }),
    ).toBeVisible();
    await owner.press("ArrowDown");
    await owner.press("Enter");
    await dialog
      .getByLabel("Risk title", { exact: true })
      .fill("Customer data exposure");
    await dialog
      .getByLabel("Context and scope", { exact: true })
      .fill("Customer records require a risk review.");
    await dialog.getByLabel("Review date", { exact: true }).fill("2030-01-15");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await dialog
      .getByRole("button", { name: "Create Risk", exact: true })
      .click();
    await expect(dialog).not.toBeVisible();
    expect(submitted).toMatchObject({
      ownerUserId: ownerId,
      scope: { type: "business_service", businessServiceId: serviceId },
    });
    await expect(page.getByText("Risk created", { exact: true })).toBeVisible();
  });
}
