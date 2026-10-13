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

describe("Revoke Integration API Key Workflow", () => {
  const fetchMock = vi.fn();
  const integrationId = "11111111-1111-4111-8111-111111111111";

  const sampleActiveKey: IntegrationApiKey = {
    id: "33333333-3333-4333-8333-333333333333",
    integrationId,
    eventSourceId: integrationId,
    keyName: "Wazuh Production Collector",
    name: "Wazuh Production Collector",
    keyPrefix: "sec_live_9f0d9c7098",
    keyFingerprint: "sec_live_9f0d9c7098...****",
    maskedKey: "sec_live_9f0d9c7098...****",
    status: "ACTIVE",
    isActive: true,
    scopes: ["events:ingest"],
    expiresAt: "2026-11-20T10:00:00.000Z",
    createdAt: "2026-10-01T00:00:00.000Z",
  };

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
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

  it("opens confirmation dialog when Revoke Key is clicked and sends POST revoke request", async () => {
    fetchMock.mockImplementation((_url: RequestInfo | URL, init?: RequestInit) => {
      const method = (init?.method || "GET").toUpperCase();
      if (method === "POST") {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              success: true,
              data: {
                ...sampleActiveKey,
                status: "REVOKED",
                isActive: false,
              },
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            },
          ),
        );
      }
      return Promise.resolve(
        new Response(JSON.stringify({ success: true, data: [sampleActiveKey] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
    });

    renderTab();

    // Click the Revoke button directly
    const revokeButton = await screen.findByRole("button", {
      name: `Revoke API key ${sampleActiveKey.keyName}`,
    });
    fireEvent.click(revokeButton);

    // Verify confirmation dialog appears
    expect(screen.getByText("Confirm API Key Revocation")).toBeInTheDocument();
    expect(
      screen.getByText(/Are you sure you want to revoke the key/i),
    ).toBeInTheDocument();

    // Confirm revocation
    const confirmButton = screen.getByRole("button", { name: "Confirm Revocation" });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining(
          `/api/integrations/${integrationId}/api-keys/${sampleActiveKey.id}/revoke`,
        ),
        expect.objectContaining({
          method: "POST",
        }),
      );
    });
  });

  it("submits optional revocation reason when provided by the user", async () => {
    fetchMock.mockImplementation((_url: RequestInfo | URL, init?: RequestInit) => {
      const method = (init?.method || "GET").toUpperCase();
      if (method === "POST") {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              success: true,
              data: {
                ...sampleActiveKey,
                status: "REVOKED",
                isActive: false,
              },
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            },
          ),
        );
      }
      return Promise.resolve(
        new Response(JSON.stringify({ success: true, data: [sampleActiveKey] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
    });

    renderTab();

    const revokeButton = await screen.findByRole("button", {
      name: `Revoke API key ${sampleActiveKey.keyName}`,
    });
    fireEvent.click(revokeButton);

    const reasonInput = screen.getByPlaceholderText(/please enter a reason/i);
    fireEvent.change(reasonInput, {
      target: { value: "Decommissioned Wazuh server" },
    });

    const confirmButton = screen.getByRole("button", { name: "Confirm Revocation" });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining(
          `/api/integrations/${integrationId}/api-keys/${sampleActiveKey.id}/revoke`,
        ),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ reason: "Decommissioned Wazuh server" }),
        }),
      );
    });
  });
});
