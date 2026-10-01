import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Incident } from "../schemas/report-incident-schema";
import { LinkIncidentRiskDialog } from "./link-incident-risk-dialog";

const mocks = vi.hoisted(() => ({
  mutateAsync: vi.fn(),
  unlinkAsync: vi.fn(),
  success: vi.fn(),
  riskOptions: vi.fn(),
}));
vi.mock("../hooks/use-incidents", () => ({
  useIncidentRiskOptions: (
    _id: string | undefined,
    query: { scope: "linked" | "unlinked" },
  ) => {
    mocks.riskOptions(query);
    const linked = {
      id: "11111111-1111-4111-8111-111111111111",
      riskCode: "RSK-001",
      title: "Credential compromise",
      status: "open",
      reviewDate: null,
      linked: true,
    };
    const available = {
      id: "22222222-2222-4222-8222-222222222222",
      riskCode: "RSK-002",
      title: "Data exposure",
      status: "assessed",
      reviewDate: null,
      linked: false,
    };
    return {
      data: {
        risks: query.scope === "linked" ? [linked] : [available],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      },
      isPending: false,
      isError: false,
    };
  },
  useLinkIncidentToRisk: () => ({
    mutateAsync: mocks.mutateAsync,
    isPending: false,
    isError: false,
  }),
  useUnlinkIncidentFromRisk: () => ({
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
  title: "Suspicious login",
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
  classificationCount: 1,
  lastClassification: null,
  currentAssignment: null,
  createdBy: null,
  relatedCounts: { actions: 0, assets: 0, controls: 0, evidence: 0, risks: 1 },
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

describe("link incident risk dialog", () => {
  it("shows existing links and only offers unlinked risks", () => {
    render(<LinkIncidentRiskDialog incident={incident} onClose={vi.fn()} />);
    expect(
      screen.getByRole("heading", { name: "Link another risk" }),
    ).toBeVisible();
    expect(screen.getByText("Credential compromise")).toBeVisible();
    const select = screen.getByLabelText("Additional risk");
    expect(within(select).queryByText(/RSK-001/)).not.toBeInTheDocument();
    expect(within(select).getByText(/RSK-002/)).toBeInTheDocument();
  });
  it("requires confirmation before unlinking a risk", async () => {
    mocks.unlinkAsync.mockResolvedValue(undefined);
    render(<LinkIncidentRiskDialog incident={incident} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Unlink" }));
    expect(screen.getByText("Remove this risk link?")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Remove link" }));
    await waitFor(() =>
      expect(mocks.unlinkAsync).toHaveBeenCalledWith({
        incidentId: incident.id,
        riskId: "11111111-1111-4111-8111-111111111111",
      }),
    );
  });
  it("searches available risks by code or title", () => {
    render(<LinkIncidentRiskDialog incident={incident} onClose={vi.fn()} />);
    fireEvent.change(
      screen.getByRole("textbox", { name: "Search available risks" }),
      { target: { value: "RSK-002" } },
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Search available risks" }),
    );
    expect(mocks.riskOptions).toHaveBeenCalledWith(
      expect.objectContaining({ q: "RSK-002", scope: "unlinked", page: 1 }),
    );
  });
});
