import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import type {
  BatchDetailResponse,
  PaginatedInvalidEvents,
} from "../schemas/event-source-schema";

const { toastSuccessMock, toastErrorMock } = vi.hoisted(() => ({
  toastSuccessMock: vi.fn(),
  toastErrorMock: vi.fn(),
}));

const mockBatchSuccess: BatchDetailResponse = {
  id: "660e8400-e29b-41d4-a716-446655440001",
  eventSourceId: "src-001",
  eventSourceName: "Corporate Wazuh Ingestion",
  ingestionMethod: "FILE_IMPORT",
  batchType: "FILE_IMPORT",
  status: "COMPLETED",
  totalRecords: 100,
  acceptedRecords: 100,
  rejectedRecords: 0,
  errorMessage: null,
  startedAt: "2026-03-30T10:00:00.000Z",
  completedAt: "2026-03-30T10:00:02.500Z",
  createdBy: "user-001",
  creatorName: "Security Administrator",
  createdAt: "2026-03-30T10:00:00.000Z",
  updatedAt: "2026-03-30T10:00:02.500Z",
};

const mockBatchPartial: BatchDetailResponse = {
  id: "660e8400-e29b-41d4-a716-446655440002",
  eventSourceId: "src-001",
  eventSourceName: "Corporate Wazuh Ingestion",
  ingestionMethod: "FILE_IMPORT",
  batchType: "FILE_IMPORT",
  status: "PARTIALLY_COMPLETED",
  totalRecords: 10,
  acceptedRecords: 8,
  rejectedRecords: 2,
  errorMessage: null,
  startedAt: "2026-03-30T10:00:00.000Z",
  completedAt: "2026-03-30T10:00:01.000Z",
  createdBy: "user-001",
  creatorName: "Security Administrator",
  createdAt: "2026-03-30T10:00:00.000Z",
  updatedAt: "2026-03-30T10:00:01.000Z",
};

const mockInvalidEvents: PaginatedInvalidEvents = {
  items: [
    {
      id: "err-001",
      eventSourceId: "src-001",
      ingestionBatchId: "660e8400-e29b-41d4-a716-446655440002",
      eventFamily: "AUTHENTICATION",
      recordIndex: 3,
      errorCode: "MISSING_REQUIRED_FIELD",
      errorMessage: "Field 'eventType' is required and must not be empty",
      receivedPayload: {
        rawLog: "Invalid user event without type",
        sourceIp: "192.168.1.100",
      },
      receivedAt: "2026-03-30T10:00:00.500Z",
      createdAt: "2026-03-30T10:00:00.500Z",
    },
    {
      id: "err-002",
      eventSourceId: "src-001",
      ingestionBatchId: "660e8400-e29b-41d4-a716-446655440002",
      eventFamily: "VPN_SSO",
      recordIndex: 7,
      errorCode: "INVALID_FORMAT",
      errorMessage: "Invalid ISO-8601 timestamp format for occurredAt",
      receivedPayload: {
        eventType: "VPN_CONNECT",
        occurredAt: "not-a-date",
      },
      receivedAt: "2026-03-30T10:00:00.800Z",
      createdAt: "2026-03-30T10:00:00.800Z",
    },
  ],
  pagination: {
    page: 1,
    limit: 10,
    total: 2,
    totalPages: 1,
  },
};

let currentBatchState: {
  data?: BatchDetailResponse;
  isLoading: boolean;
  isError: boolean;
  error?: Error;
} = {
  data: mockBatchPartial,
  isLoading: false,
  isError: false,
};

let currentInvalidEventsState: {
  data?: PaginatedInvalidEvents;
  isLoading: boolean;
} = {
  data: mockInvalidEvents,
  isLoading: false,
};

vi.mock("../hooks/use-event-sources", () => ({
  useBatchDetail: () => currentBatchState,
  useBatchInvalidEvents: () => currentInvalidEventsState,
}));

vi.mock("@/components/feedback/toast", () => ({
  useToast: () => ({
    success: toastSuccessMock,
    error: toastErrorMock,
  }),
}));

import { ImportBatchResultDialog } from "./import-batch-result-dialog";

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
      this.dispatchEvent(new Event("close"));
    },
  });
});

