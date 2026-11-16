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
    expect(screen.queryByRole("button", { name: "Never" })).not.toBeInTheDocument();
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

    const expiryInput = screen.getByLabelText(/expiration (settings|date)/i) as HTMLInputElement;
    expect(expiryInput.value).not.toBe("");

    // Click "90 days" preset
    const preset90Days = screen.getByRole("button", { name: "90 days" });
    fireEvent.click(preset90Days);
    expect(expiryInput.value).not.toBe("");
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

    // Select 30 days preset since expiration date is required
    const preset30Days = screen.getByRole("button", { name: "30 days" });
    fireEvent.click(preset30Days);

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

  it("displays validation error when submitting with empty expiration date", async () => {
    const onSecretGenerated = vi.fn();
    const onOpenChange = vi.fn();

    renderModal({ onSecretGenerated, onOpenChange });

    const nameInput = screen.getByLabelText(/key identifier name/i);
    fireEvent.change(nameInput, { target: { value: "Wazuh Agent HEC Key" } });

    const submitBtn = screen.getByRole("button", { name: /^create api key$/i });
    fireEvent.click(submitBtn);

    expect(
      screen.getByText("Expiration date is required. Non-expiring API keys are not permitted."),
    ).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('displays validation error: "Key name cannot be empty" and blocks submission', async () => {
    renderModal();

    // Leave key name empty, select 30 days preset
    const preset30Days = screen.getByRole("button", { name: "30 days" });
    fireEvent.click(preset30Days);

    const submitBtn = screen.getByRole("button", { name: /^create api key$/i });
    fireEvent.click(submitBtn);

    expect(screen.getByText("Key name cannot be empty")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalledWith(
      expect.stringContaining('/api-keys'),
      expect.anything(),
    );
  });

  it("allows creating a General Read-Only API key when no event source is selected", async () => {
    const mockReadOnlyKey = {
      id: "44444444-4444-4444-8444-444444444444",
      integrationId: null,
      eventSourceId: null,
      keyName: "Read Only Observer Key",
      name: "Read Only Observer Key",
      keyPrefix: "sec_live_readonly1",
      keyFingerprint: "sec_live_readonly1...****",
      maskedKey: "sec_live_readonly1...****",
      secret: "sec_live_readonly1234567890abcdef1234567890abcdef12",
      status: "ACTIVE" as const,
      isActive: true,
      scopes: ["events:read"],
      expiresAt: "2027-01-01T00:00:00.000Z",
      createdAt: new Date().toISOString(),
    };

    fetchMock.mockImplementation((url: RequestInfo | URL, init?: RequestInit) => {
      const urlStr = url.toString();
      if (urlStr.includes("/api-keys") && (init?.method || "GET").toUpperCase() === "POST") {
        return Promise.resolve(
          new Response(JSON.stringify({ success: true, data: mockReadOnlyKey }), {
            status: 201,
            headers: { "Content-Type": "application/json" },
          }),
        );
      }
      return Promise.resolve(
        new Response(
          JSON.stringify({
            success: true,
            data: {
              items: [],
              pagination: { total: 0, page: 1, limit: 100, totalPages: 1 },
            },
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        ),
      );
    });

    const onSecretGenerated = vi.fn();
    renderModal({ integrationId: "all", onSecretGenerated });

    const nameInput = screen.getByLabelText(/key identifier name/i);
    fireEvent.change(nameInput, { target: { value: "Read Only Observer Key" } });

    const preset30Days = screen.getByRole("button", { name: "30 days" });
    fireEvent.click(preset30Days);

    const submitBtn = screen.getByRole("button", { name: /^create api key$/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/api/integrations/all/api-keys"),
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining('"scopes":["events:read"]'),
        }),
      );
      expect(onSecretGenerated).toHaveBeenCalledWith(
        "Read Only Observer Key",
        mockReadOnlyKey.secret,
      );
    });
  });

  it('displays validation error: "Expiration date must be in the future" when past date is entered', async () => {
    renderModal();

    const nameInput = screen.getByLabelText(/key identifier name/i);
    fireEvent.change(nameInput, { target: { value: "Wazuh Agent HEC Key" } });

    const expiryInput = screen.getByLabelText(/expiration (settings|date)/i);
    fireEvent.change(expiryInput, { target: { value: "2020-01-01T00:00" } });

    const submitBtn = screen.getByRole("button", { name: /^create api key$/i });
    fireEvent.click(submitBtn);

    expect(screen.getByText("Expiration date must be in the future")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("displays validation error and blocks submission when key name exceeds 255 characters", async () => {
    const onOpenChange = vi.fn();
    renderModal({ onOpenChange });

    const nameInput = screen.getByLabelText(/key identifier name/i);
    fireEvent.change(nameInput, { target: { value: "A".repeat(256) } });

    const submitBtn = screen.getByRole("button", { name: /^create api key$/i });
    fireEvent.click(submitBtn);

    expect(
      await screen.findByText(/Key identifier name must not exceed 255 characters/i),
    ).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("supports mini search and scrollable ~5-item viewport in Associated Event Source dropdown", async () => {
    const now = "2026-10-01T00:00:00.000Z";
    const makeSource = (
      idSuffix: string,
      name: string,
      sourceType: string,
      status: "ACTIVE" | "INACTIVE",
    ) => ({
      id: `aaaaaaaa-aaaa-4aaa-8aaa-${idSuffix.padStart(12, "0")}`,
      name,
      sourceType,
      endpoint: null,
      ingestionMethod: "API" as const,
      authenticationType: "BEARER_TOKEN",
      status,
      description: null,
      eventFamilies: ["AUTHENTICATION" as const],
      createdBy: "bbbbbbbb-bbbb-4bbb-8bbb-000000000001",
      createdAt: now,
      updatedAt: now,
    });

    const mockSources = [
      makeSource("1", "Customer VPN Gateway Wazuh Agent", "WAZUH", "ACTIVE"),
      makeSource("2", "Wazuh SIEM - Core DC Cluster v1", "WAZUH", "ACTIVE"),
      makeSource("3", "Wazuh SIEM - Master Cloud", "WAZUH", "INACTIVE"),
      makeSource("4", "Fortinet Perimeter Firewall", "FIREWALL", "ACTIVE"),
      makeSource("5", "AI Alert Demo Events", "CUSTOM_JSON", "ACTIVE"),
      makeSource("6", "SecuraAI Demo Identity Events", "IAM", "ACTIVE"),
    ];

    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: true,
          data: {
            items: mockSources,
            pagination: { total: 6, page: 1, limit: 100, totalPages: 1 },
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    renderModal({ integrationId: "all" });

    const comboboxTrigger = await screen.findByRole("combobox", {
      name: /associated event source/i,
    });
    await waitFor(() => {
      expect(comboboxTrigger).not.toBeDisabled();
    });

    fireEvent.click(comboboxTrigger);

    const listbox = screen.getByRole("listbox", { name: /event source options/i });
    expect(listbox.className).toContain("max-h-[180px]");
    expect(listbox.className).toContain("overflow-y-auto");

    const miniSearch = screen.getByLabelText("Filter event sources");
    fireEvent.change(miniSearch, { target: { value: "Fortinet" } });

    expect(screen.getByRole("option", { name: /Fortinet Perimeter Firewall/i })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: /AI Alert Demo Events/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("option", { name: /Fortinet Perimeter Firewall/i }));

    expect(comboboxTrigger).toHaveTextContent("Fortinet Perimeter Firewall (ACTIVE)");
    const ingestCheckbox = screen.getByLabelText((_content, element) => {
      return (
        element?.tagName.toLowerCase() === "input" &&
        element?.getAttribute("type") === "checkbox" &&
        element?.closest("label")?.textContent?.includes("Ingest Log Events") === true
      );
    });
    expect(ingestCheckbox).not.toBeDisabled();
    expect(ingestCheckbox).toBeChecked();
  });
});
