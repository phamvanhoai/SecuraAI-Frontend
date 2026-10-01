import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
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
import type { EventSourceResponse, ImportEventsResponse } from "../schemas/event-source-schema";

const { mutateAsyncMock, toastSuccessMock, toastErrorMock } = vi.hoisted(() => ({
  mutateAsyncMock: vi.fn(),
  toastSuccessMock: vi.fn(),
  toastErrorMock: vi.fn(),
}));

const mockActiveSources: EventSourceResponse[] = [
  {
    id: "src-001",
    name: "Corporate Wazuh Ingestion",
    sourceType: "WAZUH",
    endpoint: "https://wazuh.internal:55000",
    ingestionMethod: "API",
    authenticationType: "BEARER_TOKEN",
    status: "ACTIVE",
    description: "Main SIEM",
    eventFamilies: ["AUTHENTICATION", "VPN_SSO"],
    createdBy: "user-1",
    createdAt: "2026-09-10T00:00:00.000Z",
    updatedAt: "2026-09-10T00:00:00.000Z",
  },
];

vi.mock("../hooks/use-event-sources", () => ({
  useEventSources: () => ({
    data: { items: mockActiveSources, pagination: { page: 1, limit: 20, total: 1, totalPages: 1 } },
    isLoading: false,
  }),
  useImportEvents: () => ({
    isPending: false,
    mutateAsync: mutateAsyncMock,
  }),
}));

vi.mock("@/components/feedback/toast", () => ({
  useToast: () => ({
    success: toastSuccessMock,
    error: toastErrorMock,
  }),
}));

import { ImportEventsDialog } from "./import-events-dialog";

function createMockFile(name: string, content: string, type = "application/json"): File {
  const file = new File([content], name, { type });
  Object.defineProperty(file, "text", {
    value: async () => content,
    configurable: true,
  });
  return file;
}

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

describe("ImportEventsDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders upload dialog when open", () => {
    render(<ImportEventsDialog isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText("Import Normalized Events from File")).toBeInTheDocument();
    expect(screen.getByText(/Drag and drop your event file here/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Import Events/i })).toBeDisabled();
  });

  it("parses uploaded JSON file and enables import button", async () => {
    render(
      <ImportEventsDialog
        isOpen={true}
        onClose={vi.fn()}
        presetSource={mockActiveSources[0]}
      />,
    );

    const jsonContent = JSON.stringify([
      {
        eventType: "USER_LOGON",
        occurredAt: "2026-03-30T10:00:00Z",
        accountIdentifier: "admin",
        sourceIp: "10.0.0.1",
      },
    ]);
    const file = createMockFile("events.json", jsonContent);

    const input = screen.getByTestId("event-file-input");
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText("events.json")).toBeInTheDocument();
      expect(screen.getByText("Valid Format")).toBeInTheDocument();
    });

    const startBtn = screen.getByRole("button", { name: /Import 1 Events/i });
    expect(startBtn).not.toBeDisabled();
  });

  it("triggers batch import mutation and renders success report", async () => {
    const user = userEvent.setup();
    const onCompleteMock = vi.fn();

    const mockImportResponse: ImportEventsResponse = {
      batchId: "550e8400-e29b-41d4-a716-446655440000",
      eventSourceId: "src-001",
      eventSourceName: "Corporate Wazuh Ingestion",
      fileName: "events.json",
      fileFormat: "JSON",
      totalRecords: 1,
      acceptedRecords: 1,
      rejectedRecords: 0,
      status: "COMPLETED",
      startedAt: "2026-03-30T10:00:00.000Z",
      completedAt: "2026-03-30T10:00:01.000Z",
      errors: [],
    };
    mutateAsyncMock.mockResolvedValue(mockImportResponse);

    render(
      <ImportEventsDialog
        isOpen={true}
        onClose={vi.fn()}
        presetSource={mockActiveSources[0]}
        onImportComplete={onCompleteMock}
      />,
    );

    const jsonContent = JSON.stringify([
      {
        eventType: "USER_LOGON",
        occurredAt: "2026-03-30T10:00:00Z",
        accountIdentifier: "admin",
      },
    ]);
    const file = createMockFile("events.json", jsonContent);

    const input = screen.getByTestId("event-file-input");
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Import 1 Events/i })).not.toBeDisabled();
    });

    const startBtn = screen.getByRole("button", { name: /Import 1 Events/i });
    await user.click(startBtn);

    await waitFor(() => {
      expect(mutateAsyncMock).toHaveBeenCalledWith({
        sourceId: "src-001",
        payload: {
          fileFormat: "JSON",
          fileName: "events.json",
          eventFamily: "AUTHENTICATION",
          events: expect.any(Array),
        },
      });
    });

    expect(toastSuccessMock).toHaveBeenCalledWith(
      "Import completed",
      expect.stringContaining("Successfully imported 1 normalized events"),
    );
    expect(screen.getByText("Batch Ingestion Summary")).toBeInTheDocument();
    expect(screen.getByText(/550e8400-e29b-41d4-a716-446655440000/)).toBeInTheDocument();
    expect(onCompleteMock).toHaveBeenCalledWith(mockImportResponse);
  });
});
