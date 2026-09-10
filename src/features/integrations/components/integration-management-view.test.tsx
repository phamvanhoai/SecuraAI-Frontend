import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/feedback/toast";
import { IntegrationManagementView } from "./integration-management-view";

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute("open");
  };
});

describe("IntegrationManagementView", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
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
          <IntegrationManagementView />
        </ToastProvider>
      </QueryClientProvider>,
    );
  }

  it("renders heading, metric strip, and integration cards", async () => {
    const mockList = {
      success: true,
      data: {
        items: [
          {
            id: "11111111-1111-4111-8111-111111111111",
            name: "Splunk Enterprise SIEM",
            integrationType: "siem",
            baseUrl: "https://splunk.test.com:8089",
            status: "active",
            lastConnectedAt: "2026-09-01T12:00:00.000Z",
            createdAt: "2026-09-01T00:00:00.000Z",
            updatedAt: "2026-09-01T12:00:00.000Z",
          },
          {
            id: "22222222-2222-4222-8222-222222222222",
            name: "Fortinet FortiGate Firewall",
            integrationType: "firewall",
            baseUrl: "https://fortigate.test.com/api/v2",
            status: "active",
            lastConnectedAt: null,
            createdAt: "2026-09-01T00:00:00.000Z",
            updatedAt: "2026-09-01T00:00:00.000Z",
          },
        ],
        pagination: { total: 2, page: 1, limit: 12, totalPages: 1 },
      },
    };

    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify(mockList), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    renderView();

    expect(
      screen.getByRole("heading", { name: "Third-Party SIEM & Firewall Integrations" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Total Connections")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Splunk Enterprise SIEM")).toBeInTheDocument();
      expect(
        screen.getByText("Fortinet FortiGate Firewall"),
      ).toBeInTheDocument();
    });
  });

  it("opens the Connect Modal when clicking the primary action button", async () => {
    const user = userEvent.setup();
    const mockList = {
      success: true,
      data: {
        items: [],
        pagination: { total: 0, page: 1, limit: 12, totalPages: 0 },
      },
    };

    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify(mockList), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    renderView();

    const connectButtons = screen.getAllByRole("button", {
      name: /Connect SIEM \/ Firewall/i,
    });
    await user.click(connectButtons[0]!);

    expect(
      screen.getByRole("heading", { name: /Connect New SIEM \/ Firewall/i }),
    ).toBeInTheDocument();
  });
});
