import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Incident } from "../schemas/report-incident-schema";
import { LinkIncidentControlDialog } from "./link-incident-control-dialog";

const mocks = vi.hoisted(() => ({
  mutateAsync: vi.fn(),
  unlinkAsync: vi.fn(),
  success: vi.fn(),
  controlOptions: vi.fn(),
}));

vi.mock("../hooks/use-incidents", () => ({
  useIncidentControlOptions: (
    _id: string | undefined,
    query: { scope: "linked" | "unlinked" },
  ) => {
    mocks.controlOptions(query);
    const linked = {
      id: "11111111-1111-4111-8111-111111111111",
      controlCode: "CTRL-001",
      name: "Multi-factor authentication",
      applicability: "applicable",
      implementationStatus: "implemented",
      linked: true,
    };
    const available = {
      id: "22222222-2222-4222-8222-222222222222",
      controlCode: "CTRL-002",
      name: "Access review",
      applicability: "applicable",
      implementationStatus: "partially_implemented",
      linked: false,
    };
    return {
      data: {
        controls:
          query.scope === "linked"
            ? [linked]
            : [
                available,
                {
                  ...available,
                  id: "33333333-3333-4333-8333-333333333333",
                  controlCode: "CTRL-003",
                },
              ],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      },
      isPending: false,
      isError: false,
    };
  },
  useLinkIncidentToControl: () => ({
    mutateAsync: mocks.mutateAsync,
    isPending: false,
    isError: false,
  }),
  useUnlinkIncidentFromControl: () => ({
    mutateAsync: mocks.unlinkAsync,
    isPending: false,
    isError: false,
  }),
}));
vi.mock("@/components/feedback/toast", () => ({
  useToast: () => ({ success: mocks.success }),
}));

const timestamp = "2026-10-01T00:00:00.000Z";
const incident: Incident = {
  id: "33333333-3333-4333-8333-333333333333",
  incidentCode: "INC-001",
  title: "Suspicious privileged login",
  description: null,
  category: "account_compromise",
  severity: "high",
  status: "in_progress",
  occurredAt: timestamp,
  detectedAt: timestamp,
  confirmedAt: null,
  closedAt: null,
  createdAt: timestamp,
  updatedAt: timestamp,
  classified: true,
  hasAnalysis: false,
  classificationCount: 1,
  lastClassification: null,
  currentAssignment: null,
  createdBy: null,
  relatedCounts: { actions: 0, assets: 0, controls: 1, evidence: 0, risks: 0 },
};

beforeEach(() => {
  vi.clearAllMocks();
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
    configurable: true,
    value: function (this: HTMLDialogElement) {
      this.setAttribute("open", "");
    },
  });
  Object.defineProperty(HTMLDialogElement.prototype, "close", {
    configurable: true,
    value: function (this: HTMLDialogElement) {
      this.removeAttribute("open");
    },
  });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  Reflect.deleteProperty(HTMLDialogElement.prototype, "showModal");
  Reflect.deleteProperty(HTMLDialogElement.prototype, "close");
});

describe("link incident control dialog", () => {
  it("preserves selections when searching available options", () => {
    render(<LinkIncidentControlDialog incident={incident} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole("checkbox", { name: /CTRL-002/ }));
    fireEvent.click(
      screen.getByRole("button", { name: "Search available controls" }),
    );
    expect(screen.getByRole("checkbox", { name: /CTRL-002/ })).toBeChecked();
    expect(
      screen.getByRole("button", { name: "Link selected (1)" }),
    ).toBeEnabled();
  });

  it("links multiple selections and retains only failures for retry", async () => {
    const onClose = vi.fn();
    mocks.mutateAsync
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(new Error("Unavailable"));
    render(<LinkIncidentControlDialog incident={incident} onClose={onClose} />);
    const first = screen.getByRole("checkbox", { name: /CTRL-002/ });
    const second = screen.getByRole("checkbox", { name: /CTRL-003/ });
    fireEvent.click(first);
    fireEvent.click(second);
    expect(
      screen.getByRole("button", { name: "Link selected (2)" }),
    ).toBeEnabled();
    fireEvent.submit(first.closest("form") as HTMLFormElement);
    await waitFor(() =>
      expect(screen.getByText(/Could not link:/)).toHaveTextContent("CTRL-003"),
    );
    expect(mocks.mutateAsync).toHaveBeenCalledTimes(2);
    expect(first).not.toBeChecked();
    expect(second).toBeChecked();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("keeps the dialog open and clears the selection after linking", async () => {
    const onClose = vi.fn();
    mocks.mutateAsync.mockResolvedValue({
      control: { controlCode: "CTRL-002" },
      incident: { incidentCode: "INC-001" },
    });
    render(<LinkIncidentControlDialog incident={incident} onClose={onClose} />);
    const option = screen.getByRole("checkbox", { name: /CTRL-002/ });
    fireEvent.click(option);
    fireEvent.submit(option.closest("form") as HTMLFormElement);
    await waitFor(() => expect(mocks.success).toHaveBeenCalled());
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toHaveAttribute("open");
    expect(option).not.toBeChecked();
  });

  it("shows existing links and only offers controls that are not linked", () => {
    render(<LinkIncidentControlDialog incident={incident} onClose={vi.fn()} />);
    expect(
      screen.getAllByRole("heading", { name: "Link another control" })[0],
    ).toBeVisible();
    expect(screen.getByText("Multi-factor authentication")).toBeVisible();
    expect(
      screen.queryByRole("checkbox", { name: /CTRL-001/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", { name: /CTRL-002/ }),
    ).toBeInTheDocument();
  });
  it("requires confirmation before unlinking a control", async () => {
    mocks.unlinkAsync.mockResolvedValue(undefined);
    render(<LinkIncidentControlDialog incident={incident} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Unlink" }));
    expect(screen.getByText("Remove this control link?")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Remove link" }));
    await waitFor(() =>
      expect(mocks.unlinkAsync).toHaveBeenCalledWith({
        incidentId: incident.id,
        controlId: "11111111-1111-4111-8111-111111111111",
      }),
    );
  });
  it("sends code or name search to the paginated query", () => {
    render(<LinkIncidentControlDialog incident={incident} onClose={vi.fn()} />);
    fireEvent.change(
      screen.getByPlaceholderText("Search by control code or name"),
      { target: { value: "MFA" } },
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Search available controls" }),
    );
    expect(mocks.controlOptions).toHaveBeenCalledWith(
      expect.objectContaining({ q: "MFA", scope: "unlinked", page: 1 }),
    );
  });
});
