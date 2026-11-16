import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const mockUseMappingOptions = vi.fn();
const mockMutateAsync = vi.fn();
const mockUseUpdateEventMapping = vi.fn(() => ({
  mutateAsync: mockMutateAsync,
  isPending: false,
}));
const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();

vi.mock("../hooks/use-normalized-events", () => ({
  useMappingOptions: () => mockUseMappingOptions(),
  useUpdateEventMapping: () => mockUseUpdateEventMapping(),
}));

vi.mock("@/components/feedback/toast", () => ({
  useToast: () => ({
    success: mockToastSuccess,
    error: mockToastError,
    info: vi.fn(),
    warning: vi.fn(),
  }),
}));

import { EditEntityMappingDialog } from "./edit-entity-mapping-dialog";
import type { NormalizedEventDetail } from "../schemas/normalized-event-schema";

const mockEvent: NormalizedEventDetail = {
  id: "33333333-3333-4333-8333-333333333333",
  eventSourceId: "11111111-1111-4111-8111-111111111111",
  eventSourceName: "Wazuh SIEM",
  eventSourceType: "WAZUH",
  ingestionBatchId: null,
  externalEventId: "EXT-100",
  eventFamily: "AUTHENTICATION",
  eventType: "user_login_success",
  schemaVersion: "1.0.0",
  occurredAt: "2026-10-02T10:00:00.000Z",
  ingestedAt: "2026-10-02T10:00:05.000Z",
  accountIdentifier: "jdoe@company.com",
  sourceIp: "192.168.1.50",
  destinationIp: "10.0.0.1",
  deviceIdentifier: "DEV-01",
  severity: "LOW",
  mappingStatus: "MAPPED",
  mappedUser: {
    id: "user-1",
    email: "jdoe@company.com",
    fullName: "John Doe",
  },
  mappedAsset: {
    id: "asset-1",
    name: "Corporate Laptop 01",
    assetCode: "AST-LAP-01",
    assetType: "LAPTOP",
    criticality: "MEDIUM",
  },
  anomalyCount: 0,
  createdAt: "2026-10-02T10:00:05.000Z",
  normalizedPayload: { action: "login" },
  activeMapping: {
    id: "map-1",
    eventId: "33333333-3333-4333-8333-333333333333",
    mappingMethod: "AUTO",
    confidence: 0.95,
    reason: "Auto-correlated from Active Directory login",
    isActive: true,
    supersedesMappingId: null,
    mappedAt: "2026-10-02T10:00:05.000Z",
    userId: "user-1",
    assetId: "asset-1",
    monitoredAccountId: "acc-1",
    mappedUser: {
      id: "user-1",
      email: "jdoe@company.com",
      fullName: "John Doe",
    },
    mappedAsset: {
      id: "asset-1",
      name: "Corporate Laptop 01",
      assetCode: "AST-LAP-01",
      assetType: "LAPTOP",
      criticality: "MEDIUM",
    },
    monitoredAccount: {
      id: "acc-1",
      accountIdentifier: "jdoe@company.com",
      sourceSystem: "Active Directory",
      displayName: "John Doe AD Account",
    },
    mappedBy: null,
    createdAt: "2026-10-02T10:00:05.000Z",
  },
  mappingHistory: [],
};

const mockMappingOptions = {
  users: [
    { id: "user-1", email: "jdoe@company.com", fullName: "John Doe" },
    { id: "user-2", email: "alice@company.com", fullName: "Alice Smith" },
  ],
  assets: [
    {
      id: "asset-1",
      name: "Corporate Laptop 01",
      assetCode: "AST-LAP-01",
      assetType: "LAPTOP",
      criticality: "MEDIUM",
    },
    {
      id: "asset-2",
      name: "Production Web Server",
      assetCode: "AST-SRV-02",
      assetType: "SERVER",
      criticality: "CRITICAL",
    },
  ],
  monitoredAccounts: [
    {
      id: "acc-1",
      accountIdentifier: "jdoe@company.com",
      sourceSystem: "Active Directory",
      displayName: "John Doe AD Account",
    },
  ],
};

