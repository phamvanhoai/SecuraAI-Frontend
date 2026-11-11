import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { TreatmentActionOwnerPicker } from "./treatment-action-owner-picker";

const owner = {
  id: "owner-1",
  fullName: "Employee",
  email: "employee@example.com",
};
vi.mock("../hooks/use-create-risk-treatment-plan", () => ({
  useRiskTreatmentPlanOptions: (_riskId: string, q: string) => ({
    data: { users: q === "employee@example.com" ? [owner] : [] },
    isFetching: false,
    isError: false,
    refetch: vi.fn(),
  }),
}));
afterEach(cleanup);
it("searches a responsible owner beyond the initial results and retains name/email after selection", () => {
  const change = vi.fn();
  const props = { riskId: "risk", label: "Responsible owner", inputId: "responsible-owner", value: "", users: [], onChange: change };
  const view = render(<TreatmentActionOwnerPicker {...props} />);
  fireEvent.click(screen.getByRole("button", { name: "Responsible owner" }));
  fireEvent.change(screen.getByLabelText("Find owner by name or email"), { target: { value: owner.email } });
  fireEvent.click(screen.getByRole("button", { name: "Search owners" }));
  fireEvent.click(screen.getByRole("button", { name: `${owner.fullName} ${owner.email}` }));
  expect(change).toHaveBeenCalledWith(owner.id, owner);
  view.rerender(<TreatmentActionOwnerPicker {...props} value={owner.id} />);
  expect(screen.getByRole("button", { name: /Responsible owner/ })).toHaveTextContent(`${owner.fullName} — ${owner.email}`);
});
it("preserves an existing owner outside the first results and prevents opening while locked", () => {
  render(<TreatmentActionOwnerPicker riskId="risk" label="Responsible owner" value="existing" selectedOwnerName="Existing owner" users={[]} onChange={vi.fn()} disabled />);
  expect(screen.getByRole("button", { name: "Responsible owner" })).toHaveTextContent("Existing owner");
  expect(screen.getByRole("button", { name: "Responsible owner" })).toBeDisabled();
  expect(screen.queryByLabelText("Find owner by name or email")).not.toBeInTheDocument();
});
it("shows email search results on Enter without submitting the plan and retains the selected owner", () => {
  const change = vi.fn();
  const submit = vi.fn();
  render(
    <form onSubmit={submit}>
      <TreatmentActionOwnerPicker
        riskId="risk-1"
        actionNumber={1}
        value=""
        users={[]}
        onChange={change}
      />
    </form>,
  );
  expect(
    screen.queryByLabelText("Find owner by name or email"),
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Action 1 owner" }));
  const input = screen.getByLabelText("Find owner by name or email");
  fireEvent.change(input, { target: { value: owner.email } });
  fireEvent.keyDown(input, { key: "Enter" });
  fireEvent.click(
    screen.getByRole("button", { name: "Employee employee@example.com" }),
  );
  expect(change).toHaveBeenCalledWith(owner.id, owner);
  expect(submit).not.toHaveBeenCalled();
  expect(
    screen.queryByLabelText("Find owner by name or email"),
  ).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Action 1 owner" })).toHaveFocus();
});

it("closes only the picker with Escape and supports clearing the owner", () => {
  const change = vi.fn();
  render(
    <TreatmentActionOwnerPicker
      riskId="risk"
      actionNumber={1}
      value={owner.id}
      users={[owner]}
      onChange={change}
    />,
  );
  const trigger = screen.getByRole("button", { name: /Action 1 owner/ });
  expect(trigger).toHaveTextContent("Employee — employee@example.com");
  fireEvent.click(trigger);
  fireEvent.keyDown(screen.getByLabelText("Find owner by name or email"), {
    key: "Escape",
  });
  expect(trigger).toHaveAttribute("aria-expanded", "false");
  fireEvent.click(trigger);
  fireEvent.click(screen.getByRole("button", { name: "Unassigned" }));
  expect(change).toHaveBeenCalledWith("", null);
});
