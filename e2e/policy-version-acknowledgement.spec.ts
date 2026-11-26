import { expect, test } from "@playwright/test";

const policyId = "00000000-0000-4000-8000-000000000010";
const versionId = "00000000-0000-4000-8000-000000000011";
const previousAcknowledgement = {
  versionId: "00000000-0000-4000-8000-000000000012",
  versionNumber: "1.0", acknowledgedAt: "2026-10-01T00:00:00.000Z",
};
for (const width of [390, 768, 1440]) {
  test(`Employee confirms v2 separately while retaining v1 history at ${width}px`, async ({ page, context }) => {
    await page.setViewportSize({ width, height: 1000 });
    await context.addCookies([{ name: "securaai_access", value: "test-session", domain: "127.0.0.1", path: "/" }]);
    await page.route("**/api/auth/session", (route) => route.fulfill({ json: { success: true, data: { user: {
      id: "00000000-0000-4000-8000-000000000001", email: "employee@example.test", fullName: "Employee",
      status: "active", mustChangePassword: false, roles: [{ code: "EMPLOYEE", name: "Employee" }], permissions: ["policies.acknowledge"],
    } } } }));
    let acknowledgedAt: string | null = null;
    const item = () => ({ policyId, policyCode: "ISP-001", title: "Information Security Policy", description: null,
      versionId, versionNumber: "2.0", effectiveDate: "2026-11-26T00:00:00.000Z", publishedAt: "2026-11-26T00:00:00.000Z",
      acknowledgedAt, previousAcknowledgement, changeSummary: "Require MFA for remote access.",
    });
    await page.route("**/api/compliance/policies/acknowledgements/mine?*", (route) => route.fulfill({ json: { success: true, data: {
      items: [item()], pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
    } } }));
    await page.route(`**/api/compliance/policies/${policyId}/versions/${versionId}/acknowledgement`, (route) => route.fulfill({ json: { success: true, data: {
      policyId, policyCode: "ISP-001", title: "Information Security Policy", description: null,
      version: { id: versionId, versionNumber: "2.0", content: "All employees must use MFA when accessing the corporate VPN.",
        changeSummary: item().changeSummary, effectiveDate: item().effectiveDate, publishedAt: item().publishedAt },
      acknowledgedAt, previousAcknowledgement,
    } } }));
    await page.route(`**/api/compliance/policies/${policyId}/versions/${versionId}/acknowledgements`, async (route) => {
      expect(route.request().method()).toBe("POST");
      acknowledgedAt = "2026-11-26T01:00:00.000Z";
      await route.fulfill({ json: { success: true, data: { policyId, versionId, acknowledgedAt, alreadyAcknowledged: false } } });
    });
    await page.goto("/policies");
    await expect(page.getByText("New version — reading required")).toBeVisible();
    await expect(page.getByText(/Previously acknowledged v1.0/)).toBeVisible();
    await page.getByRole("button", { name: "Read policy" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText(/The current published version is v2.0/)).toBeVisible();
    await expect(dialog.getByText("Require MFA for remote access.")).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Confirm reading" })).toBeDisabled();
    await dialog.getByRole("checkbox").check();
    await dialog.getByRole("button", { name: "Confirm reading" }).click();
    await expect(dialog).not.toBeVisible();
    await expect(page.getByText("Acknowledged", { exact: true }).first()).toBeVisible();
    await page.getByRole("button", { name: "Read policy" }).click();
    await expect(dialog.getByText(/You acknowledged v2.0/)).toBeVisible();
    await expect(dialog.getByText(/You acknowledged v1.0/)).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Confirm reading" })).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
  });
}