afterEach(cleanup);

describe("ImportBatchResultDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentBatchState = {
      data: mockBatchPartial,
      isLoading: false,
      isError: false,
    };
    currentInvalidEventsState = {
      data: mockInvalidEvents,
      isLoading: false,
    };
  });

  it("renders loading spinner when batch details are loading", () => {
    currentBatchState = {
      isLoading: true,
      isError: false,
    };

    render(
      <ImportBatchResultDialog
        batchId="660e8400-e29b-41d4-a716-446655440002"
        isOpen={true}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText("Loading batch results...")).toBeInTheDocument();
  });

  it("renders batch summary report with rejected records and error list", () => {
    render(
      <ImportBatchResultDialog
        batchId="660e8400-e29b-41d4-a716-446655440002"
        isOpen={true}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText("Event Ingestion Batch Report")).toBeInTheDocument();
    expect(screen.getByText("Corporate Wazuh Ingestion")).toBeInTheDocument();
    expect(screen.getByText("PARTIALLY COMPLETED")).toBeInTheDocument();
    expect(screen.getByText("Total Records")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();

    // Invalid events table
    expect(screen.getByText("Row #4")).toBeInTheDocument();
    expect(screen.getByText("MISSING_REQUIRED_FIELD")).toBeInTheDocument();
    expect(screen.getByText("Row #8")).toBeInTheDocument();
    expect(screen.getByText("INVALID_FORMAT")).toBeInTheDocument();
  });

  it("renders success state with no invalid events when rejectedCount is 0", () => {
    currentBatchState = {
      data: mockBatchSuccess,
      isLoading: false,
      isError: false,
    };

    render(
      <ImportBatchResultDialog
        batchId="660e8400-e29b-41d4-a716-446655440001"
        isOpen={true}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText("No Invalid Events")).toBeInTheDocument();
    expect(
      screen.getByText(/All 100 events in this batch passed validation/i),
    ).toBeInTheDocument();
  });

  it("opens payload inspector and copies raw payload to clipboard", async () => {
    const user = userEvent.setup();
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: writeTextMock,
      },
      configurable: true,
    });

    render(
      <ImportBatchResultDialog
        batchId="660e8400-e29b-41d4-a716-446655440002"
        isOpen={true}
        onClose={vi.fn()}
      />,
    );

    const inspectButtons = screen.getAllByRole("button", { name: /Inspect/i });
    expect(inspectButtons.length).toBe(2);

    await user.click(inspectButtons[0]!);

    await waitFor(() => {
      expect(screen.getByText(/Raw Received Payload/i)).toBeInTheDocument();
      expect(screen.getByText(/Invalid user event without type/i)).toBeInTheDocument();
    });

    const copyBtn = screen.getByRole("button", { name: /Copy JSON/i });
    await user.click(copyBtn);

    expect(writeTextMock).toHaveBeenCalledWith(
      expect.stringContaining("Invalid user event without type"),
    );
    expect(toastSuccessMock).toHaveBeenCalledWith(
      "Payload copied",
      "Raw event payload copied to clipboard.",
    );
  });

  it("calls onClose when Close button is clicked", async () => {
    const user = userEvent.setup();
    const onCloseMock = vi.fn();

    render(
      <ImportBatchResultDialog
        batchId="660e8400-e29b-41d4-a716-446655440002"
        isOpen={true}
        onClose={onCloseMock}
      />,
    );

    const closeBtn = screen.getByRole("button", { name: /^Close$/i });
    await user.click(closeBtn);

    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });

  it("calls onImportAnotherFile when Import another file button is clicked", async () => {
    const user = userEvent.setup();
    const onCloseMock = vi.fn();
    const onImportAnotherFileMock = vi.fn();

    render(
      <ImportBatchResultDialog
        batchId="660e8400-e29b-41d4-a716-446655440002"
        isOpen={true}
        onClose={onCloseMock}
        onImportAnotherFile={onImportAnotherFileMock}
      />,
    );

    const importAnotherBtn = screen.getByRole("button", { name: /Import another file/i });
    await user.click(importAnotherBtn);

    expect(onImportAnotherFileMock).toHaveBeenCalledTimes(1);
  });
});
