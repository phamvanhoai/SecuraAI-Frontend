import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getRiskCreateOptions } from "../api/get-risk-create-options";
import { RiskOptionPicker } from "./risk-option-picker";

vi.mock("../api/get-risk-create-options", () => ({
  getRiskCreateOptions: vi.fn(),
}));
const result = {
  assets: [],
  businessServices: [],
  owners: [
    {
      id: "owner",
      fullName: "Employee",
      email: "employee@example.test",
      role: "employee",
    },
  ],
};
afterEach(cleanup);
beforeEach(() => {
  vi.mocked(getRiskCreateOptions).mockReset();
  vi.mocked(getRiskCreateOptions).mockResolvedValue(result);
});
function Fixture() {
  const [value, setValue] = useState("");
  return (
    <>
      <label htmlFor="owner">Risk owner</label>
      <RiskOptionPicker
        id="owner"
        kind="owner"
        value={value}
        onChange={setValue}
        onBlur={() => {}}
        inputRef={null}
        enabled
        invalid={false}
      />
      <output data-testid="selected">{value}</output>
    </>
  );
}
function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  render(
    <QueryClientProvider client={client}>
      <Fixture />
    </QueryClientProvider>,
  );
  return screen.getByRole("combobox", { name: "Risk owner" });
}
describe("Risk remote option picker", () => {
  it("loads only when opened and picks an ID with the keyboard", async () => {
    const input = setup();
    expect(getRiskCreateOptions).not.toHaveBeenCalled();
    fireEvent.focus(input);
    await screen.findByRole("option", { name: /Employee — employee/ });
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(screen.getByTestId("selected")).toHaveTextContent("owner");
    expect(input).toHaveValue("Employee — employee@example.test");
  });
  it("debounces remote search, hides old options, and never treats text as a selection", async () => {
    const input = setup();
    fireEvent.focus(input);
    await screen.findByRole("option");
    fireEvent.change(input, { target: { value: "Emp" } });
    fireEvent.change(input, { target: { value: "Employee" } });
    expect(screen.queryByRole("option")).not.toBeInTheDocument();
    expect(screen.getByTestId("selected")).toBeEmptyDOMElement();
    await waitFor(() =>
      expect(getRiskCreateOptions).toHaveBeenLastCalledWith(
        expect.any(AbortSignal),
        "Employee",
      ),
    );
    expect(
      vi.mocked(getRiskCreateOptions).mock.calls.map((call) => call[1]),
    ).not.toContain("Emp");
  });
  it("retains a selected ID on another search and permits explicit clearing", async () => {
    const input = setup();
    fireEvent.focus(input);
    fireEvent.click(await screen.findByRole("option"));
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "Other" } });
    expect(screen.getByTestId("selected")).toHaveTextContent("owner");
    fireEvent.keyDown(input, { key: "Escape" });
    expect(input).toHaveValue("Employee — employee@example.test");
    fireEvent.focus(input);
    fireEvent.click(screen.getByRole("button", { name: "Clear selection" }));
    expect(screen.getByTestId("selected")).toBeEmptyDOMElement();
  });
  it("provides empty, error and retry states", async () => {
    vi.mocked(getRiskCreateOptions).mockRejectedValueOnce(
      new Error("unavailable"),
    );
    vi.mocked(getRiskCreateOptions).mockResolvedValue({
      assets: [],
      businessServices: [],
      owners: [],
    });
    const input = setup();
    fireEvent.focus(input);
    fireEvent.click(await screen.findByRole("button", { name: "Retry" }));
    await screen.findByText(/No matching options/);
  });
  it("never displays more than ten options", async () => {
    vi.mocked(getRiskCreateOptions).mockResolvedValue({
      ...result,
      owners: Array.from({ length: 12 }, (_, i) => ({
        ...result.owners[0],
        id: `owner-${i}`,
        fullName: `Employee ${i}`,
        email: "test@example.test",
        role: "employee",
      })),
    });
    const input = setup();
    fireEvent.focus(input);
    await waitFor(() => expect(screen.getAllByRole("option")).toHaveLength(10));
    expect(screen.getByText(/Up to 10 shown/)).toBeInTheDocument();
  });
});
