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
});
