import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";
import { CloseIncidentDialog } from "./close-incident-dialog";
import { incidentSchema } from "../schemas/report-incident-schema";
import { ApiError } from "@/lib/api/api-error";
const mocks = vi.hoisted(() => ({
  query: vi.fn(),
  mutate: vi.fn(),
  success: vi.fn(),
  refetch: vi.fn(),
  pending: false,
}));
vi.mock("../hooks/use-incident-closure", () => ({
  useIncidentClosure: mocks.query,
  useCloseIncident: () => ({
    mutateAsync: mocks.mutate,
    isPending: mocks.pending,
  }),
}));
vi.mock("@/components/feedback/toast", () => ({
  useToast: () => ({ success: mocks.success }),
}));
const id = "00000000-0000-4000-8000-000000000010";
const at = "2026-01-01T00:00:00Z";
const incident = incidentSchema.parse({
  id,
  incidentCode: "INC-TEST",
  title: "Suspicious access",
  description: null,
  category: null,
  severity: "medium",
  status: "lessons_learned",
  occurredAt: null,
  detectedAt: null,
  confirmedAt: null,
  closedAt: null,
  createdAt: at,
  updatedAt: at,
  classified: true,
  classificationCount: 0,
  lastClassification: null,
  currentAssignment: null,
  createdBy: null,
  relatedCounts: { actions: 0, assets: 0, controls: 0, evidence: 0, risks: 0 },
});
const review = {
  status: "lessons_learned",
  expectedUpdatedAt: at,
  canClose: true,
  restriction: null,
  closedAt: null,
  closure: null,
};
const summary = "Recovery verified and required response records reviewed.";
beforeEach(() => {
  cleanup();
  vi.clearAllMocks();
  mocks.pending = false;
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
  };
  mocks.query.mockReturnValue({
    data: review,
    isPending: false,
    isError: false,
    refetch: mocks.refetch,
  });
  mocks.mutate.mockResolvedValue({ changed: true, closedAt: at });
});
async function fill() {
  const user = userEvent.setup();
  await user.click(screen.getByLabelText("Closure summary"));
  await user.paste(summary);
  await user.click(screen.getByRole("checkbox"));
  return user;
}
it("requires confirmation and refreshes to real closure without F5", async () => {
  const { rerender } = render(
    <CloseIncidentDialog incident={incident} onClose={vi.fn()} />,
  );
  expect(screen.getByRole("button", { name: "Close incident" })).toBeDisabled();
  const user = await fill();
  await user.click(screen.getByRole("button", { name: "Close incident" }));
  await waitFor(() =>
    expect(mocks.mutate).toHaveBeenCalledWith({
      id,
      values: { summary, confirmed: true },
      expectedUpdatedAt: at,
    }),
  );
  mocks.query.mockReturnValue({
    data: {
      ...review,
      status: "closed",
      canClose: false,
      closedAt: at,
      closure: {
        id,
        recordedAt: at,
        summary,
        closedBy: { id, name: "Officer" },
      },
    },
    isPending: false,
    isError: false,
  });
  rerender(<CloseIncidentDialog incident={incident} onClose={vi.fn()} />);
  expect(screen.getByText(summary)).toBeVisible();
  expect(screen.getByText("Officer")).toBeVisible();
  expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
});
it("uses backend restrictions and never fakes closure history", () => {
  mocks.query.mockReturnValue({
    data: { ...review, canClose: false, restriction: "Save findings first." },
    isPending: false,
    isError: false,
  });
  render(<CloseIncidentDialog incident={incident} onClose={vi.fn()} />);
  expect(screen.getByText("Save findings first.")).toBeVisible();
  expect(screen.getByLabelText("Closure summary")).toBeDisabled();
  expect(screen.queryByText("CLS-2026-0004")).not.toBeInTheDocument();
});
it("retains input on stale failure and requires reconfirmation", async () => {
  mocks.mutate.mockRejectedValue(
    new ApiError("Incident changed. Review again.", 409, "CONFLICT"),
  );
  render(<CloseIncidentDialog incident={incident} onClose={vi.fn()} />);
  const user = await fill();
  await user.click(screen.getByRole("button", { name: "Close incident" }));
  await waitFor(() => expect(screen.getByRole("checkbox")).not.toBeChecked());
  expect(screen.getByLabelText("Closure summary")).toHaveValue(summary);
  expect(screen.getByText("Incident changed. Review again.")).toBeVisible();
});
it("offers retry on load error", async () => {
  mocks.query.mockReturnValue({
    isPending: false,
    isError: true,
    refetch: mocks.refetch,
  });
  render(<CloseIncidentDialog incident={incident} onClose={vi.fn()} />);
  await userEvent.click(screen.getByRole("button", { name: "Retry" }));
  expect(mocks.refetch).toHaveBeenCalled();
});
it("protects pending submissions and cancel", () => {
  mocks.pending = true;
  render(<CloseIncidentDialog incident={incident} onClose={vi.fn()} />);
  expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
  expect(screen.getByLabelText("Closure summary")).toBeDisabled();
});
