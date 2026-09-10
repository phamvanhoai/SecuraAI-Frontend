import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/feedback/toast";
import { SyncSchedulesTab } from "./sync-schedules-tab";

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute("open");
  };
});

describe("SyncSchedulesTab", () => {
  const fetchMock = vi.fn();
  const integrationId = "11111111-1111-4111-8111-111111111111";
  const schedId1 = "22222222-2222-4222-8222-222222222222";
  const schedId2 = "33333333-3333-4333-8333-333333333333";

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
          <SyncSchedulesTab integrationId={integrationId} />
        </ToastProvider>
      </QueryClientProvider>,
    );
  }

  it("renders existing schedules with humanized descriptions and Active badges", async () => {
    const mockData = {
      success: true,
      data: [
        {
          id: schedId1,
          integrationId,
          scheduleExpression: "*/15 * * * *",
          isActive: true,
          lastRunAt: "2026-09-01T12:00:00.000Z",
          nextRunAt: "2026-09-01T12:15:00.000Z",
          createdAt: "2026-09-01T00:00:00.000Z",
          updatedAt: "2026-09-01T12:00:00.000Z",
        },
        {
          id: schedId2,
          integrationId,
          scheduleExpression: "0 0 * * *",
          isActive: false,
          lastRunAt: null,
          nextRunAt: null,
          createdAt: "2026-09-01T00:00:00.000Z",
          updatedAt: "2026-09-01T12:00:00.000Z",
        },
      ],
    };

    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify(mockData), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    renderComponent();

    expect(
      screen.getByText("Automatic Log Synchronization Schedules"),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("*/15 * * * *")).toBeInTheDocument();
      expect(screen.getByText(/Runs every 15 minutes/i)).toBeInTheDocument();
      expect(screen.getByText("Active")).toBeInTheDocument();

      expect(screen.getByText("0 0 * * *")).toBeInTheDocument();
      expect(screen.getByText(/Runs daily at midnight/i)).toBeInTheDocument();
      expect(screen.getByText("Paused")).toBeInTheDocument();
    });
  });

  it("toggles schedule between Active and Paused", async () => {
    const mockList = {
      success: true,
      data: [
        {
          id: schedId1,
          integrationId,
          scheduleExpression: "*/15 * * * *",
          isActive: true,
          lastRunAt: null,
          nextRunAt: null,
          createdAt: "2026-09-01T00:00:00.000Z",
          updatedAt: "2026-09-01T12:00:00.000Z",
        },
      ],
    };

    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify(mockList), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    renderComponent();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /pause/i })).toBeInTheDocument();
    });

    const mockUpdated = {
      success: true,
      data: {
        id: schedId1,
        integrationId,
        scheduleExpression: "*/15 * * * *",
        isActive: false,
        lastRunAt: null,
        nextRunAt: null,
        createdAt: "2026-09-01T00:00:00.000Z",
        updatedAt: "2026-09-01T12:00:00.000Z",
      },
    };

    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify(mockUpdated), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    fireEvent.click(screen.getByRole("button", { name: /pause/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining(`/api/integrations/${integrationId}/schedules/${schedId1}`),
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ isActive: false }),
        }),
      );
    });
  });

  it("opens delete confirmation modal and confirms delete", async () => {
    const mockList = {
      success: true,
      data: [
        {
          id: schedId1,
          integrationId,
          scheduleExpression: "*/15 * * * *",
          isActive: true,
          lastRunAt: null,
          nextRunAt: null,
          createdAt: "2026-09-01T00:00:00.000Z",
          updatedAt: "2026-09-01T12:00:00.000Z",
        },
      ],
    };

    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify(mockList), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    renderComponent();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /delete schedule/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /delete schedule/i }));

    expect(screen.getByText("Confirm Delete Schedule")).toBeInTheDocument();

    const mockDeleted = {
      success: true,
      data: {
        id: schedId1,
        integrationId,
        scheduleExpression: "*/15 * * * *",
        isActive: true,
        lastRunAt: null,
        nextRunAt: null,
        createdAt: "2026-09-01T00:00:00.000Z",
        updatedAt: "2026-09-01T12:00:00.000Z",
      },
    };

    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify(mockDeleted), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    // Click confirm delete in dialog
    const confirmButtons = screen.getAllByRole("button", { name: /delete schedule/i });
    const modalDeleteBtn = confirmButtons[confirmButtons.length - 1]!;
    fireEvent.click(modalDeleteBtn);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining(`/api/integrations/${integrationId}/schedules/${schedId1}`),
        expect.objectContaining({ method: "DELETE" }),
      );
    });
  });
});
