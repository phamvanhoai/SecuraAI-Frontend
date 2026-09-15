import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/feedback/toast";
import { SyncErrorLogsView } from "./sync-error-logs-view";

describe("SyncErrorLogsView", () => {
  const fetchMock = vi.fn();
  const mockIntegrationId = "11111111-1111-4111-8111-111111111111";
  const mockLogId = "22222222-2222-4222-8222-222222222222";
  const mockJobId = "33333333-3333-4333-8333-333333333333";

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    fetchMock.mockReset();
  });

  function renderComponent() {
    const client = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    return render(
      <QueryClientProvider client={client}>
        <ToastProvider>
          <SyncErrorLogsView />
        </ToastProvider>
      </QueryClientProvider>,
    );
  }

  it("renders stat cards and log entries, and opens diagnostic dialog", async () => {
    fetchMock.mockImplementation(async (url: string) => {
      const urlStr = String(url);
      if (urlStr.includes("/api/integrations/logs/stats")) {
        return new Response(
          JSON.stringify({
            success: true,
            data: {
              totalErrors: 5,
              totalWarnings: 2,
              failedJobsCount: 3,
              affectedIntegrationsCount: 2,
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }
      if (urlStr.includes("/api/integrations/logs")) {
        return new Response(
          JSON.stringify({
            success: true,
            data: {
              items: [
                {
                  id: mockLogId,
                  integrationId: mockIntegrationId,
                  syncJobId: mockJobId,
                  level: "error",
                  message: "Connection timeout to SIEM gateway",
                  details: { httpStatus: 504, attempt: 3 },
                  createdAt: "2026-09-01T12:00:00.000Z",
                  integration: {
                    id: mockIntegrationId,
                    name: "Primary Wazuh SIEM",
                    type: "siem",
                  },
                  syncJob: {
                    id: mockJobId,
                    status: "failed",
                    errorMessage: "Gateway timeout after 30s",
                  },
                },
              ],
              pagination: {
                page: 1,
                limit: 20,
                total: 1,
                totalPages: 1,
              },
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }
      if (urlStr.includes("/api/integrations")) {
        return new Response(
          JSON.stringify({
            success: true,
            data: {
              items: [
                {
                  id: mockIntegrationId,
                  name: "Primary Wazuh SIEM",
                  integrationType: "siem",
                  status: "active",
                  createdAt: "2026-09-01T00:00:00.000Z",
                  updatedAt: "2026-09-01T00:00:00.000Z",
                },
              ],
              pagination: { page: 1, limit: 100, total: 1, totalPages: 1 },
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }
      return new Response(JSON.stringify({ success: false }), { status: 404 });
    });

    renderComponent();

    // Check header
    expect(
      screen.getByText("Nhật ký lỗi đồng bộ dữ liệu"),
    ).toBeInTheDocument();

    // Verify stat cards
    expect(await screen.findByText("Lỗi (ERROR)")).toBeInTheDocument();
    expect(await screen.findByText("Cảnh báo (WARN)")).toBeInTheDocument();

    // Verify log table row
    expect(
      await screen.findByText("Connection timeout to SIEM gateway"),
    ).toBeInTheDocument();
    expect(await screen.findByText("Primary Wazuh SIEM")).toBeInTheDocument();

    // Click "Xem chi tiết" to open dialog
    const detailBtn = await screen.findByRole("button", {
      name: /xem chi tiết/i,
    });
    fireEvent.click(detailBtn);

    // Verify dialog contents
    expect(await screen.findByText("Diagnostic Payload")).toBeInTheDocument();
    expect(
      await screen.findByText(new RegExp(mockLogId)),
    ).toBeInTheDocument();
  });
});
