import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/api-error";

const { mockUseStatus, mockMutateAsync, mockUseRunMutation, mockSessionUser, mockToast } =
  vi.hoisted(() => ({
    mockUseStatus: vi.fn(),
    mockMutateAsync: vi.fn(),
    mockUseRunMutation: vi.fn(),
    mockSessionUser: vi.fn(() => ({
      data: { roles: [{ code: "ADMIN", name: "Administrator" }] },
      isPending: false,
    })),
    mockToast: {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
      info: vi.fn(),
    },
  }));

vi.mock("@/features/authentication-account", () => ({
  useSessionUser: () => mockSessionUser(),
}));

vi.mock("../hooks/use-retention-purge", () => ({
  useRetentionPurgeStatus: (options?: unknown) => mockUseStatus(options),
  useRunRetentionPurge: () => mockUseRunMutation(),
}));

vi.mock("@/components/feedback/toast", () => ({
  useToast: () => mockToast,
}));

import { RetentionPurgeDialog } from "./retention-purge-dialog";

const sampleStatus = {
  enabled: true,
  workerActive: true,
  running: false,
  intervalMs: 3_600_000,
  batchSize: 200,
  maxBatchesPerRun: 50,
  runOnStartup: false,
  effectivePolicies: [
    {
      eventFamily: "AUTHENTICATION" as const,
      eligible: true,
      reason: "ACTIVE_POLICY" as const,
      retentionDays: 90,
      cutoffDate: "2026-08-28T00:00:00.000Z",
      policyIds: ["pol-auth"],
      policyNames: ["Auth 90d"],
    },
    {
      eventFamily: "VPN_SSO" as const,
      eligible: false,
      reason: "DELETION_DISABLED" as const,
      retentionDays: 180,
      cutoffDate: "2026-05-30T00:00:00.000Z",
      policyIds: ["pol-vpn"],
      policyNames: ["VPN Hold"],
    },
  ],
  lastRun: null,
  recentRuns: [
    {
      id: "11111111-1111-4111-8111-111111111111",
      occurredAt: "2026-11-26T09:00:00.000Z",
      actorType: "SYSTEM",
      actorUserId: null,
      source: "WORKER",
      outcome: "SUCCESS",
      summary: {
        totalDeletedNormalizedEvents: 14,
        totalDeletedInvalidEvents: 2,
        totalProtectedEvents: 5,
      },
    },
  ],
};

