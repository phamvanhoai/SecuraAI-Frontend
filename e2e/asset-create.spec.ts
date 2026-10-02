import { expect, test } from "@playwright/test";

for (const width of [375, 768, 1440]) {
  test(`create identity without implicit classification at ${width}px`, async ({ page, context }) => {
    await page.setViewportSize({ width, height: 900 });
    await context.addCookies([{ name: "securaai_access", value: "asset-create-browser-test", domain: "127.0.0.1", path: "/" }]);
    const asset = { id: "00000000-0000-4000-8000-000000000010", assetCode: "TEST-NEW", name: "New server", assetType: "SERVER", criticality: null, dataClassification: null, status: "active", owner: null, businessService: null, description: null, createdAt: "2026-10-02T00:00:00Z", updatedAt: "2026-10-02T00:00:00Z" };
    let created = false;
    await page.route("**/api/auth/session", route => route.fulfill({ json: { success: true, data: { user: { id: "00000000-0000-4000-8000-000000000001", email: "officer@example.test", fullName: "Security Officer", status: "active", mustChangePassword: false, roles: [{ code: "SECURITY_OFFICER", name: "Security Officer" }], permissions: ["assets.read", "assets.create", "assets.update"] } } } }));
    await page.route("**/api/assets/create-options", route => route.fulfill({ json: { success: true, data: { owners: [], businessServices: [], assets: [], eventSources: [] } } }));
    await page.route("**/api/assets?*", route => route.fulfill({ json: { success: true, data: { items: created ? [asset] : [], pagination: { page: 1, limit: 10, total: created ? 1 : 0, totalPages: 1 } } } }));
    await page.route("**/api/assets", async route => {
      expect(route.request().method()).toBe("POST");
      expect(route.request().postDataJSON()).toEqual({ assetCode: "TEST-NEW", name: "New server", assetType: "SERVER", dependencies: [], eventSourceIds: [] });
      created = true;
      await route.fulfill({ status: 201, json: { success: true, data: asset } });
    });
    await page.goto("/assets");
    await page.getByRole("button", { name: "Add asset", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Create IT Asset" });
    for (const label of ["Criticality", "Data classification", "Business service"]) await expect(dialog.getByLabel(label, { exact: true })).toHaveCount(0);
    await dialog.getByLabel("Asset code").fill("test-new");
    await dialog.getByLabel("Asset name").fill("New server");
    await dialog.getByLabel("Asset type").fill("SERVER");
    expect((await dialog.boundingBox())?.width).toBeLessThanOrEqual(width);
    await dialog.getByRole("button", { name: "Create asset", exact: true }).click();
    await expect(dialog).not.toBeVisible();
    const row = page.getByRole("row").filter({ hasText: "TEST-NEW" });
    await expect(row).toBeVisible();
    await expect(row).toContainText("—");
    await expect(row).not.toContainText("medium");
    await expect(row).not.toContainText("public");
  });
}
