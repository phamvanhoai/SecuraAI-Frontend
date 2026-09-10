import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DropdownMenu } from "./dropdown-menu";

afterEach(cleanup);

describe("DropdownMenu", () => {
  it("portals menu content outside overflow containers", async () => {
    const { container } = render(
      <DropdownMenu label="Actions" open>
        <button type="button">View details</button>
      </DropdownMenu>,
    );

    const content = await screen.findByRole("button", { name: "View details" });
    expect(container.querySelector("details")?.contains(content)).toBe(false);
    expect(document.body.contains(content)).toBe(true);
  });

  it("anchors an upward-opening menu directly above its trigger", async () => {
    const { container } = render(
      <DropdownMenu label="Actions">
        <button type="button">View details</button>
      </DropdownMenu>,
    );
    const trigger = container.querySelector("summary");
    const menu = container.querySelector("details");
    if (!trigger || !menu) throw new Error("Dropdown trigger was not rendered");
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: 768,
    });
    vi.spyOn(trigger, "getBoundingClientRect").mockReturnValue({
      bottom: 740,
      height: 40,
      left: 900,
      right: 940,
      top: 700,
      width: 40,
      x: 900,
      y: 700,
      toJSON: () => ({}),
    });

    menu.open = true;
    fireEvent(menu, new Event("toggle"));

    const action = await screen.findByRole("button", { name: "View details" });
    expect(action.parentElement).toHaveStyle({ bottom: "76px" });
  });

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
