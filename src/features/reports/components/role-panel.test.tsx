import { render, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RolePanel, type RolePanelKind } from "./role-panel";

describe.each([
  ["security-officer", "Panel Chuyên viên ATTT"],
  ["employee", "Panel Nhân viên"],
  ["executive-auditor", "Panel Lãnh đạo / Kiểm toán"],
] as const)("%s panel", (kind, heading) => {
  it("renders a complete role dashboard", () => {
    const view = render(<RolePanel kind={kind satisfies RolePanelKind} />);
    const page = within(view.container);
    expect(
      page.getByRole("heading", { level: 1, name: heading }),
    ).toBeVisible();
    expect(page.getByRole("heading", { name: "Truy cập nhanh" })).toBeVisible();
    view.unmount();
  });
});
