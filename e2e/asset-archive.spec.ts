import { expect, test } from "@playwright/test";
const id = "00000000-0000-4000-8000-000000000010";
const userId = "00000000-0000-4000-8000-000000000001";
for (const width of [375, 768, 1440]) {
  test(`archive confirmation, dependency conflict and detail at ${width}px`, async ({ page, context }) => {
    await page.setViewportSize({ width, height: 900 });
    await context.addCookies([{ name: "securaai_access", value: "archive-browser-test", domain: "127.0.0.1", path: "/" }]);
    await page.route("**/api/auth/session", (route) => route.fulfill({ json: { success: true, data: { user: {
      id: userId, email: "officer@example.test", fullName: "Security Officer", status: "active", mustChangePassword: false,
      roles: [{ code: "SECURITY_OFFICER", name: "Security Officer" }], permissions: ["assets.read", "assets.update", "assets.delete"],
    } } } }));
    let archived = false;
    let blocked = true;
    const asset = () => ({ id, assetCode: "TEST-ARCHIVE", name: "Archive test server", assetType: "SERVER", criticality: "low", dataClassification: "internal",
      status: archived ? "archived" : "active", owner: null, businessService: null, description: null,
      createdAt: "2026-10-02T00:00:00Z", updatedAt: "2026-10-02T00:00:00Z" });
    await page.route("**/api/assets?*", (route) => route.fulfill({ json: { success: true, data: { items: [asset()], pagination: { page: 1, limit: 10, total: 1, totalPages: 1 } } } }));
    await page.route(`**/api/assets/${id}`, async (route) => {
      if (route.request().method() === "DELETE") {
        expect(route.request().postDataJSON()).toEqual({ reason: "Replaced by managed infrastructure" });
        if (blocked) {
          blocked = false;
          await route.fulfill({ status: 409, json: { success: false, error: { code: "ASSET_HAS_ACTIVE_DEPENDENCIES", message: "Cannot archive: AST-A depends on this asset. Resolve dependencies first." } } });
        } else { archived = true; await route.fulfill({ status: 204 }); }
      } else await route.fulfill({ json: { success: true, data: {
        ...asset(), archivedAt: archived ? "2026-10-02T00:00:00Z" : null,
        archivedBy: archived ? { id: userId, fullName: "Archiving Officer", inactive: false } : null,
        archiveReason: archived ? "Replaced by managed infrastructure" : null,
        createdBy: null, dependencies: [], controls: [], eventSources: [], risks: [], incidents: [], classification: null,
      } } });
    });
    await page.goto("/assets");
    const actions = page.getByRole("button", { name: "Actions for TEST-ARCHIVE" });
    await actions.scrollIntoViewIfNeeded(); await actions.focus(); await actions.press("Enter");
    await page.getByRole("button", { name: "Archive asset", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Archive Asset" });
    await dialog.getByLabel(/Enter code/).fill("TEST-ARCHIVE");
    const submit = dialog.getByRole("button", { name: "Archive Asset", exact: true });
    await expect(submit).toBeDisabled();
    await dialog.getByLabel(/Archive reason/).fill("Replaced by managed infrastructure");
    expect((await dialog.boundingBox())?.width).toBeLessThanOrEqual(width);
    await submit.click();
    await expect(dialog.getByText(/AST-A depends/)).toBeVisible();
    // Mock the administrator resolving the dependency before retry.
    await submit.click(); await expect(dialog).not.toBeVisible();
    await actions.scrollIntoViewIfNeeded(); await actions.click();
    await expect(page.getByRole("button", { name: "Archive asset", exact: true })).toHaveCount(0);
    await page.getByRole("button", { name: "View details", exact: true }).click();
    await expect(page.getByText("Archiving Officer", { exact: true })).toBeVisible();
    await expect(page.getByText("Replaced by managed infrastructure", { exact: true })).toBeVisible();
  });
}
