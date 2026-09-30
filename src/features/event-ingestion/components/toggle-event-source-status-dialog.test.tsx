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
import { ApiError } from "@/lib/api/api-error";
import type { EventSourceResponse } from "../schemas/event-source-schema";

const { mutateAsyncMock, toastSuccessMock } = vi.hoisted(() => ({
  mutateAsyncMock: vi.fn(),
  toastSuccessMock: vi.fn(),
}));

vi.mock("../hooks/use-event-sources", () => ({
  useUpdateEventSource: () => ({
    isPending: false,
    mutateAsync: mutateAsyncMock,
  }),
}));

vi.mock("@/components/feedback/toast", () => ({
  useToast: () => ({
    success: toastSuccessMock,
    error: vi.fn(),
  }),
}));

import { ToggleEventSourceStatusDialog } from "./toggle-event-source-status-dialog";

const activeSource: EventSourceResponse = {
  id: "ec178d52-2959-47fd-93db-aa693158668c",
  name: "Corporate Wazuh Manager",
  sourceType: "WAZUH",
  endpoint: "https://wazuh.internal:55000",
  ingestionMethod: "API",
  authenticationType: "BEARER_TOKEN",
  status: "ACTIVE",
  description: "Primary SIEM cluster",
  eventFamilies: ["AUTHENTICATION", "VPN_SSO"],
  createdBy: "9a9bf33a-02db-48e4-a8ad-90517278d7f2",
  createdAt: "2026-09-10T00:00:00.000Z",
  updatedAt: "2026-09-10T00:00:00.000Z",
};

const inactiveSource: EventSourceResponse = {
  ...activeSource,
  id: "fd289e63-3060-48fe-a4ec-bb704269779d",
  name: "Legacy Firewall",
  status: "INACTIVE",
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
      this.dispatchEvent(new Event("close"));
    },
  });
});

afterEach(cleanup);

describe("ToggleEventSourceStatusDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders pause confirmation when source is ACTIVE and successfully pauses ingestion", async () => {
    const user = userEvent.setup();
    const onCloseMock = vi.fn();
    const onSuccessMock = vi.fn();

    mutateAsyncMock.mockResolvedValue({
      ...activeSource,
      status: "INACTIVE",
    });

    render(
      <ToggleEventSourceStatusDialog
        onClose={onCloseMock}
        onSuccess={onSuccessMock}
        source={activeSource}
      />,
    );

    expect(screen.getByText("Pause Event Ingestion")).toBeInTheDocument();
    expect(screen.getByText("Corporate Wazuh Manager")).toBeInTheDocument();
    expect(screen.getByText(/Incoming events and logs will not be processed/i)).toBeInTheDocument();

    const pauseBtn = screen.getByRole("button", { name: "Pause Ingestion" });
    await user.click(pauseBtn);

    await waitFor(() => {
      expect(mutateAsyncMock).toHaveBeenCalledWith({
        id: activeSource.id,
        values: {
          name: activeSource.name,
          endpoint: activeSource.endpoint,
          ingestionMethod: activeSource.ingestionMethod,
          authenticationType: activeSource.authenticationType,
          status: "INACTIVE",
          description: activeSource.description,
          eventFamilies: activeSource.eventFamilies,
        },
      });
    });

    expect(toastSuccessMock).toHaveBeenCalledWith(
      "Event source paused",
      expect.stringContaining("Corporate Wazuh Manager"),
    );
    expect(onSuccessMock).toHaveBeenCalled();
    expect(onCloseMock).toHaveBeenCalled();
  });

  it("renders resume confirmation when source is INACTIVE and successfully resumes ingestion", async () => {
    const user = userEvent.setup();
    const onCloseMock = vi.fn();
    const onSuccessMock = vi.fn();

    mutateAsyncMock.mockResolvedValue({
      ...inactiveSource,
      status: "ACTIVE",
    });

    render(
      <ToggleEventSourceStatusDialog
        onClose={onCloseMock}
        onSuccess={onSuccessMock}
        source={inactiveSource}
      />,
    );

    expect(screen.getByText("Resume Event Ingestion")).toBeInTheDocument();
    expect(screen.getByText("Legacy Firewall")).toBeInTheDocument();
    expect(screen.getByText(/The ingestion pipeline will immediately resume/i)).toBeInTheDocument();

    const resumeBtn = screen.getByRole("button", { name: "Resume Ingestion" });
    await user.click(resumeBtn);

    await waitFor(() => {
      expect(mutateAsyncMock).toHaveBeenCalledWith({
        id: inactiveSource.id,
        values: {
          name: inactiveSource.name,
          endpoint: inactiveSource.endpoint,
          ingestionMethod: inactiveSource.ingestionMethod,
          authenticationType: inactiveSource.authenticationType,
          status: "ACTIVE",
          description: inactiveSource.description,
          eventFamilies: inactiveSource.eventFamilies,
        },
      });
    });

    expect(toastSuccessMock).toHaveBeenCalledWith(
      "Event source resumed",
      expect.stringContaining("Legacy Firewall"),
    );
    expect(onSuccessMock).toHaveBeenCalled();
    expect(onCloseMock).toHaveBeenCalled();
  });

  it("displays error message when the status toggle API call fails", async () => {
    const user = userEvent.setup();
    const onCloseMock = vi.fn();

    mutateAsyncMock.mockRejectedValue(
      new ApiError("Failed to update status on server", 500, "SERVER_ERROR"),
    );

    render(
      <ToggleEventSourceStatusDialog
        onClose={onCloseMock}
        source={activeSource}
      />,
    );

    const pauseBtn = screen.getByRole("button", { name: "Pause Ingestion" });
    await user.click(pauseBtn);

    expect(
      await screen.findByText("Failed to update status on server"),
    ).toBeInTheDocument();
    expect(onCloseMock).not.toHaveBeenCalled();
  });

  it("closes the dialog when clicking Cancel", async () => {
    const user = userEvent.setup();
    const onCloseMock = vi.fn();

    render(
      <ToggleEventSourceStatusDialog
        onClose={onCloseMock}
        source={activeSource}
      />,
    );

    const cancelBtn = screen.getByRole("button", { name: "Cancel" });
    await user.click(cancelBtn);

    expect(onCloseMock).toHaveBeenCalled();
    expect(mutateAsyncMock).not.toHaveBeenCalled();
  });
});
