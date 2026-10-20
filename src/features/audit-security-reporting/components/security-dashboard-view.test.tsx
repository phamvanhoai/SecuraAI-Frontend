import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SecurityDashboardView } from "./security-dashboard-view";
import type { SecurityDashboardResponse } from "../schemas/security-dashboard-schema";

let mockSessionUser = {
  data: {
    id: "user-1",
    roles: [{ code: "SECURITY_OFFICER", name: "Security Officer" }],
  },
  isPending: false,
};

vi.mock("@/features/authentication-account", () => ({
  useSessionUser: () => mockSessionUser,
}));

describe("SecurityDashboardView Component", () => {
  const fetchMock = vi.fn();

  const mockSecurityOfficerData: SecurityDashboardResponse = {
    userRole: "SECURITY_OFFICER",
    securityIndicators: {
      totalAssets: 1248,
      criticalAssets: 156,
      activeEventSources: 8,
      totalSecurityControls: 114,
    },
    riskMetrics: {
      totalRisks: 156,
      openRisks: 42,
      criticalRisks: 12,
      highRisks: 20,
      mediumRisks: 8,
      lowRisks: 2,
      pendingReassessments: 3,
      riskDistribution: [
        { rating: "CRITICAL", count: 12, percentage: 28.6 },
        { rating: "HIGH", count: 20, percentage: 47.6 },
        { rating: "MEDIUM", count: 8, percentage: 19.0 },
        { rating: "LOW", count: 2, percentage: 4.8 },
      ],
    },
    incidentStatistics: {
      totalIncidents: 28,
      openIncidents: 5,
      inProgressIncidents: 3,
      resolvedIncidents: 20,
      criticalIncidents: 2,
    },
    aiAlertMetrics: {
      totalEvents24h: 84500,
      totalAlerts24h: 18,
      newAlerts24h: 9,
      reviewingAlerts24h: 6,
      confirmedIncidents24h: 3,
    },
    operationalDetails: {
      recentAlerts: [
        {
          id: "11111111-1111-4111-8111-111111111111",
          severity: "CRITICAL",
          status: "NEW",
          detectionType: "PORT_SCAN_ATTACK",
          generatedAt: "2026-10-13T10:00:00.000Z",
        },
      ],
      recentIncidents: [
        {
          id: "22222222-2222-4222-8222-222222222222",
          incidentCode: "INC-2026-089",
          title: "Brute force attack on VPN",
          severity: "HIGH",
          status: "IN_PROGRESS",
          detectedAt: "2026-10-13T09:30:00.000Z",
        },
      ],
      highRiskAssets: [
        {
          id: "33333333-3333-4333-8333-333333333333",
          assetCode: "AST-SRV-01",
          name: "Main Production Cluster",
          criticality: "CRITICAL",
          status: "ACTIVE",
          openRisksCount: 2,
          activeIncidentsCount: 1,
        },
      ],
      openControlWeaknessesCount: 4,
    },
  };

  const mockExecutiveData: SecurityDashboardResponse = {
    userRole: "EXECUTIVE",
    securityIndicators: {
      totalAssets: 1248,
      criticalAssets: 156,
      activeEventSources: 8,
      totalSecurityControls: 114,
    },
    riskMetrics: {
      totalRisks: 156,
      openRisks: 42,
      criticalRisks: 12,
      highRisks: 20,
      mediumRisks: 8,
      lowRisks: 2,
      pendingReassessments: 3,
      riskDistribution: [],
    },
    incidentStatistics: {
      totalIncidents: 28,
      openIncidents: 5,
      inProgressIncidents: 3,
      resolvedIncidents: 20,
      criticalIncidents: 2,
    },
    aiAlertMetrics: {
      totalEvents24h: 84500,
      totalAlerts24h: 18,
      newAlerts24h: 9,
      reviewingAlerts24h: 6,
      confirmedIncidents24h: 3,
    },
    executiveSummary: {
      postureScore: 84,
      postureLevel: "ADEQUATE",
      complianceRate: 91,
      strategicHighlights: [
        "Overall security posture rated as ADEQUATE (84/100).",
        "5 active incidents currently under response.",
      ],
    },
  };

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    mockSessionUser = {
      data: {
        id: "user-1",
        roles: [{ code: "SECURITY_OFFICER", name: "Security Officer" }],
      },
      isPending: false,
    };
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    fetchMock.mockReset();
  });

  function renderDashboard() {
    const client = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    return render(
      <QueryClientProvider client={client}>
        <SecurityDashboardView />
      </QueryClientProvider>,
    );
  }

  it("renders loading skeletons initially", () => {
    fetchMock.mockImplementation(() => new Promise(() => {})); // Never resolves
    renderDashboard();
    expect(screen.getByTestId("dashboard-loading-skeleton")).toBeInTheDocument();
  });

  it("renders error state with retry button when query fails", async () => {
    fetchMock.mockImplementation(() =>
      Promise.resolve(
        new Response(JSON.stringify({ success: false, error: { message: "Server error" } }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByTestId("dashboard-error-state")).toBeInTheDocument();
      expect(screen.getByText("Failed to Load Security Dashboard")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /retry dashboard telemetry/i })).toBeInTheDocument();
    });
  });

  it("renders Security Officer dashboard with operational details and indicators", async () => {
    fetchMock.mockImplementation(() =>
      Promise.resolve(
        new Response(JSON.stringify({ success: true, data: mockSecurityOfficerData }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByTestId("security-dashboard-view")).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: "Security & Risk Posture Dashboard" }),
      ).toBeInTheDocument();
      expect(screen.getByText("SECURITY_OFFICER")).toBeInTheDocument();
    });

    // Check Metrics Strip and Telemetry Header values
    expect(screen.getByText("Last 24 Hours")).toBeInTheDocument();
    expect(screen.getByText("1,248")).toBeInTheDocument();
    expect(screen.getByText("Total IT Assets")).toBeInTheDocument();
    expect(screen.getByText("Open Risks")).toBeInTheDocument();

    // Check Ingested Events funnel
    expect(screen.getByText("84,500")).toBeInTheDocument();
    expect(screen.getByText("24h Ingested Events:")).toBeInTheDocument();

    // Check Operational Details section is present
    expect(screen.getByTestId("operational-details-section")).toBeInTheDocument();
    expect(screen.getByText("Main Production Cluster")).toBeInTheDocument();
    expect(screen.getByText("2 risks")).toBeInTheDocument();
    expect(screen.getByText("1 incidents")).toBeInTheDocument();
    expect(screen.getByText("INC-2026-089")).toBeInTheDocument();
    expect(screen.getByText("PORT_SCAN_ATTACK")).toBeInTheDocument();

    // Executive summary section should NOT be present for Security Officer
    expect(screen.queryByTestId("executive-summary-section")).not.toBeInTheDocument();
  });

  it("renders Executive dashboard with executive summary and hides operational details", async () => {
    fetchMock.mockImplementation(() =>
      Promise.resolve(
        new Response(JSON.stringify({ success: true, data: mockExecutiveData }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByTestId("security-dashboard-view")).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: "Executive Security Posture Dashboard" }),
      ).toBeInTheDocument();
      expect(screen.getByText("EXECUTIVE")).toBeInTheDocument();
    });

    // Check Executive summary section is present
    expect(screen.getByTestId("executive-summary-section")).toBeInTheDocument();
    expect(screen.getByText("84 / 100")).toBeInTheDocument();
    expect(screen.getByText("ADEQUATE")).toBeInTheDocument();
    expect(screen.getByText("91%")).toBeInTheDocument();
    expect(screen.getByText(/Overall security posture rated as ADEQUATE/)).toBeInTheDocument();

    // Operational details section should NOT be present for Executive
    expect(screen.queryByTestId("operational-details-section")).not.toBeInTheDocument();
  });

  it("renders access restriction alert when user role is not SECURITY_OFFICER or EXECUTIVE", async () => {
    mockSessionUser = {
      data: {
        id: "admin-1",
        roles: [{ code: "ADMIN", name: "Administrator" }],
      },
      isPending: false,
    };

    renderDashboard();

    expect(
      await screen.findByText(
        "This security dashboard is available to Security Officers and Executives only.",
      ),
    ).toBeInTheDocument();
  });
});
