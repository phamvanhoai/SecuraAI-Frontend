import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RiskTextInput, RiskTextarea } from "./risk-text-fields";

afterEach(cleanup);

describe.each([
  ["title", RiskTextInput, 100],
  ["basis", RiskTextarea, 2000],
] as const)("Risk text boundary: %s", (_name, Field, maximum) => {
  it("preserves pasted content, reports overflow and prevents form submission until corrected", async () => {
    const user = userEvent.setup();
    const submit = vi.fn((event: React.FormEvent) => event.preventDefault());
    render(
      <form onSubmit={submit}>
        <label htmlFor="risk-text">Text</label>
        <Field id="risk-text" maxLength={maximum} aria-describedby="help" />
        <p id="help">Required information</p>
        <button type="submit">Save</button>
      </form>,
    );
    const field = screen.getByLabelText("Text");
    await user.click(field);
    await user.paste("A".repeat(maximum + 1));
    expect(field).toHaveValue("A".repeat(maximum + 1));
    expect(screen.getByRole("alert")).toHaveTextContent(
      `Use at most ${maximum.toLocaleString("en-US")} characters.`,
    );
    expect(field).toHaveAttribute("aria-invalid", "true");
    expect(field).toHaveAccessibleDescription(
      /Required information.*Use at most/,
    );
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(submit).not.toHaveBeenCalled();
    await user.clear(field);
    await user.paste("A".repeat(maximum));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(submit).toHaveBeenCalledOnce();
  });
});
