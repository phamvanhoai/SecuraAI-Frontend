import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/feedback/toast";
import { ExportReportsView } from "./export-reports-view";

describe("ExportReportsView", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    fetchMock.mockReset();
  });

  function renderView() {
    const client = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    return render(
      <QueryClientProvider client={client}>
        <ToastProvider>
          <ExportReportsView />
        </ToastProvider>
      </QueryClientProvider>,
    );
  }

  it("renders page header, metric strip, and reports data table", async () => {
    const mockReports = {
      success: true,
      data: {
        items: [
          {
            id: "11111111-1111-4111-8111-111111111111",
            reportType: "RISK",
            format: "EXCEL",
            status: "COMPLETED",
            storageUri: "/api/v1/reports/exports/11111111-1111-4111-8111-111111111111/download",
            requestedBy: {
              id: "22222222-2222-4222-8222-222222222222",
              fullName: "Nguyen Van An",
              role: "SECURITY_OFFICER",
            },
            filters: { severity: "HIGH" },
            summary: {
              recordCount: 15,
              period: "All",
            },
            downloadUrl: "/api/reports/exports/11111111-1111-4111-8111-111111111111/download",
            generatedAt: "2026-10-13T10:05:00.000Z",
            createdAt: "2026-10-13T10:00:00.000Z",
          },
          {
            id: "33333333-3333-4333-8333-333333333333",
            reportType: "INCIDENT",
            format: "PDF",
            status: "COMPLETED",
            storageUri: "/api/v1/reports/exports/33333333-3333-4333-8333-333333333333/download",
            requestedBy: {
              id: "44444444-4444-4444-8444-444444444444",
              fullName: "Tran Thi B",
              role: "EXECUTIVE",
            },
            filters: null,
            summary: {
              recordCount: 8,
              period: "All",
            },
            downloadUrl: "/api/reports/exports/33333333-3333-4333-8333-333333333333/download",
            generatedAt: "2026-10-13T11:05:00.000Z",
            createdAt: "2026-10-13T11:00:00.000Z",
          },
        ],
        pagination: {
          page: 1,
          limit: 10,
          totalItems: 2,
          totalPages: 1,
        },
      },
    };

    fetchMock.mockImplementation(() =>
      Promise.resolve(
        new Response(JSON.stringify(mockReports), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    renderView();

    expect(
      screen.getByRole("heading", { name: "Security & Risk Reports" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Total Exports")).toBeInTheDocument();

    expect(
      await screen.findByText("Security Risk Register"),
    ).toBeInTheDocument();
    expect(
      await screen.findByText("Security Incident Records"),
    ).toBeInTheDocument();
    expect(screen.getByText("Nguyen Van An")).toBeInTheDocument();
    expect(screen.getByText("Tran Thi B")).toBeInTheDocument();
  });

  it("renders empty state when no report exports exist", async () => {
    const mockEmpty = {
      success: true,
      data: {
        items: [],
        pagination: {
          page: 1,
          limit: 10,
          totalItems: 0,
          totalPages: 1,
        },
      },
    };

    fetchMock.mockImplementation(() =>
      Promise.resolve(
        new Response(JSON.stringify(mockEmpty), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    renderView();

    expect(
      await screen.findByText("No report exports found"),
    ).toBeInTheDocument();
  });

  it("renders Revoked badge and disabled download button for revoked exports, and enforces SoD filter options", async () => {
    const mockReports = {
      success: true,
      data: {
        items: [
          {
            id: "aaaa1111-2222-4333-8444-555566667777",
            reportType: "RISK",
            format: "EXCEL",
            status: "COMPLETED",
            storageUri: "/api/v1/reports/exports/aaaa1111-2222-4333-8444-555566667777/download",
            requestedBy: {
              id: "22222222-2222-4222-8222-222222222222",
              fullName: "Security Officer",
              role: "SECURITY_OFFICER",
            },
            filters: { isRevoked: true },
            summary: { recordCount: 15 },
            downloadUrl: "/api/reports/exports/aaaa1111-2222-3333-444455556666/download",
            isRevoked: true,
            revokedAt: "2026-10-14T22:20:00.000Z",
            revokedBy: "Security Officer",
            revocationReason: "Filtered wrong date range",
            generatedAt: "2026-10-14T10:05:00.000Z",
            createdAt: "2026-10-14T10:00:00.000Z",
          },
        ],
        pagination: {
          page: 1,
          limit: 10,
          totalItems: 1,
          totalPages: 1,
        },
      },
    };

    fetchMock.mockImplementation(() =>
      Promise.resolve(
        new Response(JSON.stringify(mockReports), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    renderView();

    // Verify Revoked badge appears
    const revokeBadge = await screen.findByRole("button", {
      name: "View revocation details",
    });
    expect(revokeBadge).toBeInTheDocument();

    // Hover to trigger rich tooltip
    fireEvent.mouseEnter(revokeBadge);
    expect(await screen.findByText(/Filtered wrong date range/i)).toBeInTheDocument();

    // Verify Download button is disabled for revoked report
    const downloadBtn = screen.getByTitle(
      "This report export has been revoked and cannot be downloaded",
    );
    expect(downloadBtn).toBeDisabled();

    // Verify Separation of Duties: Investigation Logs is NOT an option in the filter
    expect(screen.queryByText(/Investigation Logs/i)).not.toBeInTheDocument();
    expect(screen.getByText("All Security Reports")).toBeInTheDocument();
  });
});
