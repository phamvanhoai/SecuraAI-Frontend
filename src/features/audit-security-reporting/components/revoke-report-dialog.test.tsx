import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/feedback/toast";
import { RevokeReportDialog } from "./revoke-report-dialog";
import type { ReportExportItem } from "../schemas/export-report-schema";

describe("RevokeReportDialog", () => {
  const fetchMock = vi.fn();

  const mockItem: ReportExportItem = {
    id: "aaaaaaaa-1111-4111-8111-111111111111",
    reportType: "RISK",
    format: "EXCEL",
    status: "COMPLETED",
    storageUri: "/api/v1/reports/exports/aaaaaaaa-1111-4111-8111-111111111111/download",
    requestedBy: {
      id: "bbbbbbbb-2222-4222-8222-222222222222",
      fullName: "Security Officer",
      role: "SECURITY_OFFICER",
    },
    filters: null,
    summary: { recordCount: 15 },
    downloadUrl: "/api/reports/exports/aaaaaaaa-1111-4111-8111-111111111111/download",
    isRevoked: false,
    generatedAt: "2026-10-14T10:05:00.000Z",
    createdAt: "2026-10-14T10:00:00.000Z",
  };

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    fetchMock.mockReset();
  });

  function renderDialog(props: {
    item: ReportExportItem | null;
    isOpen: boolean;
    onClose: () => void;
  }) {
    const client = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    return render(
      <QueryClientProvider client={client}>
        <ToastProvider>
          <RevokeReportDialog {...props} />
        </ToastProvider>
      </QueryClientProvider>,
    );
  }

  it("renders dialog details and submits revocation request with valid reason", async () => {
    const onClose = vi.fn();
    const mockRevokedResponse = {
      success: true,
      data: {
        ...mockItem,
        isRevoked: true,
        revokedAt: "2026-10-14T22:20:00.000Z",
        revokedBy: "Security Officer",
        revocationReason: "Filtered wrong date range from August instead of September",
      },
    };

    fetchMock.mockImplementation(() =>
      Promise.resolve(
        new Response(JSON.stringify(mockRevokedResponse), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    renderDialog({ item: mockItem, isOpen: true, onClose });

    expect(
      screen.getByRole("heading", { name: "Revoke Report Export" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Irreversible Compliance Action")).toBeInTheDocument();
    expect(screen.getByText("RISK")).toBeInTheDocument();

    const textarea = screen.getByLabelText(/Revocation Reason/i);
    const submitBtn = screen.getByRole("button", { name: /Confirm Revoke/i });

    // Initially disabled because reason is empty (< 5 chars)
    expect(submitBtn).toBeDisabled();

    // Type a reason less than 5 chars
    fireEvent.change(textarea, { target: { value: "Fail" } });
    expect(submitBtn).toBeDisabled();

    // Type a valid reason >= 5 chars
    fireEvent.change(textarea, {
      target: { value: "Filtered wrong date range from August instead of September" },
    });
    expect(submitBtn).not.toBeDisabled();

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        `/api/reports/exports/${mockItem.id}/revoke`,
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            reason: "Filtered wrong date range from August instead of September",
          }),
        }),
      );
    });

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });
});
