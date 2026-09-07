import { render, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ToastProvider } from "@/components/feedback/toast";
import SettingsPage from "./page";

describe("SettingsPage", () => {
  it("opens every settings section", async () => {
    const user = userEvent.setup();
    const view = render(
      <ToastProvider>
        <SettingsPage />
      </ToastProvider>,
    );
    const page = within(view.container);

    for (const [tab, heading] of [
      ["Tổ chức", "Thông tin tổ chức"],
      ["Bảo mật", "Chính sách phiên đăng nhập"],
      ["Thông báo", "Quy tắc thông báo"],
      ["Tích hợp", "Tích hợp hệ thống"],
      ["API và khóa", "Khóa API"],
    ] as const) {
      await user.click(page.getByRole("button", { name: tab }));
      expect(page.getByRole("heading", { name: heading })).toBeVisible();
    }

    view.unmount();
  });
});
