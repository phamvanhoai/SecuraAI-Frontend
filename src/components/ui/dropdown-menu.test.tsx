import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DropdownMenu } from "./dropdown-menu";

describe("DropdownMenu", () => {
  it("closes when clicking outside", () => {
    const { container } = render(
      <div>
        <DropdownMenu label="Tài khoản" open>
          <span>Nội dung menu</span>
        </DropdownMenu>
        <button type="button">Bên ngoài</button>
      </div>,
    );

    const menu = container.querySelector("details");
    expect(menu).toHaveAttribute("open");
    fireEvent.pointerDown(screen.getByRole("button", { name: "Bên ngoài" }));
    expect(menu).not.toHaveAttribute("open");
  });

  it("closes with Escape and restores focus to the trigger", () => {
    const { container } = render(
      <DropdownMenu label="Tài khoản" open>
        <span>Nội dung menu</span>
      </DropdownMenu>,
    );

    fireEvent.keyDown(document, { key: "Escape" });
    const trigger = container.querySelector("summary");
    const menu = container.querySelector("details");
    expect(trigger).toHaveFocus();
    expect(menu).not.toHaveAttribute("open");
  });
});
