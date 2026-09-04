import { expect, test } from "@playwright/test";

const pages = [
  ["/dashboard", "Dashboard tổng quan"],
  ["/users", "Quản lý người dùng"],
  ["/roles", "Vai trò và quyền"],
  ["/assets", "Quản lý tài sản"],
  ["/risks", "Đánh giá rủi ro"],
  ["/incidents", "Quản lý sự cố"],
  ["/controls", "Thư viện kiểm soát"],
  ["/compliance", "Tuân thủ"],
  ["/audits", "Nhật ký kiểm toán"],
  ["/reports", "Báo cáo"],
  ["/notifications", "Thông báo"],
  ["/files", "Quản lý tệp"],
  ["/settings", "Cài đặt hệ thống"],
  ["/alerts", "Cảnh báo an toàn thông tin"],
  ["/policies", "Quản lý chính sách"],
  ["/training", "Đào tạo nhận thức"],
  ["/anomaly-monitoring", "Giám sát bất thường"],
  ["/ai-models", "Mô hình AI"],
  ["/event-logs", "Log và sự kiện"],
  ["/custom-dashboard", "Dashboard tùy chỉnh"],
  ["/profile", "Hồ sơ cá nhân"],
] as const;

test.beforeEach(async ({ context }) => {
  await context.addCookies([
    {
      name: "securaai_access",
      value: "visual-test-session",
      domain: "127.0.0.1",
      path: "/",
    },
  ]);
});

test("renders every static product page", async ({ page }) => {
  for (const [path, heading] of pages) {
    await page.goto(path);
    await expect(
      page.getByRole("heading", { level: 1, name: heading }),
    ).toBeVisible();
    await expect(
      page.getByText("Dữ liệu mẫu phục vụ thiết kế giao diện", { exact: true }),
    ).toBeVisible();
  }
});

test("dashboard and users pages remain usable on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.goto("/users");
  await expect(
    page.getByPlaceholder("Tìm theo tên, email, mã nhân viên"),
  ).toBeVisible();
});

test("shows a success toast when saving settings", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto("/settings");
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "Lưu thay đổi" }).first().click();
  expect(pageErrors).toEqual([]);
  await expect(page.getByRole("status")).toContainText("Đã lưu thay đổi");
  await expect(page.getByRole("status")).toContainText(
    "Cấu hình mẫu đã được cập nhật trên giao diện.",
  );
  await page.getByRole("button", { name: "Đóng thông báo" }).click();
  await expect(page.getByRole("status")).not.toBeVisible();
});

test("captures review surfaces when requested", async ({ page }) => {
  test.skip(process.env.CAPTURE_UI !== "1", "Visual capture is opt-in");
  await page.setViewportSize({ width: 1536, height: 1024 });
  await page.goto("/dashboard");
  await page.screenshot({
    path: "test-results/static-dashboard.png",
    fullPage: true,
  });
  await page.goto("/users");
  await page.screenshot({
    path: "test-results/static-users.png",
    fullPage: true,
  });
});
