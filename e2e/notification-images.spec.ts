import { expect, test } from "@playwright/test";

test("attaches real image files in both send forms and displays a received notification image", async ({ page }) => {
  test.setTimeout(90_000);
  const id = "11111111-1111-4111-8111-111111111111";
  const recipientId = "22222222-2222-4222-8222-222222222222";
  let sentImage = "";
  let sentInSystem = false;
  let emailSent = false;
  let readAt: string | null = null;
  await page.context().addCookies([{ name: "securaai_access", value: "e2e-notification-images", domain: "127.0.0.1", path: "/", httpOnly: true }]);
  await page.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/api/auth/session") return route.fulfill({ json: { success: true, data: { user: { id, email: "admin@example.test", fullName: "Test Admin", status: "active", mustChangePassword: false, roles: [{ code: "ADMIN", name: "Administrator" }], permissions: ["users.read", "notifications.send", "notifications.send-email", "notifications.preferences"] } } } });
    if (path === "/api/users") return route.fulfill({ json: { success: true, data: { items: [{ id: recipientId, email: "recipient@example.test", fullName: "Security User", status: "active", department: null, roles: [] }], pagination: { page: 1, limit: 20, total: 1, totalPages: 1 }, summary: { active: 1, inactive: 0, locked: 0, disabled: 0 } } } });
    if (path === "/api/notifications" || path === "/api/notifications/email") {
      const body: unknown = route.request().postDataJSON();
      expect(body).toMatchObject({ images: [expect.objectContaining({ name: "chart.png", dataUrl: expect.stringMatching(/^data:image\/png;base64,/) })] });
      if (typeof body !== "object" || body === null || !("images" in body) || !Array.isArray(body.images)) throw new Error("Missing images");
      const first: unknown = body.images[0];
      if (typeof first !== "object" || first === null || !("dataUrl" in first) || typeof first.dataUrl !== "string") throw new Error("Missing image contents");
      expect(first.dataUrl.length).toBeLessThanOrEqual(262166);
      sentImage = first.dataUrl;
      if (path.endsWith("/email")) emailSent = true; else sentInSystem = true;
      return route.fulfill({ status: 201, json: { success: true, data: { id, recipientCount: 1, sentAt: new Date().toISOString(), queuedAt: new Date().toISOString(), sentCount: 1, failedCount: 0 } } });
    }
    const item = { id: recipientId, notificationId: id, title: "Image notification", message: "See chart", images: [{ name: "chart.png", index: 0 }], sender: "Test Admin", priority: "IMPORTANT", createdAt: new Date().toISOString(), readAt };
    if (path === `/api/notifications/inbox/${recipientId}/read`) { readAt = new Date().toISOString(); return route.fulfill({ json: { success: true, data: { read: true } } }); }
    if (path === `/api/notifications/inbox/${recipientId}`) return route.fulfill({ json: { success: true, data: item } });
    if (path === "/api/notifications/inbox") {
      const unreadOnly = new URL(route.request().url()).searchParams.get("unread") === "true";
      return route.fulfill({ json: { success: true, data: { items: sentInSystem && (!unreadOnly || !readAt) ? [item] : [], unreadCount: sentInSystem && !readAt ? 1 : 0 } } });
    }
    if (path.endsWith("/images/0")) return route.fulfill({ contentType: "image/png", body: Buffer.from(sentImage.split(",")[1] ?? "", "base64") });
    return route.fulfill({ json: { success: true, data: { items: [], total: 0 } } });
  });
  await page.goto("/notifications");
  const dataUrl = await page.evaluate(() => { const canvas = document.createElement("canvas"); canvas.width = 320; canvas.height = 200; const context = canvas.getContext("2d"); if (!context) throw new Error("Canvas unavailable"); context.fillStyle = "#1769f6"; context.fillRect(0, 0, 320, 200); return canvas.toDataURL("image/png"); });
  const file = { name: "chart.png", mimeType: "image/png", buffer: Buffer.from(dataUrl.split(",")[1] ?? "", "base64") };
  await page.getByRole("tab", { name: "Send in-system", exact: true }).click();
  await page.getByLabel("Notification title").fill("Image notification");
  await page.getByLabel("Message", { exact: true }).fill("See chart");
  await page.getByLabel("Attach message images").setInputFiles(file);
  await expect(page.getByAltText("chart.png")).toBeVisible();
  await page.getByRole("button", { name: "Send notification", exact: true }).click();
  await expect(page.getByText("Notification sent", { exact: true })).toBeVisible();
  expect(sentInSystem).toBe(true);
  await page.getByRole("tab", { name: "Send email", exact: true }).click();
  await page.getByText("Security User", { exact: true }).click();
  await page.getByLabel("Subject", { exact: true }).fill("Email chart");
  await page.getByLabel("Email message").fill("See chart");
  await page.getByLabel("Attach message images").setInputFiles(file);
  await expect(page.getByAltText("chart.png")).toBeVisible();
  await page.getByRole("button", { name: "Send email", exact: true }).click();
  await expect(page.getByText("Email notification sent", { exact: true })).toBeVisible();
  expect(emailSent).toBe(true);
  await page.reload();
  await expect(page.getByRole("img", { name: "chart.png", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "View details", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Image notification" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByAltText("chart.png")).toBeVisible();
  await expect(dialog.getByAltText("chart.png")).toHaveJSProperty("naturalWidth", 320);
  expect(readAt).toBeNull();
  await dialog.getByRole("button", { name: "Close", exact: true }).click();
  await expect.poll(() => readAt).not.toBeNull();
  await page.getByRole("button", { name: "Notifications, 0 unread", exact: true }).click();
  await expect(page.getByText("No unread notifications.")).toBeVisible();
  await expect(page.getByRole("region", { name: "Recent notifications" }).getByText("Image notification", { exact: true })).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "View details", exact: true })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole("img", { name: "chart.png", exact: true })).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
