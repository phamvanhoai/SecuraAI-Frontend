import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const { createMock, toastSuccessMock, toastErrorMock, listSourcesMock } = vi.hoisted(() => ({
  createMock: vi.fn(),
  toastSuccessMock: vi.fn(),
  toastErrorMock: vi.fn(),
  listSourcesMock: vi.fn().mockReturnValue({ items: [] }),
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
  useEventSources: () => ({
    data: listSourcesMock(),
    isLoading: false,
  }),
}));

vi.mock("@/components/feedback/toast", () => ({
  useToast: () => ({
    success: toastSuccessMock,
    error: toastErrorMock,
  }),
}));

import { RegisterEventSourceForm } from "./register-event-source-form";
import { ApiError } from "@/lib/api/api-error";

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

describe("RegisterEventSourceForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders the form title, sections, and controls matching Webhook Push architecture", () => {
    render(<RegisterEventSourceForm />);

    expect(
      screen.getByText("Register Wazuh SIEM Event Source"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Configure SecuraAI to accept Normalized Security Events pushed from Wazuh Edge Normalizer (custom-securaai).",
      ),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Event source name *")).toBeInTheDocument();
    expect(screen.getByLabelText("Status *")).toBeInTheDocument();
    expect(
      screen.getByLabelText("SecuraAI Ingestion Webhook Endpoint *"),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Ingestion method *")).toBeInTheDocument();
    expect(screen.getByLabelText("Authentication method *")).toBeInTheDocument();
    expect(
      screen.queryByLabelText("Ingestion Secret Token / API Key"),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/No secret is stored on the event source/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Register event source/i }),
    ).toBeInTheDocument();
  });

  it("shows an inline error under the name field when the name already exists (409)", async () => {
    const user = userEvent.setup();
    createMock.mockRejectedValue(
      new ApiError("An event source with this name already exists", 409, "CONFLICT"),
    );

    render(<RegisterEventSourceForm />);

    await user.type(screen.getByLabelText("Event source name *"), "Wazuh SIEM Production");
    await user.type(
      screen.getByLabelText("SecuraAI Ingestion Webhook Endpoint *"),
      "/api/v1/integrations/wazuh/events",
    );
    await user.click(screen.getByRole("button", { name: /Register event source/i }));

    expect(
      (await screen.findAllByText("An event source with this name already exists")).length,
    ).toBeGreaterThan(0);
    expect(toastErrorMock).toHaveBeenCalledWith(
      "Registration failed",
      "An event source with this name already exists",
    );
  });

  it("shows validation error when submitting with empty name", async () => {
    const user = userEvent.setup();
    render(<RegisterEventSourceForm />);

    const nameInput = screen.getByLabelText("Event source name *");
    await user.clear(nameInput);

    const submitBtn = screen.getByRole("button", { name: /Register event source/i });
    await user.click(submitBtn);

    expect(
      await screen.findByText("Source name cannot be empty"),
    ).toBeInTheDocument();
    expect(createMock).not.toHaveBeenCalled();
  });

  it("submits valid form data and triggers success toast & callback", async () => {
    const user = userEvent.setup();
    const onSuccessMock = vi.fn();

    const createdRecord = {
      id: "ec178d52-2959-47fd-93db-aa693158668c",
      name: "Wazuh SIEM Production",
      sourceType: "WAZUH",
      endpoint: "/api/v1/integrations/wazuh/events",
      ingestionMethod: "API" as const,
      authenticationType: "BEARER_TOKEN",
      status: "ACTIVE" as const,
      description: "SIEM cluster",
      eventFamilies: ["AUTHENTICATION" as const, "VPN_SSO" as const, "APPLICATION_ACCESS" as const],
      createdBy: "9a9bf33a-02db-48e4-a8ad-90517278d7f2",
      createdAt: "2026-09-27T10:00:00Z",
      updatedAt: "2026-09-27T10:00:00Z",
    };

    createMock.mockResolvedValue(createdRecord);

    render(<RegisterEventSourceForm onSuccess={onSuccessMock} />);

    await user.type(screen.getByLabelText("Event source name *"), "Wazuh SIEM Production");
    await user.type(screen.getByLabelText("SecuraAI Ingestion Webhook Endpoint *"), "/api/v1/integrations/wazuh/events");

    await user.click(screen.getByRole("button", { name: /Register event source/i }));

    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Wazuh SIEM Production",
        sourceType: "WAZUH",
        endpoint: "/api/v1/integrations/wazuh/events",
        ingestionMethod: "API",
        authenticationType: "BEARER_TOKEN",
      }),
    );
    expect(toastSuccessMock).toHaveBeenCalledWith("Event source registered", expect.any(String));
    expect(onSuccessMock).toHaveBeenCalledWith(createdRecord);
  });

  it("does not render the Test connection button", () => {
    render(<RegisterEventSourceForm />);
    expect(screen.queryByRole("button", { name: /Test connection/i })).not.toBeInTheDocument();
  });

  it("warns about duplicate endpoint and blocks submission until confirmed", async () => {
    const user = userEvent.setup();
    listSourcesMock.mockReturnValue({
      items: [
        {
          id: "source-existing",
          name: "Wazuh SIEM - Master",
          endpoint: "http://localhost:5555",
        },
      ],
    });

    createMock.mockResolvedValue({
      id: "source-new",
      name: "Wazuh Production SIEM",
      sourceType: "WAZUH",
      endpoint: "http://localhost:5555",
      ingestionMethod: "API",
      status: "ACTIVE",
      eventFamilies: ["AUTHENTICATION"],
    });

    render(<RegisterEventSourceForm />);

    await user.type(screen.getByLabelText("Event source name *"), "Wazuh Production SIEM");
    await user.type(
      screen.getByLabelText("SecuraAI Ingestion Webhook Endpoint *"),
      "http://localhost:5555",
    );

    // Warning alert should appear
    expect(
      screen.getByText(/Warning: Duplicate endpoint detected for "Wazuh SIEM - Master"/i),
    ).toBeInTheDocument();

    // Try submit without confirmation
    await user.click(screen.getByRole("button", { name: /Register event source/i }));
    expect(createMock).not.toHaveBeenCalled();
    expect(
      screen.getByText(/This endpoint is already configured for another event source/i),
    ).toBeInTheDocument();

    // Check confirmation checkbox
    const confirmCheckbox = screen.getByLabelText(
      /I understand and confirm that I want to proceed with this endpoint/i,
    );
    await user.click(confirmCheckbox);

    // Now submit should proceed
    await user.click(screen.getByRole("button", { name: /Register event source/i }));
    expect(createMock).toHaveBeenCalled();
  });
});
