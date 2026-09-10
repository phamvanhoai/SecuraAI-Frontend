import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button } from "./button";

describe("Button", () => {
  it("is keyboard/click operable", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Lưu</Button>);
    await userEvent.click(screen.getByRole("button", { name: "Lưu" }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("uses stable secondary colors for non-primary actions", () => {
    render(<Button variant="secondary">Cancel</Button>);

    expect(screen.getByRole("button", { name: "Cancel" })).toHaveClass(
      "border-border",
      "bg-surface",
      "text-foreground",
      "hover:bg-neutral-soft",
    );
    expect(screen.getByRole("button", { name: "Cancel" })).not.toHaveClass(
      "hover:bg-brand-strong",
    );
  });

  it("uses semantic danger colors for destructive actions", () => {
    render(<Button variant="danger">Delete</Button>);

    expect(screen.getByRole("button", { name: "Delete" })).toHaveClass(
      "bg-danger",
      "text-white",
      "hover:opacity-90",
    );
    expect(screen.getByRole("button", { name: "Delete" })).not.toHaveClass(
      "hover:bg-brand-strong",
    );
  });
});