describe("RetentionPurgeDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSessionUser.mockReturnValue({
      data: { roles: [{ code: "ADMIN", name: "Administrator" }] },
      isPending: false,
    });
    mockUseStatus.mockReturnValue({
      data: sampleStatus,
      isPending: false,
      isError: false,
      isFetching: false,
      error: null,
      refetch: vi.fn(),
    });
    mockUseRunMutation.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
      variables: undefined,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("hides completely when user is not ADMIN", () => {
    mockSessionUser.mockReturnValue({
      data: { roles: [{ code: "SECURITY_OFFICER", name: "Security Officer" }] },
      isPending: false,
    });

    render(<RetentionPurgeDialog isOpen={true} onClose={vi.fn()} />);

    expect(screen.queryByText("Automated Retention Purge")).not.toBeInTheDocument();
    expect(mockUseStatus).toHaveBeenCalledWith({ enabled: false });
  });

  it("does not fetch status when dialog is closed", () => {
    render(<RetentionPurgeDialog isOpen={false} onClose={vi.fn()} />);

    expect(mockUseStatus).toHaveBeenCalledWith({ enabled: false });
  });

  it("renders worker status, effective policies, and recent audited runs when open", () => {
    render(<RetentionPurgeDialog isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText("Automated Retention Purge")).toBeInTheDocument();
    expect(screen.getByText("Worker Active")).toBeInTheDocument();
    expect(screen.getByText("Every 1 hour")).toBeInTheDocument();
    expect(screen.getByText("Auth 90d")).toBeInTheDocument();
    expect(screen.getByText("Deletion disabled")).toBeInTheDocument();
    expect(screen.getByText(/SYSTEM · WORKER/)).toBeInTheDocument();
    expect(screen.getByText("14")).toBeInTheDocument();
  });

  it("renders error alert with retry when status fetch fails", async () => {
    const refetchMock = vi.fn();
    mockUseStatus.mockReturnValue({
      data: undefined,
      isPending: false,
      isError: true,
      isFetching: false,
      error: new Error("Network failure"),
      refetch: refetchMock,
    });

    const user = userEvent.setup();
    render(<RetentionPurgeDialog isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText(/Failed to load retention purge status/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Retry/i }));
    expect(refetchMock).toHaveBeenCalledTimes(1);
  });

  it("executes dry-run preview directly and displays preview results", async () => {
    mockMutateAsync.mockResolvedValue({
      status: "DRY_RUN",
      trigger: "MANUAL",
      dryRun: true,
      startedAt: "2026-11-26T10:00:00.000Z",
      completedAt: "2026-11-26T10:00:00.400Z",
      durationMs: 400,
      totalDeletedNormalizedEvents: 18,
      totalDeletedInvalidEvents: 4,
      totalProtectedEvents: 6,
      families: [
        {
          eventFamily: "AUTHENTICATION",
          eligible: true,
          reason: "ACTIVE_POLICY",
          retentionDays: 90,
          cutoffDate: "2026-08-28T00:00:00.000Z",
          policyIds: ["pol-auth"],
          batchesExecuted: 0,
          deletedNormalizedEvents: 18,
          deletedDetections: 0,
          deletedFeatureContributions: 0,
          deletedMappings: 0,
          deletedDetectionJobs: 0,
          deletedInvalidEvents: 4,
          protectedByAlertOrIncident: 6,
          hasMore: false,
        },
      ],
    });

    const user = userEvent.setup();
    render(<RetentionPurgeDialog isOpen={true} onClose={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /Preview \(Dry-run\)/i }));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({ dryRun: true });
    });
    expect(screen.getByText("Dry-run Preview Result")).toBeInTheDocument();
    expect(screen.getAllByText("18").length).toBeGreaterThanOrEqual(1);
    expect(mockToast.info).toHaveBeenCalled();
  });

  it("reveals inline confirmation and runs manual purge with custom options", async () => {
    mockMutateAsync.mockResolvedValue({
      status: "COMPLETED",
      trigger: "MANUAL",
      dryRun: false,
      startedAt: "2026-11-26T10:05:00.000Z",
      completedAt: "2026-11-26T10:05:01.000Z",
      durationMs: 1000,
      totalDeletedNormalizedEvents: 25,
      totalDeletedInvalidEvents: 1,
      totalProtectedEvents: 3,
      families: [],
    });

    const user = userEvent.setup();
    render(<RetentionPurgeDialog isOpen={true} onClose={vi.fn()} />);

    await user.selectOptions(
      screen.getByLabelText("Event family scope"),
      "AUTHENTICATION",
    );
    await user.type(screen.getByLabelText("Batch size (10–1000)"), "150");
    await user.type(screen.getByLabelText("Max batches (1–100)"), "10");

    await user.click(screen.getByRole("button", { name: /Run purge now/i }));
    expect(screen.getByText("Confirm permanent deletion")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Confirm & Purge/i }));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        dryRun: false,
        eventFamily: "AUTHENTICATION",
        batchSize: 150,
        maxBatches: 10,
      });
    });
    expect(mockToast.success).toHaveBeenCalled();
  });

  it("shows inline validation error when batchSize is out of range", async () => {
    const user = userEvent.setup();
    render(<RetentionPurgeDialog isOpen={true} onClose={vi.fn()} />);

    await user.type(screen.getByLabelText("Batch size (10–1000)"), "5");
    await user.click(screen.getByRole("button", { name: /Preview \(Dry-run\)/i }));

    expect(
      screen.getByText("Batch size must be a whole number between 10 and 1000"),
    ).toBeInTheDocument();
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it("shows warning toast when backend reports 409 purge lock conflict", async () => {
    mockMutateAsync.mockRejectedValue(
      new ApiError(
        "A retention purge job is already holding the database advisory lock",
        409,
        "CONFLICT",
      ),
    );

    const user = userEvent.setup();
    render(<RetentionPurgeDialog isOpen={true} onClose={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /Preview \(Dry-run\)/i }));

    await waitFor(() => {
      expect(mockToast.warning).toHaveBeenCalledWith(
        "Retention purge already running",
        "A retention purge job is already holding the database advisory lock",
      );
    });
  });

  it("calls onClose when clicking Close button", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<RetentionPurgeDialog isOpen={true} onClose={onClose} />);

    await user.click(screen.getByRole("button", { name: /^Close$/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
