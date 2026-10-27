import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const { createMock, toastSuccessMock, toastErrorMock } = vi.hoisted(() => ({
  createMock: vi.fn(),
  toastSuccessMock: vi.fn(),
  toastErrorMock: vi.fn(),
}));

vi.mock("../hooks/use-event-sources", () => ({
  useCreateEventSource: () => ({
    isPending: false,
    mutateAsync: createMock,
  }),
  useTestEventSourceConnection: () => ({
    isPending: false,
    mutateAsync: vi.fn(),
  }),
}));

vi.mock("@/components/feedback/toast", () => ({
  useToast: () => ({
    success: toastSuccessMock,
    error: toastErrorMock,
  }),
}));

import { RegisterEventSourceDialog } from "./register-event-source-dialog";

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

describe("RegisterEventSourceDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the dialog modal when isOpen is true", () => {
    render(
      <RegisterEventSourceDialog
        isOpen={true}
        onClose={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Register Wazuh SIEM Event Source" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Configure SecuraAI to accept Normalized Security Events pushed from Wazuh Edge Normalizer (custom-securaai).",
      ),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Event source name *")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Register event source/i }),
    ).toBeInTheDocument();
  });

  it("triggers onClose when clicking cancel button", async () => {
    const user = userEvent.setup();
    const onCloseMock = vi.fn();

    render(
      <RegisterEventSourceDialog
        isOpen={true}
        onClose={onCloseMock}
      />,
    );

    const cancelBtn = screen.getByRole("button", { name: /Cancel/i });
    await user.click(cancelBtn);

    expect(onCloseMock).toHaveBeenCalled();
  });

  it("submits the form successfully and calls onSuccess callback", async () => {
    const user = userEvent.setup();
    const onSuccessMock = vi.fn();
    const onCloseMock = vi.fn();

    const createdRecord = {
      id: "ec178d52-2959-47fd-93db-aa693158668c",
      name: "Wazuh Production",
      sourceType: "WAZUH",
      endpoint: "/api/v1/integrations/wazuh/events",
      ingestionMethod: "API" as const,
      authenticationType: "BEARER_TOKEN",
      status: "ACTIVE" as const,
      description: "SIEM cluster",
      eventFamilies: ["AUTHENTICATION" as const],
      createdBy: "9a9bf33a-02db-48e4-a8ad-90517278d7f2",
      createdAt: "2026-09-27T10:00:00Z",
      updatedAt: "2026-09-27T10:00:00Z",
    };

    createMock.mockResolvedValue(createdRecord);

    render(
      <RegisterEventSourceDialog
        isOpen={true}
        onClose={onCloseMock}
        onSuccess={onSuccessMock}
      />,
    );

    await user.type(screen.getByLabelText("Event source name *"), "Wazuh Production");
    await user.type(screen.getByLabelText("SecuraAI Ingestion Webhook Endpoint *"), "/api/v1/integrations/wazuh/events");

    await user.click(screen.getByRole("button", { name: /Register event source/i }));

    expect(createMock).toHaveBeenCalled();
    expect(onSuccessMock).toHaveBeenCalledWith(createdRecord);
    expect(onCloseMock).toHaveBeenCalled();
  });
});
