import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const mockUseEventSource = vi.fn();
const mockMutateAsync = vi.fn();
const mockTestMutateAsync = vi.fn();
const mockUseUpdateEventSource = vi.fn(() => ({
  mutateAsync: mockMutateAsync,
  isPending: false,
}));

vi.mock("../hooks/use-event-sources", () => ({
  useEventSource: (id: string | null) => mockUseEventSource(id),
  useUpdateEventSource: () => mockUseUpdateEventSource(),
  useTestEventSourceConnection: () => ({
    isPending: false,
    mutateAsync: mockTestMutateAsync,
  }),
}));

const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();
const mockToastInfo = vi.fn();

vi.mock("@/components/feedback/toast", () => ({
  useToast: () => ({
    success: mockToastSuccess,
    error: mockToastError,
    info: mockToastInfo,
  }),
}));

import { EditEventSourceDialog } from "./edit-event-source-dialog";

const mockDetailData = {
  id: "3a9bf33a-02db-48e4-a8ad-90517278d7f2",
  name: "Wazuh Production SIEM",
  sourceType: "WAZUH",
  endpoint: "https://wazuh.internal:55000",
  ingestionMethod: "API" as const,
  authenticationType: "BEARER_TOKEN",
  status: "ACTIVE" as const,
  description: "Enterprise SIEM event collector",
  eventFamilies: ["AUTHENTICATION" as const, "VPN_SSO" as const],
  createdBy: "9a9bf33a-02db-48e4-a8ad-90517278d7f2",
  creator: {
    id: "9a9bf33a-02db-48e4-a8ad-90517278d7f2",
    email: "secops@secura.ai",
    fullName: "Security Operations",
  },
  apiKeys: [],
  stats: {
    totalIngestedEvents: 25420,
    totalBatches: 310,
    lastIngestedAt: "2026-09-28T14:00:00.000Z",
  },
  createdAt: "2026-09-20T10:00:00.000Z",
  updatedAt: "2026-09-27T12:00:00.000Z",
};

beforeAll(() => {
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
    configurable: true,
    value(this: HTMLDialogElement) {
      this.setAttribute("open", "");
    },
  });
  Object.defineProperty(HTMLDialogElement.prototype, "close", {
    configurable: true,
    value(this: HTMLDialogElement) {
      this.removeAttribute("open");
    },
  });
});

describe("EditEventSourceDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("pre-fills form with existing event source data and displays immutable identifiers and read-only status badge", () => {
    mockUseEventSource.mockReturnValue({
      data: mockDetailData,
      isLoading: false,
      isError: false,
      error: null,
    });

    render(
      <EditEventSourceDialog
        isOpen={true}
        onClose={vi.fn()}
        sourceId="3a9bf33a-02db-48e4-a8ad-90517278d7f2"
      />,
    );

    expect(screen.getByText("Update Event Source Configuration")).toBeInTheDocument();
    expect(screen.getByText(mockDetailData.id)).toBeInTheDocument();
    expect(screen.getByText(mockDetailData.sourceType)).toBeInTheDocument();

    const nameInput = screen.getByLabelText(/Event source name/i);
    expect(nameInput).toHaveValue("Wazuh Production SIEM");

    const endpointInput = screen.getByLabelText(/Endpoint URL/i);
    expect(endpointInput).toHaveValue("https://wazuh.internal:55000");

    // Status is displayed as read-only badge
    expect(screen.getByText("Active")).toBeInTheDocument();

    // Save button is initially disabled because Test connection hasn't been verified
    const saveBtn = screen.getByRole("button", { name: /Save configuration/i });
    expect(saveBtn).toBeDisabled();
    expect(screen.getByText(/Please run a successful/i)).toBeInTheDocument();
  });

  it("opens test modal, enables save button after successful test, and saves changes", async () => {
    const user = userEvent.setup();
    mockUseEventSource.mockReturnValue({
      data: mockDetailData,
      isLoading: false,
      isError: false,
      error: null,
    });

    mockTestMutateAsync.mockResolvedValue({
      connected: true,
      statusCode: 200,
      latencyMs: 120,
      message: "Connection successfully verified.",
      testedAt: "2026-09-30T10:00:00Z",
    });

    const updatedResult = {
      ...mockDetailData,
      name: "Wazuh Updated Cluster",
    };
    mockMutateAsync.mockResolvedValue(updatedResult);

    const handleSuccess = vi.fn();
    const handleClose = vi.fn();

    render(
      <EditEventSourceDialog
        isOpen={true}
        onClose={handleClose}
        onSuccess={handleSuccess}
        sourceId="3a9bf33a-02db-48e4-a8ad-90517278d7f2"
      />,
    );

    // Save button is disabled initially
    const saveBtn = screen.getByRole("button", { name: /Save configuration/i });
    expect(saveBtn).toBeDisabled();

    // Click Test connection button
    const testBtn = screen.getByRole("button", { name: /Test connection/i });
    await user.click(testBtn);

    // In modal, click "Run Connection Test"
    const runTestBtn = screen.getByRole("button", { name: /Run Connection Test/i });
    await user.click(runTestBtn);

    // Close test modal
    const closeTestModalBtn = screen.getByRole("button", { name: /Close/i });
    await user.click(closeTestModalBtn);

    // Now verified banner is shown and save button is enabled
    expect(screen.getByText(/Connection Verified/i)).toBeInTheDocument();
    expect(saveBtn).not.toBeDisabled();

    // Edit fields
    const nameInput = screen.getByLabelText(/Event source name/i);
    await user.clear(nameInput);
    await user.type(nameInput, "Wazuh Updated Cluster");

    await user.click(saveBtn);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        id: "3a9bf33a-02db-48e4-a8ad-90517278d7f2",
        values: expect.objectContaining({
          name: "Wazuh Updated Cluster",
          status: "ACTIVE",
          endpoint: "https://wazuh.internal:55000",
        }),
      });
      expect(mockToastSuccess).toHaveBeenCalled();
      expect(handleSuccess).toHaveBeenCalledWith(updatedResult);
      expect(handleClose).toHaveBeenCalled();
    });
  });

  it("resets validation status when endpoint is changed after successful test", async () => {
    const user = userEvent.setup();
    mockUseEventSource.mockReturnValue({
      data: mockDetailData,
      isLoading: false,
      isError: false,
      error: null,
    });

    mockTestMutateAsync.mockResolvedValue({
      connected: true,
      statusCode: 200,
      latencyMs: 100,
      message: "Connected",
      testedAt: "2026-09-30T10:00:00Z",
    });

    render(
      <EditEventSourceDialog
        isOpen={true}
        onClose={vi.fn()}
        sourceId="3a9bf33a-02db-48e4-a8ad-90517278d7f2"
      />,
    );

    // Test connection
    await user.click(screen.getByRole("button", { name: /Test connection/i }));
    await user.click(screen.getByRole("button", { name: /Run Connection Test/i }));
    await user.click(screen.getByRole("button", { name: /Close/i }));

    const saveBtn = screen.getByRole("button", { name: /Save configuration/i });
    expect(saveBtn).not.toBeDisabled();

    // Change endpoint
    const endpointInput = screen.getByLabelText(/Endpoint URL/i);
    await user.type(endpointInput, "/new-path");

    // Save button must be disabled again
    expect(saveBtn).toBeDisabled();
    expect(screen.getByText(/Please run a successful/i)).toBeInTheDocument();
  });
});
