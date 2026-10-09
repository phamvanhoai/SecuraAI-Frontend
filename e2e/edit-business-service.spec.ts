import { expect, test } from "@playwright/test";
const id = "00000000-0000-4000-8000-000000000010";
const timestamp = "2026-10-07T00:00:00.000Z";
const initial = { id, name: "Customer Support Service", description: "Existing purpose", status: "active", owner: { id, fullName: "Former owner", inactive: true }, linkedAssetsCount: 3, createdAt: timestamp, updatedAt: timestamp };
test.beforeEach(async ({ page, context }) => {
  await context.addCookies([{ name: "securaai_access", value: "service-edit-test", domain: "127.0.0.1", path: "/" }]);
  await page.route("**/api/auth/session", route => route.fulfill({ json: { success: true, data: { user: { id, email: "officer@example.test", fullName: "Security Officer", status: "active", mustChangePassword: false, roles: [{ code: "SECURITY_OFFICER", name: "Security Officer" }], permissions: ["assets.read", "business-services.read", "business-services.update"] } } } }));
  await page.route("**/api/business-services/owner-options*", route => route.fulfill({ json: { success: true, data: { items: [] } } }));
});
for (const width of [375, 768, 1024, 1440]) {
  test(`metadata edit retains owner and links at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    let service = { ...initial }; let writes = 0;
    await page.route("**/api/business-services?*", route => route.fulfill({ json: { success: true, data: { items: [service], pagination: { page: 1, limit: 10, total: 1, totalPages: 1 } } } }));
    await page.route(`**/api/business-services/${id}`, route => {
      if (route.request().method() === "PATCH") {
        const input = route.request().postDataJSON();
        expect(input).toEqual({ name: "Support Service Renamed", description: "Existing purpose", ownerUserId: id, expectedUpdatedAt: timestamp });
        writes++; service = { ...service, name: input.name, updatedAt: "2026-10-07T00:01:00.000Z" };
      }
      return route.fulfill({ json: { success: true, data: service } });
    });
    await page.goto("/assets/business-services"); await page.getByRole("button", { name: "Actions for Customer Support Service" }).click(); await page.getByRole("button", { name: "Edit Customer Support Service" }).click();
    const dialog = page.getByRole("dialog", { name: "Edit Business Service" });
    await expect(dialog.getByLabel("Service name (required)")).toHaveValue(initial.name);
    await expect(dialog.getByText(/Inactive — retained/)).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Save changes" })).toBeDisabled();
    await dialog.getByLabel("Service name (required)").fill("Support Service Renamed");
    await dialog.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.getByText("Support Service Renamed", { exact: true })).toBeVisible();
    await expect(page.getByText("Business service updated", { exact: true })).toBeVisible(); expect(writes).toBe(1);
    expect(service.linkedAssetsCount).toBe(3); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}
test("stale edit retains draft and blocks save until reopen", async ({ page }) => {
  await page.route("**/api/business-services?*", route => route.fulfill({ json: { success: true, data: { items: [initial], pagination: { page: 1, limit: 10, total: 1, totalPages: 1 } } } }));
  await page.route(`**/api/business-services/${id}`, route => route.request().method() === "PATCH" ? route.fulfill({ status: 409, json: { success: false, error: { code: "BUSINESS_SERVICE_STALE", message: "Stale" } } }) : route.fulfill({ json: { success: true, data: initial } }));
  await page.goto("/assets/business-services"); await page.getByRole("button", { name: "Actions for Customer Support Service" }).click(); await page.getByRole("button", { name: "Edit Customer Support Service" }).click();
  const dialog = page.getByRole("dialog", { name: "Edit Business Service" });
  await dialog.getByLabel("Service name (required)").fill("Draft name"); await dialog.getByRole("button", { name: "Save changes" }).click();
  await expect(dialog.getByText(/Close Edit and reopen/)).toBeVisible(); await expect(dialog.getByLabel("Service name (required)")).toHaveValue("Draft name"); await expect(dialog.getByRole("button", { name: "Save changes" })).toBeDisabled();
  await page.keyboard.press("Escape"); await expect(dialog.getByRole("button", { name: "Keep editing" })).toBeVisible();
  await dialog.getByRole("button", { name: "Discard changes" }).click(); await expect(page.getByRole("dialog")).toHaveCount(0);
});
test("inactive services have no Edit action", async ({ page }) => {
  await page.route("**/api/business-services?*", route => route.fulfill({ json: { success: true, data: { items: [{ ...initial, status: "inactive" }], pagination: { page: 1, limit: 10, total: 1, totalPages: 1 } } } }));
  await page.goto("/assets/business-services"); await expect(page.getByText(initial.name, { exact: true })).toBeVisible(); await page.getByRole("button", { name: "Actions for Customer Support Service" }).click(); await expect(page.getByRole("button", { name: "Edit Customer Support Service" })).toHaveCount(0);
});
