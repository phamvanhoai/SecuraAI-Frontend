import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/feedback/toast";
import { ConnectionMonitoringHeader } from "./connection-monitoring-header";
import { ConnectionStatusTable } from "./connection-status-table";
import { ConnectionDiagnosticsTab } from "./connection-diagnostics-tab";
import type { ConnectionStatusSummary, Integration } from "../schemas/integration-schema";

function createTestWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <ToastProvider>{children}</ToastProvider>
      </QueryClientProvider>
    );
  };
}

describe("Connection Monitoring UI Components", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("ConnectionMonitoringHeader", () => {
    const mockSummary: ConnectionStatusSummary = {
      totalIntegrations: 4,
      activeCount: 3,
      errorCount: 1,
      inactiveCount: 0,
      pendingCount: 0,
      timeWindow: "24h",
      checks24h: 12,
      successfulChecks24h: 10,
      failedChecks24h: 2,
      availability24h: 83.3,
      averageLatency24h: 48,
      failingIntegrations: [],
      recentLogs: [],
    };

    it("renders live metrics and allows changing auto-refresh interval", () => {
      const onAutoRefreshChange = vi.fn();
      const onRefresh = vi.fn();

      render(
        <ConnectionMonitoringHeader
          autoRefreshInterval={30000}
          isLoading={false}
          onAutoRefreshChange={onAutoRefreshChange}
          onRefresh={onRefresh}
          summary={mockSummary}
        />,
        { wrapper: createTestWrapper() },
      );

      expect(screen.getByText("Live Connection Status & Health")).toBeDefined();
      expect(screen.getByText("4")).toBeDefined();
      expect(screen.getByText("3")).toBeDefined();
      expect(screen.getByText("1")).toBeDefined();
      expect(screen.getByText("83.3%")).toBeDefined();
      expect(screen.getByText("48ms")).toBeDefined();

      const select = screen.getByLabelText("Auto-refresh interval");
      fireEvent.change(select, { target: { value: "15" } });
      expect(onAutoRefreshChange).toHaveBeenCalledWith(15000);

    });
  });

  describe("ConnectionStatusTable", () => {
    const mockIntegrations: Integration[] = [
      {
        id: "11111111-1111-1111-1111-111111111111",
        name: "Splunk SIEM",
        integrationType: "siem",
        baseUrl: "https://splunk.enterprise.local",
        status: "active",
        lastConnectedAt: "2026-09-15T12:00:00Z",
        createdAt: "2026-09-01T00:00:00Z",
        updatedAt: "2026-09-15T12:00:00Z",
      },
      {
        id: "22222222-2222-2222-2222-222222222222",
        name: "Fortinet FW",
        integrationType: "firewall",
        baseUrl: "https://fw.enterprise.local",
        status: "error",
        lastConnectedAt: null,
        createdAt: "2026-09-01T00:00:00Z",
        updatedAt: "2026-09-15T12:00:00Z",
      },
    ];

    it("renders table rows and triggers details callback", () => {
      const onOpenDetails = vi.fn();

      render(
        <ConnectionStatusTable
          integrations={mockIntegrations}
          onOpenDetails={onOpenDetails}
        />,
        { wrapper: createTestWrapper() },
      );

      expect(screen.getByText("Splunk SIEM")).toBeDefined();
      expect(screen.getByText("Fortinet FW")).toBeDefined();
      expect(screen.getByText("https://splunk.enterprise.local")).toBeDefined();

      // Click on Fortinet FW row
      fireEvent.click(screen.getByText("Fortinet FW"));
      expect(onOpenDetails).toHaveBeenCalledWith("22222222-2222-2222-2222-222222222222");
    });
  });

  describe("ConnectionDiagnosticsTab", () => {
    const mockIntegration: Integration = {
      id: "11111111-1111-1111-1111-111111111111",
      name: "Palo Alto NGFW",
      integrationType: "firewall",
      baseUrl: "https://paloalto.local",
      status: "active",
      lastConnectedAt: "2026-09-15T10:00:00Z",
      createdAt: "2026-09-01T00:00:00Z",
      updatedAt: "2026-09-15T10:00:00Z",
    };

    it("renders connection telemetry and allows submitting manual probe", async () => {
      global.fetch = vi.fn().mockImplementation((url: string) => {
        if (url.includes("connection-status")) {
          return Promise.resolve({
            ok: true,
            status: 200,
            text: async () =>
              JSON.stringify({
                success: true,
                data: {
                  id: mockIntegration.id,
                  name: mockIntegration.name,
                  integrationType: mockIntegration.integrationType,
                  baseUrl: mockIntegration.baseUrl,
                  status: mockIntegration.status,
                  lastConnectedAt: mockIntegration.lastConnectedAt,
                  timeWindow: "24h",
                  checks24h: 3,
                  successfulChecks24h: 3,
                  failedChecks24h: 0,
                  availability24h: 100.0,
                  averageLatency24h: 42,
                  recentLogs: [],
                },
              }),
          } as Response);
        }

        if (url.includes("test-connection")) {
          return Promise.resolve({
            ok: true,
            status: 200,
            text: async () =>
              JSON.stringify({
                success: true,
                data: {
                  connected: true,
                  statusCode: 200,
                  latencyMs: 38,
                  message: "Connection established successfully",
                },
              }),
          } as Response);
        }

        return Promise.reject(new Error("Unknown route"));
      });

      render(
        <ConnectionDiagnosticsTab integration={mockIntegration} />,
        { wrapper: createTestWrapper() },
      );

      await waitFor(() => {
        expect(screen.getByText("Thực hiện kiểm tra kết nối trực tiếp (Manual Probe)")).toBeDefined();
      });

      const submitBtn = screen.getByText("Kiểm tra ngay");
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText("Kết nối thành công (Healthy)")).toBeDefined();
      });
    });
  });
});
