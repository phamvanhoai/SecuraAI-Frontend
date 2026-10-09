import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockUseAuditLogs = vi.fn();
const mockUseAuditLogDetail = vi.fn();
const mockUseAuditLogDiff = vi.fn();

vi.mock("../hooks/use-audit-logs", () => ({
  useAuditLogs: (params?: unknown) => mockUseAuditLogs(params),
  useAuditLogDetail: (id?: string | null) => mockUseAuditLogDetail(id),
  useAuditLogDiff: (id?: string | null) => mockUseAuditLogDiff(id),
}));

import { AuditLogsManager } from "./audit-logs-manager";

const sampleAuditLog = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  actorType: "USER" as const,
  actorUserId: "550e8400-e29b-41d4-a716-446655440001",
  actorApiKeyId: null,
  actor: {
    id: "550e8400-e29b-41d4-a716-446655440001",
    type: "USER" as const,
    name: "Admin Superuser",
    email: "admin@securaai.internal",
    role: "ADMIN",
  },
  action: "UPDATE_USER_ROLE",
  resourceType: "users",
  resourceId: "550e8400-e29b-41d4-a716-446655440002",
  occurredAt: new Date().toISOString(),
  beforeData: { role: "EMPLOYEE" },
  afterData: { role: "SECURITY_OFFICER" },
  correlationId: "corr-12345",
  source: "web-ui",
  sourceIp: "192.168.1.100",
  userAgent: "Mozilla/5.0",
  previousHash: "prev-hash-123",
  recordHash: "rec-hash-45600000000000000000000000000000",
  createdAt: new Date().toISOString(),
};

const sampleDiffData = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  action: "UPDATE_USER_ROLE",
  resourceType: "users",
  resourceId: "550e8400-e29b-41d4-a716-446655440002",
  occurredAt: new Date().toISOString(),
  totalProperties: 1,
  totalModified: 1,
  totalAdded: 0,
  totalRemoved: 0,
  totalUnchanged: 0,
  hasChanges: true,
  changes: [
    {
      property: "role",
      changeType: "MODIFIED" as const,
      beforeValue: "EMPLOYEE",
      afterValue: "SECURITY_OFFICER",
    },
  ],
};

describe("AuditLogsManager Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
      },
    });
    mockUseAuditLogs.mockReturnValue({
      isLoading: false,
      isFetching: false,
      isError: false,
      data: {
        items: [sampleAuditLog],
        pagination: { page: 1, limit: 20, totalItems: 1, totalPages: 1 },
      },
      refetch: vi.fn(),
    });
    mockUseAuditLogDetail.mockReturnValue({
      data: sampleAuditLog,
      isLoading: false,
      isError: false,
    });
    mockUseAuditLogDiff.mockReturnValue({
      data: sampleDiffData,
      isLoading: false,
      isError: false,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("renders header and audit log table rows with key details", () => {
    render(<AuditLogsManager />);

    expect(
      screen.getByRole("heading", { name: /System Audit Logs/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("UPDATE_USER_ROLE")).toBeInTheDocument();
    expect(screen.getByText("Admin Superuser")).toBeInTheDocument();
    expect(screen.getByText("admin@securaai.internal")).toBeInTheDocument();
    expect(screen.getByText("192.168.1.100")).toBeInTheDocument();
    expect(screen.getByText("users")).toBeInTheDocument();
  });

  it("updates search query and opens filter drawer", async () => {
    const { fireEvent } = await import("@testing-library/react");
    render(<AuditLogsManager />);

    const searchInput = screen.getByPlaceholderText(
      /Search by action, resource, IP, user, correlation ID/i,
    );
    fireEvent.change(searchInput, { target: { value: "LOGIN_FAILED" } });

    expect(mockUseAuditLogs).toHaveBeenCalledWith(
      expect.objectContaining({
        search: "LOGIN_FAILED",
      }),
    );

    const filterButton = screen.getByRole("button", { name: /Filters/i });
    fireEvent.click(filterButton);

    expect(screen.getByLabelText(/Actor Type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Action Type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Affected Resource/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Correlation ID/i)).toBeInTheDocument();
  });

  it("opens audit log detail dialog when clicking the Eye action button", async () => {
    const { fireEvent } = await import("@testing-library/react");
    render(<AuditLogsManager />);

    const viewButton = screen.getByRole("button", {
      name: /View details for UPDATE_USER_ROLE/i,
    });
    fireEvent.click(viewButton);

    expect(
      screen.getByRole("heading", { name: /Audit Record Details/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Cryptographic Hash Chain \(SHA-256\)/i),
    ).toBeInTheDocument();
    expect(screen.getByText("corr-12345")).toBeInTheDocument();
  });

  it("opens before/after changes diff dialog when clicking the FileDiff action button", async () => {
    const { fireEvent } = await import("@testing-library/react");
    render(<AuditLogsManager />);

    const diffButton = screen.getByRole("button", {
      name: /View before\/after changes for UPDATE_USER_ROLE/i,
    });
    fireEvent.click(diffButton);

    expect(
      screen.getByRole("heading", { name: /View Before \/ After Changes/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("MODIFIED")).toBeInTheDocument();
    expect(screen.getByText("role")).toBeInTheDocument();
    expect(screen.getByText("EMPLOYEE")).toBeInTheDocument();
    expect(screen.getByText("SECURITY_OFFICER")).toBeInTheDocument();
  });
});


