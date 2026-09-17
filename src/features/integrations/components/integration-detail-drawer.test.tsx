import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { IntegrationDetailDrawer } from "./integration-detail-drawer";
import type { Integration } from "../schemas/integration-schema";

const mockIntegration: Integration = {
  id: "44444444-4444-4444-4444-444444444444",
  name: "Wazuh SIEM Enterprise",
  integrationType: "siem",
  baseUrl: "https://wazuh.local:55000",
  configuration: { apiUser: "wazuh-wui" },
  status: "error", // Simulates a live connection failure
  lastConnectedAt: "2026-09-17T08:00:00.000Z",
  createdByUserId: "11111111-1111-1111-1111-111111111111",
  createdAt: "2026-09-01T00:00:00.000Z",
  updatedAt: "2026-09-17T08:00:00.000Z",
};

const mutateAsyncMock = vi.fn();

vi.mock("../hooks/use-integrations", () => ({
  useIntegration: () => ({
    data: mockIntegration,
    isLoading: false,
    error: null,
  }),
  useUpdateIntegration: () => ({
    mutateAsync: mutateAsyncMock,
    isPending: false,
  }),
  useTestConnection: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useTriggerSync: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

vi.mock("@/components/feedback/toast", () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  }),
}));

describe("IntegrationDetailDrawer - State Decoupling & Edit Flow", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    // Mock HTMLDialogElement methods in jsdom
    HTMLDialogElement.prototype.showModal = function mockShowModal(this: HTMLDialogElement) {
      this.setAttribute("open", "");
    };
    HTMLDialogElement.prototype.close = function mockClose(this: HTMLDialogElement) {
      this.removeAttribute("open");
    };
  });

  it("displays both administrative state (Enabled) and connection health (Connection Error)", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <IntegrationDetailDrawer
          integrationId="44444444-4444-4444-4444-444444444444"
          onOpenChange={vi.fn()}
          open={true}
        />
      </QueryClientProvider>,
    );

    // Check title
    expect(screen.getAllByText("Wazuh SIEM Enterprise").length).toBeGreaterThanOrEqual(1);

    // Check dual badges: Enabled + Connection Error
    const enabledBadges = screen.getAllByText("Enabled");
    expect(enabledBadges.length).toBeGreaterThanOrEqual(1);

    const connectionErrorBadges = screen.getAllByText("Connection Error");
    expect(connectionErrorBadges.length).toBeGreaterThanOrEqual(1);
  });

  it("submits valid 'active' status when editing an integration with connection error status", async () => {
    mutateAsyncMock.mockResolvedValueOnce({
      ...mockIntegration,
      name: "Wazuh SIEM Updated",
    });

    render(
      <QueryClientProvider client={queryClient}>
        <IntegrationDetailDrawer
          integrationId="44444444-4444-4444-4444-444444444444"
          onOpenChange={vi.fn()}
          open={true}
        />
      </QueryClientProvider>,
    );

    // Click Edit button
    const editBtn = screen.getAllByRole("button", { name: /edit/i })[0]!;
    fireEvent.click(editBtn);

    // Verify form fields
    const nameInput = screen.getByLabelText(/integration name/i);
    const statusSelect = screen.getByLabelText(/integration state/i);

    expect(nameInput).toHaveValue("Wazuh SIEM Enterprise");
    expect(statusSelect).toHaveValue("active"); // Should default to active instead of throwing invalid enum error

    // Change name and submit
    fireEvent.change(nameInput, { target: { value: "Wazuh SIEM Production" } });

    const saveBtn = screen.getByRole("button", { name: /save changes/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(mutateAsyncMock).toHaveBeenCalledTimes(1);
      expect(mutateAsyncMock).toHaveBeenCalledWith({
        id: "44444444-4444-4444-4444-444444444444",
        input: {
          name: "Wazuh SIEM Production",
          baseUrl: "https://wazuh.local:55000",
          status: "active", // Never sends invalid 'error'
          configuration: { apiUser: "wazuh-wui" },
        },
      });
    });
  });

  it("submits 'disabled' when admin explicitly toggles Integration State to Disabled", async () => {
    mutateAsyncMock.mockResolvedValueOnce({
      ...mockIntegration,
      status: "disabled",
    });

    render(
      <QueryClientProvider client={queryClient}>
        <IntegrationDetailDrawer
          integrationId="44444444-4444-4444-4444-444444444444"
          onOpenChange={vi.fn()}
          open={true}
        />
      </QueryClientProvider>,
    );

    // Click Edit button
    const editBtn = screen.getAllByRole("button", { name: /edit/i })[0]!;
    fireEvent.click(editBtn);

    const statusSelect = screen.getByLabelText(/integration state/i);
    fireEvent.change(statusSelect, { target: { value: "disabled" } });

    const saveBtn = screen.getByRole("button", { name: /save changes/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(mutateAsyncMock).toHaveBeenCalledWith({
        id: "44444444-4444-4444-4444-444444444444",
        input: expect.objectContaining({
          status: "disabled",
        }),
      });
    });
  });
});
