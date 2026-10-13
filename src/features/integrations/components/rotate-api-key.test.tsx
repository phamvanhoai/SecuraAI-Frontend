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

describe("Rotate Integration API Key Workflow", () => {
  const fetchMock = vi.fn();
  const integrationId = "11111111-1111-4111-8111-111111111111";

  const existingKey: IntegrationApiKey = {
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

  function renderRotateModal(props?: Partial<Parameters<typeof ApiKeyModal>[0]>) {
    const client = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    const defaultProps = {
      integrationId,
      mode: "rotate" as const,
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

  it("renders Rotate API Key modal with title, warning alert, and confirmation button", () => {
    renderRotateModal();

    expect(screen.getByText("Rotate API Key Secret")).toBeInTheDocument();
    expect(
      screen.getByText(/Generate a new secret token for "Wazuh Production Collector"/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Rotating the secret token will invalidate the current key immediately/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /confirm rotation/i }),
    ).toBeInTheDocument();
  });

  it("submits POST rotate request and triggers onSecretGenerated with the new secret", async () => {
    const rotatedResponse = {
      ...existingKey,
      id: "55555555-5555-4555-8555-555555555555",
      keyPrefix: "sec_live_newprefix2",
      maskedKey: "sec_live_newprefix2...****",
      secret: "sec_live_0123456789abcdef0123456789abcdef0123456789abcdef",
      replacedKeyId: existingKey.id,
    };

    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true, data: rotatedResponse }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const onOpenChange = vi.fn();
    const onSecretGenerated = vi.fn();
    renderRotateModal({ onOpenChange, onSecretGenerated });

    const confirmButton = screen.getByRole("button", { name: /confirm rotation/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining(
          `/api/integrations/${integrationId}/api-keys/${existingKey.id}/rotate`,
        ),
        expect.objectContaining({
          method: "POST",
        }),
      );
      expect(onOpenChange).toHaveBeenCalledWith(false);
      expect(onSecretGenerated).toHaveBeenCalledWith(
        existingKey.keyName,
        rotatedResponse.secret,
      );
    });
  });

  it("displays error message if backend rotation request fails", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "KEY_REVOKED",
            message: "Cannot rotate a revoked API key.",
          },
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

    renderRotateModal();

    const confirmButton = screen.getByRole("button", { name: /confirm rotation/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(screen.getByText("Cannot rotate a revoked API key.")).toBeInTheDocument();
    });
  });
});
