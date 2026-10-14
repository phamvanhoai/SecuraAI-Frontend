import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/feedback/toast";
import { ApiKeyModal } from "./api-key-modal";
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

describe("Edit API Key Scope & Expiration Workflow", () => {
  const fetchMock = vi.fn();
  const integrationId = "11111111-1111-4111-8111-111111111111";

  const existingKey: IntegrationApiKey = {
    id: "33333333-3333-4333-8333-333333333333",
    integrationId,
    eventSourceId: integrationId,
    keyName: "Wazuh Ingestion Agent",
    name: "Wazuh Ingestion Agent",
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

  function renderEditModal(props?: Partial<Parameters<typeof ApiKeyModal>[0]>) {
    const client = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    const defaultProps = {
      integrationId,
      mode: "edit" as const,
      apiKey: existingKey,
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

  it("renders Edit API Key modal with existing key data pre-filled", () => {
    renderEditModal();

    expect(screen.getByText("Edit API Key")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Wazuh Ingestion Agent")).toBeInTheDocument();

    // Check that Authorized Scopes section is visible
    expect(screen.getAllByText(/authorized scopes/i)[0]).toBeInTheDocument();
    expect(screen.getByText("Ingest Log Events")).toBeInTheDocument();
    expect(screen.getByText("Read AI Anomaly Alerts")).toBeInTheDocument();

    // Check expiration preset buttons are visible
    expect(screen.getByRole("button", { name: "30 days" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Never" })).toBeInTheDocument();

    // Check Save Changes button
    expect(screen.getByRole("button", { name: /save changes/i })).toBeInTheDocument();
  });

  it("allows updating authorized scopes and expiration date, and submits PATCH request", async () => {
    const updatedKeyResponse = {
      ...existingKey,
      scopes: ["events:ingest", "alerts:read"],
      expiresAt: null,
    };

    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true, data: updatedKeyResponse }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const onOpenChange = vi.fn();
    renderEditModal({ onOpenChange });

    // Toggle Read AI Anomaly Alerts checkbox
    const alertScopeCheckbox = screen.getByLabelText((content, element) => {
      return (
        element?.tagName.toLowerCase() === "input" &&
        element?.getAttribute("type") === "checkbox" &&
        element?.closest("label")?.textContent?.includes("Read AI Anomaly Alerts") === true
      );
    });
    fireEvent.click(alertScopeCheckbox);
    expect(alertScopeCheckbox).toBeChecked();

    // Change expiration to Never
    const neverPreset = screen.getByRole("button", { name: "Never" });
    fireEvent.click(neverPreset);

    // Click Save Changes
    const saveButton = screen.getByRole("button", { name: /save changes/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining(
          `/api/integrations/${integrationId}/api-keys/${existingKey.id}`,
        ),
        expect.objectContaining({
          method: "PATCH",
          body: expect.stringContaining('"scopes":["events:ingest","alerts:read"]'),
        }),
      );
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it("displays error message if backend returns an error", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "KEY_REVOKED",
            message: "Cannot modify scopes or expiration for a revoked API key.",
          },
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

    renderEditModal();

    const saveButton = screen.getByRole("button", { name: /save changes/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(
        screen.getByText("Cannot modify scopes or expiration for a revoked API key."),
      ).toBeInTheDocument();
    });
  });
});
