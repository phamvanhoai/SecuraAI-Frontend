import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";
import { ClassificationHistory } from "./classification-history";

const mocks = vi.hoisted(() => ({ query: vi.fn(), refetch: vi.fn() }));
vi.mock("../hooks/use-incidents", () => ({
  useClassificationHistory: mocks.query,
}));
const data = {
  items: [
    {
      id: "entry",
      classifiedAt: "2026-10-09T00:00:00Z",
      classifiedBy: { name: "Officer" },
      previousSeverity: "medium",
      severity: "high",
      rationale: "Business impact increased.",
    },
  ],
  pagination: { totalPages: 2 },
};
beforeEach(() => {
  vi.clearAllMocks();
  mocks.query.mockReturnValue({
    isPending: false,
    isError: false,
    data,
    refetch: mocks.refetch,
  });
});
it("shows transitions, officer and rationale and paginates", async () => {
  render(<ClassificationHistory incidentId="incident" />);
  expect(screen.getByText("medium → high")).toBeInTheDocument();
  expect(screen.getByText("Business impact increased.")).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Next" }));
  expect(mocks.query).toHaveBeenLastCalledWith("incident", 2);
});
it("shows loading and empty states", () => {
  mocks.query.mockReturnValue({ isPending: true });
  const view = render(<ClassificationHistory incidentId="incident" />);
  expect(screen.getByRole("status")).toHaveTextContent("Loading");
  mocks.query.mockReturnValue({
    isPending: false,
    isError: false,
    data: { ...data, items: [] },
  });
  view.rerender(<ClassificationHistory incidentId="incident" />);
  expect(screen.getByText(/No classification history yet/)).toBeInTheDocument();
});
it("offers retry on error", async () => {
  mocks.query.mockReturnValue({
    isPending: false,
    isError: true,
    refetch: mocks.refetch,
  });
  render(<ClassificationHistory incidentId="incident" />);
  await userEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(mocks.refetch).toHaveBeenCalledOnce();
});
