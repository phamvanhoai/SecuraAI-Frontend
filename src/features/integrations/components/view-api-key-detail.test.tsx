import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/feedback/toast";
import { ApiKeyDetailModal } from "./api-key-detail-modal";
import { ApiKeysTab } from "./api-keys-tab";

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

describe("ApiKeyDetailModal", () => {
  const sampleKeyId = "22222222-2222-4222-8222-222222222222";
  const sampleIntegrationId = "11111111-1111-4111-8111-111111111111";

  const mockDetailData = {
    id: sampleKeyId,
    eventSourceId: sampleIntegrationId,
    integrationId: sampleIntegrationId,
    name: "Wazuh Production Collector",
    keyName: "Wazuh Production Collector",
    keyPrefix: "sec_live_9f0d9c7098",
    keyFingerprint: "sec_live_9f0d9c7098...****",
    maskedKey: "sec_live_9f0d9c7098...****",
    status: "ACTIVE" as const,
    isActive: true,
    scopes: ["events:ingest", "events:read"],
    expiresAt: "2026-11-10T15:06:00.000Z",
    lastUsedAt: "2026-10-11T12:00:00.000Z",
    lastUsedIp: "192.168.1.105",
    creator: {
      id: "admin-uuid",
      fullName: "System Administrator",
      email: "admin@secura.ai",
      username: "sysadmin",
    },
    createdBy: "admin-uuid",
    createdAt: "2026-10-01T08:00:00.000Z",
    rotatedAt: null,
    revokedAt: null,
    revokedBy: null,
    revoker: null,
    replacementKeyId: null,
    replacementKey: null,
    eventSource: {
      id: sampleIntegrationId,
      name: "Wazuh SIEM Ingest",
      sourceType: "Wazuh HIDS",
    },
    usage: {
      lastUsedAt: "2026-10-11T12:00:00.000Z",
      lastUsedIp: "192.168.1.105",
      totalAuditEvents: 128,
      isUsed: true,
    },
  };

  function renderWithProviders(ui: React.ReactElement) {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    return render(
      <QueryClientProvider client={queryClient}>
        <ToastProvider>{ui}</ToastProvider>
      </QueryClientProvider>,
    );
  }

  it("renders key metadata, creator info, scopes, and telemetry", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ success: true, data: mockDetailData }),
    });
    vi.stubGlobal("fetch", fetchMock);

    renderWithProviders(
      <ApiKeyDetailModal
        initialData={mockDetailData}
        integrationId={sampleIntegrationId}
        keyId={sampleKeyId}
        onClose={vi.fn()}
        open={true}
      />,
    );

    // Header & Identification
    expect(screen.getAllByText("Wazuh Production Collector").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText(`ID: ${sampleKeyId}`)).toBeInTheDocument();
    expect(screen.getByText("sec_live_9f0d9c7098...****")).toBeInTheDocument();

    // Event Source
    expect(screen.getByText(/Wazuh SIEM Ingest/)).toBeInTheDocument();

    // Scopes
    expect(screen.getByText("events:ingest")).toBeInTheDocument();
    expect(screen.getByText("events:read")).toBeInTheDocument();

    // Creator
    expect(screen.getByText("System Administrator")).toBeInTheDocument();
    expect(screen.getByText("admin@secura.ai")).toBeInTheDocument();
    expect(screen.getByText(/@sysadmin/)).toBeInTheDocument();

    // Usage & Telemetry
    expect(screen.getByText("192.168.1.105")).toBeInTheDocument();
    expect(screen.getByText("128 request events")).toBeInTheDocument();
    expect(screen.getByText("Active Ingestion Usage")).toBeInTheDocument();
  }, 15000);

  it("supports copying the masked key fingerprint", async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    renderWithProviders(
      <ApiKeyDetailModal
        initialData={mockDetailData}
        integrationId={sampleIntegrationId}
        keyId={sampleKeyId}
        onClose={vi.fn()}
        open={true}
      />,
    );

    const copyBtn = screen.getByRole("button", { name: /^copy$/i });
    fireEvent.click(copyBtn);

    expect(writeTextMock).toHaveBeenCalledWith("sec_live_9f0d9c7098...****");
  });

  it("calls onClose when Close Details button or X is clicked", async () => {
    const onCloseMock = vi.fn();

    renderWithProviders(
      <ApiKeyDetailModal
        initialData={mockDetailData}
        integrationId={sampleIntegrationId}
        keyId={sampleKeyId}
        onClose={onCloseMock}
        open={true}
      />,
    );

    const closeBtn = screen.getByRole("button", { name: "Close Details" });
    fireEvent.click(closeBtn);

    expect(onCloseMock).toHaveBeenCalled();
  });

  it("opens ApiKeyDetailModal when clicking View button in ApiKeysTab", async () => {
    const listFetchMock = vi.fn().mockImplementation((url: string) => {
      if (url.includes(`/api-keys/${sampleKeyId}`)) {
        return Promise.resolve({
          ok: true,
          text: async () => JSON.stringify({ success: true, data: mockDetailData }),
        });
      }
      return Promise.resolve({
        ok: true,
        text: async () =>
          JSON.stringify({
            success: true,
            data: {
              items: [mockDetailData],
              pagination: { page: 1, limit: 20, totalItems: 1, totalPages: 1 },
            },
          }),
      });
    });
    vi.stubGlobal("fetch", listFetchMock);

    renderWithProviders(<ApiKeysTab integrationId={sampleIntegrationId} />);

    await waitFor(() => {
      expect(screen.getByText("Wazuh Production Collector")).toBeInTheDocument();
    });

    // Click View button
    const viewBtn = screen.getByRole("button", {
      name: `View API key details for ${mockDetailData.keyName}`,
    });
    fireEvent.click(viewBtn);

    // Detail modal opens
    await waitFor(() => {
      expect(screen.getByText("Key Identification")).toBeInTheDocument();
      expect(screen.getByText("Close Details")).toBeInTheDocument();
    });
  });
});
