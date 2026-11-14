import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/feedback/toast";
import { ExportReportDialog } from "./export-report-dialog";

describe("ExportReportDialog", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    window.open = vi.fn();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    fetchMock.mockReset();
  });

  function renderDialog(props = { isOpen: true, onClose: vi.fn() }) {
    const client = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    return render(
      <QueryClientProvider client={client}>
        <ToastProvider>
          <ExportReportDialog {...props} />
        </ToastProvider>
      </QueryClientProvider>,
    );
  }

  it("renders dialog fields and submits export request", async () => {
    const onClose = vi.fn();
    const mockCreated = {
      success: true,
      data: {
        id: "11111111-1111-4111-8111-111111111111",
        reportType: "RISK",
        format: "EXCEL",
        status: "COMPLETED",
        storageUri: "/api/v1/reports/exports/11111111-1111-4111-8111-111111111111/download",
        requestedBy: {
          id: "22222222-2222-4222-8222-222222222222",
          fullName: "Security Officer",
          role: "SECURITY_OFFICER",
        },
        filters: null,
        summary: { recordCount: 10 },
        downloadUrl: "/api/reports/exports/11111111-1111-4111-8111-111111111111/download",
        generatedAt: "2026-10-13T10:05:00.000Z",
        createdAt: "2026-10-13T10:00:00.000Z",
      },
    };

    fetchMock.mockImplementation(() =>
      Promise.resolve(
        new Response(JSON.stringify(mockCreated), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    renderDialog({ isOpen: true, onClose });

    expect(
      screen.getByRole("heading", { name: "Export Security & Risk Report" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Report Type")).toBeInTheDocument();
    expect(screen.getByLabelText("Export Format")).toBeInTheDocument();

    const submitBtn = screen.getByRole("button", { name: /Generate Report/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/reports/exports",
        expect.objectContaining({
          method: "POST",
        }),
      );
    });

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });

  it("resets severity/status on report type change and resets fields when reopened", () => {
    const onClose = vi.fn();
    const client = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    const { rerender } = render(
      <QueryClientProvider client={client}>
        <ToastProvider>
          <ExportReportDialog isOpen={true} onClose={onClose} />
        </ToastProvider>
      </QueryClientProvider>,
    );

    const typeSelect = screen.getByLabelText("Report Type") as HTMLSelectElement;
    const severitySelect = screen.getByLabelText("Severity Level") as HTMLSelectElement;
    const statusSelect = screen.getByLabelText("Record Status") as HTMLSelectElement;

    fireEvent.change(severitySelect, { target: { value: "HIGH" } });
    fireEvent.change(statusSelect, { target: { value: "OPEN" } });
    expect(severitySelect.value).toBe("HIGH");
    expect(statusSelect.value).toBe("OPEN");

    fireEvent.change(typeSelect, { target: { value: "INCIDENT" } });
    expect(severitySelect.value).toBe("");
    expect(statusSelect.value).toBe("");

    rerender(
      <QueryClientProvider client={client}>
        <ToastProvider>
          <ExportReportDialog isOpen={false} onClose={onClose} />
        </ToastProvider>
      </QueryClientProvider>,
    );
    expect(screen.queryByLabelText("Report Type")).not.toBeInTheDocument();

    rerender(
      <QueryClientProvider client={client}>
        <ToastProvider>
          <ExportReportDialog isOpen={true} onClose={onClose} />
        </ToastProvider>
      </QueryClientProvider>,
    );

    expect((screen.getByLabelText("Report Type") as HTMLSelectElement).value).toBe("RISK");
  });
});
