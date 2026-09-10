import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CronBuilder } from "./cron-builder";

describe("CronBuilder component", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders with Simple Mode by default and shows summary", () => {
    const handleChange = vi.fn();
    render(<CronBuilder onChange={handleChange} value="*/15 * * * *" />);

    expect(screen.getByRole("button", { name: /simple mode/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /custom cron/i })).toBeInTheDocument();
    expect(screen.getByText("Schedule Summary")).toBeInTheDocument();
    expect(screen.getByText("Runs every 15 minutes")).toBeInTheDocument();
  });

  it("switches to Custom Cron mode and allows direct editing", () => {
    const handleChange = vi.fn();
    render(<CronBuilder onChange={handleChange} value="0 0 * * *" />);

    // Click Custom Cron tab
    fireEvent.click(screen.getByRole("button", { name: /custom cron/i }));

    // Check custom mode content
    expect(screen.getByText("Minute")).toBeInTheDocument();
    expect(screen.getByText("Hour")).toBeInTheDocument();

    const input = screen.getByRole("textbox");
    expect(input).toHaveValue("0 0 * * *");

    // Change input
    fireEvent.change(input, { target: { value: "0 2 * * *" } });
    expect(handleChange).toHaveBeenCalledWith("0 2 * * *");
  });

  it("selects a preset in Custom Cron mode", () => {
    const handleChange = vi.fn();
    render(<CronBuilder onChange={handleChange} value="* * * * *" />);

    fireEvent.click(screen.getByRole("button", { name: /custom cron/i }));

    const presetBtn = screen.getByRole("button", { name: /daily at midnight/i });
    fireEvent.click(presetBtn);

    expect(handleChange).toHaveBeenCalledWith("0 0 * * *");
  });
});
