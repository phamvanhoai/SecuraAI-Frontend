import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/feedback/toast";
import { ApiKeysTab } from "./api-keys-tab";
import type { IntegrationApiKey } from "../schemas/integration-schema";

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

describe("Search & Filter Integration API Keys Workflow", () => {
  const fetchMock = vi.fn();
  const integrationId = "11111111-1111-4111-8111-111111111111";

  const keyId1 = "11111111-1111-4111-8111-000000000001";
  const keyId2 = "11111111-1111-4111-8111-000000000002";
  const keyId3 = "11111111-1111-4111-8111-000000000003";
  const keyId4 = "11111111-1111-4111-8111-000000000004";
  const userId1 = "22222222-2222-4222-8222-000000000001";
  const userId2 = "22222222-2222-4222-8222-000000000002";
  const userId3 = "22222222-2222-4222-8222-000000000003";

  const sampleKeys: IntegrationApiKey[] = [
    {
      id: keyId1,
      integrationId,
      eventSourceId: integrationId,
      keyName: "Wazuh Production Collector",
      name: "Wazuh Production Collector",
      keyPrefix: "sec_live_wazuh01",
      keyFingerprint: "sec_live_wazuh01",
      maskedKey: "sec_live_wazuh01...****",
      status: "ACTIVE",
      isActive: true,
      scopes: ["events:ingest", "audit:read"],
      expiresAt: "2030-01-01T00:00:00.000Z",
      createdAt: "2026-10-01T00:00:00.000Z",
      creator: {
        id: userId1,
        fullName: "Alex Security Admin",
        email: "alex@secura.ai",
        username: "alex_admin",
      },
    },
    {
      id: keyId2,
      integrationId,
      eventSourceId: integrationId,
      keyName: "Suricata IDS Ingest",
      name: "Suricata IDS Ingest",
      keyPrefix: "sec_live_suricata",
      keyFingerprint: "sec_live_suricata",
      maskedKey: "sec_live_suricata...****",
      status: "ROTATED",
      isActive: false,
      scopes: ["events:ingest"],
      expiresAt: null, // Never expires
      createdAt: "2026-10-02T00:00:00.000Z",
      creator: {
        id: userId2,
        fullName: "Brenda DevOps",
        email: "brenda@secura.ai",
        username: "brenda_ops",
      },
    },
    {
      id: keyId3,
      integrationId,
      eventSourceId: integrationId,
      keyName: "Legacy Firewall Forwarder",
      name: "Legacy Firewall Forwarder",
      keyPrefix: "sec_live_firewall",
      keyFingerprint: "sec_live_firewall",
      maskedKey: "sec_live_firewall...****",
      status: "REVOKED",
      isActive: false,
      scopes: ["events:ingest", "reports:export"],
      expiresAt: "2026-10-05T00:00:00.000Z",
      createdAt: "2026-09-15T00:00:00.000Z",
      creator: {
        id: userId3,
        fullName: "Charlie Engineer",
        email: "charlie@secura.ai",
        username: "charlie_eng",
      },
    },
    {
      id: keyId4,
      integrationId,
      eventSourceId: integrationId,
      keyName: "Expired Audit Reader",
      name: "Expired Audit Reader",
      keyPrefix: "sec_live_expired01",
      keyFingerprint: "sec_live_expired01",
      maskedKey: "sec_live_expired01...****",
      status: "EXPIRED",
      isActive: false,
      scopes: ["audit:read"],
      expiresAt: "2026-09-01T00:00:00.000Z",
      createdAt: "2026-08-01T00:00:00.000Z",
      creator: {
        id: userId1,
        fullName: "Alex Security Admin",
        email: "alex@secura.ai",
        username: "alex_admin",
      },
    },
  ];

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockImplementation(() =>
      Promise.resolve(
        new Response(JSON.stringify({ success: true, data: sampleKeys }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    fetchMock.mockReset();
  });

  function renderTab() {
    const client = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    return render(
      <QueryClientProvider client={client}>
        <ToastProvider>
          <ApiKeysTab integrationId={integrationId} />
        </ToastProvider>
      </QueryClientProvider>,
    );
  }

  it("renders all keys initially and verifies secret token is never exposed", async () => {
    renderTab();

    await waitFor(() => {
      expect(screen.getByText("Wazuh Production Collector")).toBeInTheDocument();
      expect(screen.getByText("Suricata IDS Ingest")).toBeInTheDocument();
      expect(screen.getByText("Legacy Firewall Forwarder")).toBeInTheDocument();
      expect(screen.getByText("Expired Audit Reader")).toBeInTheDocument();
    });

    // Verify Key Fingerprint and Assigned Scopes columns are hidden from table
    expect(screen.queryByText("Key Fingerprint")).not.toBeInTheDocument();
    expect(screen.queryByText("Assigned Scopes")).not.toBeInTheDocument();

    // Verify secret token plaintext is NEVER exposed
    expect(screen.queryByText(/sec_live_[a-z0-9]{32}/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/secret_hash/i)).not.toBeInTheDocument();
  });

  it("searches API keys by key name and creator without case sensitivity", async () => {
    renderTab();

    await screen.findByText("Wazuh Production Collector");

    const searchInput = screen.getByLabelText(/search api keys/i);

    // Search by key name
    fireEvent.change(searchInput, { target: { value: "suricata" } });
    await waitFor(() => {
      expect(screen.getByText("Suricata IDS Ingest")).toBeInTheDocument();
      expect(screen.queryByText("Wazuh Production Collector")).not.toBeInTheDocument();
      expect(screen.queryByText("Legacy Firewall Forwarder")).not.toBeInTheDocument();
    });

    // Search by creator name
    fireEvent.change(searchInput, { target: { value: "Charlie" } });
    await waitFor(() => {
      expect(screen.getByText("Legacy Firewall Forwarder")).toBeInTheDocument();
      expect(screen.queryByText("Wazuh Production Collector")).not.toBeInTheDocument();
      expect(screen.queryByText("Suricata IDS Ingest")).not.toBeInTheDocument();
    });

    // Search by creator email
    fireEvent.change(searchInput, { target: { value: "alex@secura.ai" } });
    await waitFor(() => {
      expect(screen.getByText("Wazuh Production Collector")).toBeInTheDocument();
      expect(screen.getByText("Expired Audit Reader")).toBeInTheDocument();
      expect(screen.queryByText("Suricata IDS Ingest")).not.toBeInTheDocument();
    });
  });

  it("filters keys by status pills (Active, Rotated, Revoked, Expired)", async () => {
    renderTab();

    await screen.findByText("Wazuh Production Collector");

    // Filter Active
    fireEvent.click(screen.getByRole("button", { name: /^active$/i }));
    await waitFor(() => {
      expect(screen.getByText("Wazuh Production Collector")).toBeInTheDocument();
      expect(screen.queryByText("Suricata IDS Ingest")).not.toBeInTheDocument();
      expect(screen.queryByText("Legacy Firewall Forwarder")).not.toBeInTheDocument();
      expect(screen.queryByText("Expired Audit Reader")).not.toBeInTheDocument();
    });

    // Filter Rotated
    fireEvent.click(screen.getByRole("button", { name: /^rotated$/i }));
    await waitFor(() => {
      expect(screen.getByText("Suricata IDS Ingest")).toBeInTheDocument();
      expect(screen.queryByText("Wazuh Production Collector")).not.toBeInTheDocument();
    });

    // Filter Revoked
    fireEvent.click(screen.getByRole("button", { name: /^revoked$/i }));
    await waitFor(() => {
      expect(screen.getByText("Legacy Firewall Forwarder")).toBeInTheDocument();
      expect(screen.queryByText("Suricata IDS Ingest")).not.toBeInTheDocument();
    });

    // Filter Expired
    fireEvent.click(screen.getByRole("button", { name: /^expired$/i }));
    await waitFor(() => {
      expect(screen.getByText("Expired Audit Reader")).toBeInTheDocument();
      expect(screen.queryByText("Legacy Firewall Forwarder")).not.toBeInTheDocument();
    });
  });

  it("searches keys by assigned scope keyword using search input", async () => {
    renderTab();

    await screen.findByText("Wazuh Production Collector");

    const searchInput = screen.getByLabelText(/search api keys/i);

    // Search by scope "reports:export"
    fireEvent.change(searchInput, { target: { value: "reports:export" } });
    await waitFor(() => {
      expect(screen.getByText("Legacy Firewall Forwarder")).toBeInTheDocument();
      expect(screen.queryByText("Wazuh Production Collector")).not.toBeInTheDocument();
      expect(screen.queryByText("Suricata IDS Ingest")).not.toBeInTheDocument();
    });
  });

  it("shows empty state when no keys match filters and allows clearing search", async () => {
    renderTab();

    await screen.findByText("Wazuh Production Collector");

    const searchInput = screen.getByLabelText(/search api keys/i);
    fireEvent.change(searchInput, { target: { value: "NonExistentKey123456" } });

    await waitFor(() => {
      expect(screen.getByText("No Matching API Keys Found")).toBeInTheDocument();
      expect(
        screen.getByText(/no integration api keys match your active filter criteria/i),
      ).toBeInTheDocument();
    });

    // Click Clear Search button (X)
    const clearSearchBtn = screen.getByRole("button", { name: /clear search/i });
    fireEvent.click(clearSearchBtn);

    await waitFor(() => {
      expect(screen.getByText("Wazuh Production Collector")).toBeInTheDocument();
      expect(screen.getByText("Suricata IDS Ingest")).toBeInTheDocument();
      expect(screen.getByText("Legacy Firewall Forwarder")).toBeInTheDocument();
    });
  });
});