beforeAll(() => {
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
    configurable: true,
    value(this: HTMLDialogElement) {
      this.setAttribute("open", "");
    },
  });
  Object.defineProperty(HTMLDialogElement.prototype, "close", {
    configurable: true,
    value(this: HTMLDialogElement) {
      this.removeAttribute("open");
      this.dispatchEvent(new Event("close"));
    },
  });
});

afterEach(cleanup);

describe("EditEntityMappingDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseMappingOptions.mockReturnValue({
      data: mockMappingOptions,
      isPending: false,
    });
  });

  it("renders mapping options and current event context", () => {
    render(
      <EditEntityMappingDialog
        event={mockEvent}
        isOpen={true}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText("Review & Correct Entity Mapping")).toBeInTheDocument();
    expect(screen.getByText("user_login_success")).toBeInTheDocument();
    expect(screen.getByText("jdoe@company.com")).toBeInTheDocument();
    expect(screen.getByText("192.168.1.50")).toBeInTheDocument();
    expect(screen.getByText("System Auto-Mapped")).toBeInTheDocument();

    // Select options should exist
    expect(screen.getByLabelText(/Associated User/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Associated Asset \/ Device/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Monitored Account Link/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Reason for Correction/i)).toBeInTheDocument();
  });

  it("filters users, assets, and monitored accounts via mini search and allows selecting and clearing", async () => {
    mockMutateAsync.mockResolvedValueOnce({
      success: true,
      data: {
        mapping: {
          id: "map-4",
          mappingMethod: "MANUAL",
          confidence: 0.95,
          reason: "Reassigned via searchable dropdown",
          isActive: true,
        },
      },
    });

    render(
      <EditEntityMappingDialog
        event={mockEvent}
        isOpen={true}
        onClose={vi.fn()}
      />,
    );

    // Filter Associated User to Alice Smith
    fireEvent.click(screen.getByRole("combobox", { name: /Associated User/i }));
    const userSearch = screen.getByPlaceholderText(/Search users by name or email/i);
    fireEvent.change(userSearch, { target: { value: "alice" } });

    expect(screen.getByText("1 of 2 matching")).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: /John Doe/i })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("option", { name: /Alice Smith/i }));
    expect(
      screen.getByRole("combobox", { name: /Associated User/i }),
    ).toHaveTextContent("Alice Smith (alice@company.com)");

    // Filter Associated Asset by code
    fireEvent.click(
      screen.getByRole("combobox", { name: /Associated Asset \/ Device/i }),
    );
    const assetSearch = screen.getByPlaceholderText(
      /Search assets by name, code, or type/i,
    );
    fireEvent.change(assetSearch, { target: { value: "AST-SRV-02" } });
    fireEvent.click(screen.getByRole("option", { name: /Production Web Server/i }));
    expect(
      screen.getByRole("combobox", { name: /Associated Asset \/ Device/i }),
    ).toHaveTextContent("Production Web Server [AST-SRV-02]");

    // Open Monitored Account Link and check empty search state, then clear it
    fireEvent.click(
      screen.getByRole("combobox", { name: /Monitored Account Link/i }),
    );
    const accountSearch = screen.getByPlaceholderText(
      /Search accounts by ID, source, or display name/i,
    );
    fireEvent.change(accountSearch, { target: { value: "nonexistent" } });
    expect(
      screen.getByText(/No matching options for “nonexistent”\./i),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Unassign monitored account/i }));
    expect(
      screen.getByRole("combobox", { name: /Monitored Account Link/i }),
    ).toHaveTextContent("— No Monitored Account Link —");

    fireEvent.change(screen.getByLabelText(/Reason for Correction/i), {
      target: { value: "Reassigned via searchable dropdown" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Save Corrected Mapping/i }));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        userId: "user-2",
        assetId: "asset-2",
        monitoredAccountId: null,
        reason: "Reassigned via searchable dropdown",
        confidence: 0.95,
      });
    });
  });

  it("requires reason before submitting mapping correction", async () => {
    render(
      <EditEntityMappingDialog
        event={mockEvent}
        isOpen={true}
        onClose={vi.fn()}
      />,
    );

    const submitBtn = screen.getByRole("button", { name: /Save Corrected Mapping/i });
    fireEvent.click(submitBtn);

    expect(
      await screen.findByText("Reason for mapping correction is required."),
    ).toBeInTheDocument();
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it("submits manual mapping correction and triggers success callback", async () => {
    const handleSuccess = vi.fn();
    const handleClose = vi.fn();
    mockMutateAsync.mockResolvedValueOnce({
      success: true,
      data: {
        mapping: {
          id: "map-2",
          mappingMethod: "MANUAL",
          confidence: 1.0,
          reason: "Verified user identity manually with IT Helpdesk ticket #402",
          isActive: true,
        },
      },
    });

    render(
      <EditEntityMappingDialog
        event={mockEvent}
        isOpen={true}
        onClose={handleClose}
        onSuccess={handleSuccess}
      />,
    );

    // Enter reason
    const reasonInput = screen.getByLabelText(/Reason for Correction/i);
    fireEvent.change(reasonInput, {
      target: { value: "Verified user identity manually with IT Helpdesk ticket #402" },
    });

    // Submit form
    const submitBtn = screen.getByRole("button", { name: /Save Corrected Mapping/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        userId: "user-1",
        assetId: "asset-1",
        monitoredAccountId: "acc-1",
        reason: "Verified user identity manually with IT Helpdesk ticket #402",
        confidence: 0.95,
      });
      expect(mockToastSuccess).toHaveBeenCalledWith(
        "Mapping updated",
        "Entity associations have been recorded successfully.",
      );
      expect(handleSuccess).toHaveBeenCalled();
      expect(handleClose).toHaveBeenCalled();
    });
  });

  it("validates that at least one entity is selected before submitting", async () => {
    const unmappedEvent: NormalizedEventDetail = {
      ...mockEvent,
      mappedUser: null,
      mappedAsset: null,
      activeMapping: null,
    };

    render(
      <EditEntityMappingDialog
        event={unmappedEvent}
        isOpen={true}
        onClose={vi.fn()}
      />,
    );

    // Enter reason
    const reasonInput = screen.getByLabelText(/Reason for Correction/i);
    fireEvent.change(reasonInput, {
      target: { value: "Trying to submit unmapped" },
    });

    // Submit form
    const submitBtn = screen.getByRole("button", { name: /Save Corrected Mapping/i });
    fireEvent.click(submitBtn);

    expect(
      await screen.findByText(
        "Please select at least one entity (User, Asset, or Monitored Account) to map.",
      ),
    ).toBeInTheDocument();
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it("updates confidence percentage score when typing custom value", async () => {
    mockMutateAsync.mockResolvedValueOnce({
      success: true,
      data: {
        mapping: {
          id: "map-3",
          mappingMethod: "MANUAL",
          confidence: 0.8,
          reason: "Confirmed 80% based on DHCP audit",
          isActive: true,
        },
      },
    });

    render(
      <EditEntityMappingDialog
        event={mockEvent}
        isOpen={true}
        onClose={vi.fn()}
      />,
    );

    // Type 80 in confidence input
    const confidenceInput = screen.getByLabelText(/Mapping Confidence Score/i);
    fireEvent.change(confidenceInput, { target: { value: "80" } });

    expect(screen.getByText(/80% — Probable/i)).toBeInTheDocument();

    // Enter reason
    const reasonInput = screen.getByLabelText(/Reason for Correction/i);
    fireEvent.change(reasonInput, {
      target: { value: "Confirmed 80% based on DHCP audit" },
    });

    // Submit form
    const submitBtn = screen.getByRole("button", { name: /Save Corrected Mapping/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          confidence: 0.8,
          reason: "Confirmed 80% based on DHCP audit",
        }),
      );
    });
  });
});
