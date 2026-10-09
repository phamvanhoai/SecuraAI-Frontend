import {
  cleanup,
  render,
  screen,
  within,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";
import { RecordEradicationActionDialog } from "./record-eradication-action-dialog";
import { incidentSchema } from "../schemas/report-incident-schema";
const mocks = vi.hoisted(() => ({
  query: vi.fn(),
  mutateAsync: vi.fn(),
  reset: vi.fn(),
  refetch: vi.fn(),
  success: vi.fn(),
}));
vi.mock("../hooks/use-eradication-actions", () => ({
  useEradicationHistory: mocks.query,
  useRecordEradicationAction: () => ({
    mutateAsync: mocks.mutateAsync,
    reset: mocks.reset,
    isPending: false,
    isError: false,
  }),
}));
vi.mock("@/components/feedback/toast", () => ({
  useToast: () => ({ success: mocks.success }),
}));
const id = "00000000-0000-4000-8000-000000000010";
const incident = incidentSchema.parse({
  id,
  incidentCode: "INC-TEST",
  title: "Suspicious access",
  description: null,
  category: null,
  severity: "medium",
  status: "eradication",
  occurredAt: null,
  detectedAt: null,
  confirmedAt: null,
  closedAt: null,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
  classified: true,
  classificationCount: 0,
  lastClassification: null,
  currentAssignment: null,
  createdBy: null,
  relatedCounts: { actions: 0, assets: 0, controls: 0, evidence: 0, risks: 0 },
});
beforeEach(() => {
  cleanup();
  vi.clearAllMocks();
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
  };
  mocks.mutateAsync.mockResolvedValue({});
  mocks.query.mockReturnValue({
    isPending: false,
    isError: false,
    refetch: mocks.refetch,
    data: { items: [], pagination: { totalPages: 0 } },
  });
});
it("preserves inputs between tabs and opens history after save", async () => {
  render(
    <RecordEradicationActionDialog incident={incident} onClose={vi.fn()} />,
  );
  const user = userEvent.setup();
  const dialog = within(screen.getByRole("dialog"));
  await user.type(
    dialog.getByLabelText("Eradication action"),
    "Removed malicious scheduled task and verified the host is clean.",
  );
  await user.type(dialog.getByLabelText("Performed at"), "2026-01-01T09:30");
  await user.click(dialog.getByRole("tab", { name: "History" }));
  expect(dialog.getByText(/No eradication actions/)).toBeVisible();
  await user.keyboard("{ArrowLeft}");
  expect(dialog.getByLabelText("Eradication action")).toHaveValue(
    "Removed malicious scheduled task and verified the host is clean.",
  );
  await user.click(dialog.getByRole("button", { name: "Record action" }));
  await waitFor(() =>
    expect(mocks.mutateAsync).toHaveBeenCalledWith({
      id,
      values: {
        description:
          "Removed malicious scheduled task and verified the host is clean.",
        performedAt: "2026-01-01T09:30",
      },
    }),
  );
  await waitFor(() =>
    expect(dialog.getByRole("tab", { name: "History" })).toHaveAttribute(
      "aria-selected",
      "true",
    ),
  );
});
it("opens closed incidents read-only and offers retry", async () => {
  mocks.query.mockReturnValue({
    isPending: false,
    isError: true,
    refetch: mocks.refetch,
  });
  render(
    <RecordEradicationActionDialog
      incident={{ ...incident, status: "closed" }}
      onClose={vi.fn()}
    />,
  );
  expect(screen.getByRole("tab", { name: "Record action" })).toBeDisabled();
  await userEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(mocks.refetch).toHaveBeenCalled();
});
it("shows history performer and loading state", async () => {
  mocks.query.mockReturnValue({ isPending: true });
  const view = render(
    <RecordEradicationActionDialog incident={incident} onClose={vi.fn()} />,
  );
  await userEvent.click(screen.getByRole("tab", { name: "History" }));
  expect(screen.getByRole("status")).toHaveTextContent(
    "Loading eradication history",
  );
  mocks.query.mockReturnValue({
    isPending: false,
    isError: false,
    data: {
      items: [
        {
          id,
          description: "Isolated affected host.",
          performedAt: "2026-01-01T00:00:00Z",
          performedBy: { name: "Officer" },
        },
      ],
      pagination: { totalPages: 1 },
    },
  });
  view.rerender(
    <RecordEradicationActionDialog incident={incident} onClose={vi.fn()} />,
  );
  expect(screen.getByText("Isolated affected host.")).toBeVisible();
  expect(within(screen.getByRole("list")).getByText(/Officer/)).toBeVisible();
});
