import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/feedback/toast";
import { ApiKeyModal } from "./api-key-modal";
import { OneTimeSecretDialog } from "./one-time-secret-dialog";

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute("open");
  };
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("Create Integration API Key Workflow", () => {
  const fetchMock = vi.fn();
  const integrationId = "11111111-1111-4111-8111-111111111111";

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    fetchMock.mockReset();
  });

  function renderModal(props?: Partial<Parameters<typeof ApiKeyModal>[0]>) {
    const client = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    const defaultProps = {
      integrationId,
      mode: "create" as const,
      open: true,
      onOpenChange: vi.fn(),
      onSecretGenerated: vi.fn(),
      ...props,
    };

    return {
      ...render(
        <QueryClientProvider client={client}>
          <ToastProvider>
            <ApiKeyModal {...defaultProps} />
          </ToastProvider>
        </QueryClientProvider>,
      ),
      props: defaultProps,
    };
  }

  it("renders Create New API Key modal with form inputs, authorized scopes, and expiration settings", () => {
    renderModal();

    expect(screen.getByText("Create New API Key")).toBeInTheDocument();
    expect(screen.getByLabelText(/key identifier name/i)).toBeInTheDocument();
    expect(screen.getAllByText(/authorized scopes/i)[0]).toBeInTheDocument();
    expect(screen.getByText("Ingest Log Events")).toBeInTheDocument();
    expect(screen.getByText("Read Normalized Events")).toBeInTheDocument();
    expect(screen.getByText("Read AI Anomaly Alerts")).toBeInTheDocument();
    expect(screen.getByText("Read IT Assets")).toBeInTheDocument();
    expect(screen.getByText("Read Compliance Policies")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "30 days" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "90 days" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "1 year" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Never" })).toBeInTheDocument();
    expect(screen.getByText(/automatically generate a cryptographically secure 192-bit secret token/i)).toBeInTheDocument();
  });

  it("allows selecting multiple scopes and updating expiration preset", () => {
    renderModal();

    const readEventsCheckbox = screen.getByLabelText((content, element) => {
      return (
        element?.tagName.toLowerCase() === "input" &&
        element?.getAttribute("type") === "checkbox" &&
        element?.closest("label")?.textContent?.includes("Read Normalized Events") === true
      );
    });

    fireEvent.click(readEventsCheckbox);
    expect(readEventsCheckbox).toBeChecked();

    // Click "30 days" preset
    const preset30Days = screen.getByRole("button", { name: "30 days" });
    fireEvent.click(preset30Days);

    const expiryInput = screen.getByLabelText(/expiration settings/i) as HTMLInputElement;
    expect(expiryInput.value).not.toBe("");

    // Click "Never" preset
    const presetNever = screen.getByRole("button", { name: "Never" });
    fireEvent.click(presetNever);
    expect(expiryInput.value).toBe("");
  });

  it("submits the form, calls backend POST /api/integrations/:id/api-keys, and invokes onSecretGenerated", async () => {
    const mockCreatedKey = {
      id: "33333333-3333-4333-8333-333333333333",
      integrationId,
      keyName: "Wazuh Agent HEC Key",
      name: "Wazuh Agent HEC Key",
      keyPrefix: "sec_live_wazuh1234",
      keyFingerprint: "sec_live_wazuh1234...****",
      maskedKey: "sec_live_wazuh1234...****",
      secret: "sec_live_wazuh1234567890abcdef1234567890abcdef1234",
      status: "ACTIVE" as const,
      isActive: true,
      scopes: ["events:ingest", "events:read"],
      expiresAt: null,
      createdAt: new Date().toISOString(),
    };

    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true, data: mockCreatedKey }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const onSecretGenerated = vi.fn();
    const onOpenChange = vi.fn();

    renderModal({ onSecretGenerated, onOpenChange });

    const nameInput = screen.getByLabelText(/key identifier name/i);
    fireEvent.change(nameInput, { target: { value: "Wazuh Agent HEC Key" } });

    const submitBtn = screen.getByRole("button", { name: /^create api key$/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining(`/api/integrations/${integrationId}/api-keys`),
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining('"keyName":"Wazuh Agent HEC Key"'),
        }),
      );
      expect(onSecretGenerated).toHaveBeenCalledWith(
        "Wazuh Agent HEC Key",
        mockCreatedKey.secret,
      );
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it("renders one-time secret securely in OneTimeSecretDialog", () => {
    render(
      <ToastProvider>
        <OneTimeSecretDialog
          keyName="Wazuh Agent HEC Key"
          secret="sec_live_wazuh1234567890abcdef1234567890abcdef1234"
          open={true}
          onClose={vi.fn()}
        />
      </ToastProvider>,
    );

    expect(screen.getByText("API Key Secret Token")).toBeInTheDocument();
    expect(screen.getByDisplayValue("sec_live_wazuh1234567890abcdef1234567890abcdef1234")).toBeInTheDocument();
    expect(screen.getByText(/not be able to view/i)).toBeInTheDocument();
  });

  it("disables events:ingest scope and displays indicator when no event source is associated", () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    renderModal({ integrationId: "all" });

    const ingestCheckbox = screen.getByLabelText((content, element) => {
      return (
        element?.tagName.toLowerCase() === "input" &&
        element?.getAttribute("type") === "checkbox" &&
        element?.closest("label")?.textContent?.includes("Ingest Log Events") === true
      );
    });

    expect(ingestCheckbox).toBeDisabled();
    expect(screen.getByText("Requires Event Source")).toBeInTheDocument();
  });
});

