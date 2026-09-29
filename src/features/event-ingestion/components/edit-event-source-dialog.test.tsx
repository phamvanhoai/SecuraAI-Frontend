import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const mockUseEventSource = vi.fn();
const mockMutateAsync = vi.fn();
const mockUseUpdateEventSource = vi.fn(() => ({
  mutateAsync: mockMutateAsync,
  isPending: false,
}));

vi.mock("../hooks/use-event-sources", () => ({
  useEventSource: (id: string | null) => mockUseEventSource(id),
  useUpdateEventSource: () => mockUseUpdateEventSource(),
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

  it("pre-fills form with existing event source data and displays immutable identifiers", () => {
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

    const endpointInput = screen.getByLabelText(/SecuraAI Ingestion Webhook Endpoint/i);
    expect(endpointInput).toHaveValue("https://wazuh.internal:55000");

    const statusSelect = screen.getByLabelText(/Status/i);
    expect(statusSelect).toHaveValue("ACTIVE");
  });

  it("submits updated configuration and invokes callback upon success", async () => {
    mockUseEventSource.mockReturnValue({
      data: mockDetailData,
      isLoading: false,
      isError: false,
      error: null,
    });

    const updatedResult = {
      ...mockDetailData,
      name: "Wazuh Updated Cluster",
      status: "INACTIVE" as const,
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

    const nameInput = screen.getByLabelText(/Event source name/i);
    fireEvent.change(nameInput, { target: { value: "Wazuh Updated Cluster" } });

    const statusSelect = screen.getByLabelText(/Status/i);
    fireEvent.change(statusSelect, { target: { value: "INACTIVE" } });

    const submitBtn = screen.getByRole("button", { name: /Save configuration/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        id: "3a9bf33a-02db-48e4-a8ad-90517278d7f2",
        values: expect.objectContaining({
          name: "Wazuh Updated Cluster",
          status: "INACTIVE",
          endpoint: "https://wazuh.internal:55000",
        }),
      });
      expect(mockToastSuccess).toHaveBeenCalled();
      expect(handleSuccess).toHaveBeenCalledWith(updatedResult);
      expect(handleClose).toHaveBeenCalled();
    });
  });

  it("shows error when required fields are cleared and submitted", async () => {
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

    const nameInput = screen.getByLabelText(/Event source name/i);
    fireEvent.change(nameInput, { target: { value: "   " } });

    const submitBtn = screen.getByRole("button", { name: /Save configuration/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText("Source name cannot be empty")).toBeInTheDocument();
      expect(mockMutateAsync).not.toHaveBeenCalled();
    });
  });
});
