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
    expect(screen.getByLabelText(/Reason for Correction/i)).toBeInTheDocument();
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
      await screen.findByText("Reason for Correction *"),
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
});
