"use client";

import {
  AlertTriangle,
  Clock,
  Eye,
  History,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { DataTable, type DataTableColumn } from "@/components/data-display/data-table";
import { StatusBadge } from "@/components/data-display/static-product";
import { useToast } from "@/components/feedback/toast";
import { FormField } from "@/components/forms/form-field";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { TableSkeleton } from "@/components/ui/skeleton";
import { useSessionUser } from "@/features/authentication-account";
import { ApiError } from "@/lib/api/api-error";
import { useRetentionPurgeStatus, useRunRetentionPurge } from "../hooks/use-retention-purge";
import type { GovernanceEventFamily } from "../schemas/event-governance-schema";
import {
  runRetentionPurgePayloadSchema,
  type EffectiveFamilyRetentionPolicy,
  type RetentionPurgeFamilyResult,
  type RetentionPurgeHistoryItem,
  type RetentionPurgeRunResult,
  type RunRetentionPurgeInput,
} from "../schemas/retention-purge-schema";

export type RetentionPurgeDialogProps = {
  isOpen: boolean;
  onClose: () => void;
};

const familyLabels: Record<GovernanceEventFamily, string> = {
  AUTHENTICATION: "Authentication",
  VPN_SSO: "VPN / SSO",
  APPLICATION_ACCESS: "Application Access",
};

const reasonMeta: Record<
  EffectiveFamilyRetentionPolicy["reason"],
  { label: string; tone: "success" | "warning" | "neutral" }
> = {
  ACTIVE_POLICY: { label: "Eligible for purge", tone: "success" },
  DELETION_DISABLED: { label: "Deletion disabled", tone: "warning" },
  NO_ACTIVE_POLICY: { label: "No active policy", tone: "neutral" },
};

function formatIntervalLabel(intervalMs: number): string {
  if (intervalMs >= 3_600_000 && intervalMs % 3_600_000 === 0) {
    const hours = intervalMs / 3_600_000;
    return `Every ${hours} ${hours === 1 ? "hour" : "hours"}`;
  }
  if (intervalMs >= 60_000 && intervalMs % 60_000 === 0) {
    const minutes = intervalMs / 60_000;
    return `Every ${minutes} ${minutes === 1 ? "minute" : "minutes"}`;
  }
  return `Every ${Math.round(intervalMs / 1000)}s`;
}

function formatTimestamp(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;
  return date.toLocaleString();
}

function readSummaryNumber(
  summary: Record<string, unknown> | null,
  key: string,
): number | null {
  if (!summary) return null;
  const value = summary[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function RetentionPurgeDialog({ isOpen, onClose }: RetentionPurgeDialogProps) {
  const toast = useToast();
  const sessionQuery = useSessionUser();
  const isAdmin =
    sessionQuery.data?.roles.some((role) => role.code === "ADMIN") ?? false;

  const statusQuery = useRetentionPurgeStatus({ enabled: isAdmin && isOpen });
  const runMutation = useRunRetentionPurge();

  const [eventFamily, setEventFamily] = useState<"ALL" | GovernanceEventFamily>("ALL");
  const [batchSizeDraft, setBatchSizeDraft] = useState("");
  const [maxBatchesDraft, setMaxBatchesDraft] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    batchSize?: string | undefined;
    maxBatches?: string | undefined;
  }>({});
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmingPurge, setConfirmingPurge] = useState(false);
  const [latestResult, setLatestResult] = useState<RetentionPurgeRunResult | null>(null);

  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      if (typeof dialog.showModal === "function") {
        dialog.showModal();
      } else {
        dialog.setAttribute("open", "");
      }
    }

    if (!isOpen && dialog.open) {
      if (typeof dialog.close === "function") {
        dialog.close();
      } else {
        dialog.removeAttribute("open");
      }
    }
  }, [isOpen]);

  if (!isAdmin) {
    return null;
  }

  function handleClose(): void {
    if (runMutation.isPending) return;
    setConfirmingPurge(false);
    setActionError(null);
    onClose();
  }

  function validateAndBuildPayload(dryRun: boolean): RunRetentionPurgeInput | null {
    setActionError(null);
    const errors: { batchSize?: string; maxBatches?: string } = {};

    let parsedBatchSize: number | undefined;
    const trimmedBatch = batchSizeDraft.trim();
    if (trimmedBatch) {
      const numeric = Number(trimmedBatch);
      if (!Number.isInteger(numeric) || numeric < 10 || numeric > 1000) {
        errors.batchSize = "Batch size must be a whole number between 10 and 1000";
      } else {
        parsedBatchSize = numeric;
      }
    }

    let parsedMaxBatches: number | undefined;
    const trimmedMax = maxBatchesDraft.trim();
    if (trimmedMax) {
      const numeric = Number(trimmedMax);
      if (!Number.isInteger(numeric) || numeric < 1 || numeric > 100) {
        errors.maxBatches = "Max batches must be a whole number between 1 and 100";
      } else {
        parsedMaxBatches = numeric;
      }
    }

    if (errors.batchSize || errors.maxBatches) {
      setFieldErrors(errors);
      return null;
    }

    setFieldErrors({});

    const candidate: RunRetentionPurgeInput = {
      dryRun,
      ...(eventFamily !== "ALL" ? { eventFamily } : {}),
      ...(parsedBatchSize !== undefined ? { batchSize: parsedBatchSize } : {}),
      ...(parsedMaxBatches !== undefined ? { maxBatches: parsedMaxBatches } : {}),
    };

    const parsed = runRetentionPurgePayloadSchema.safeParse(candidate);
    if (!parsed.success) {
      setActionError(parsed.error.issues[0]?.message ?? "Invalid retention purge options");
      return null;
    }

    return candidate;
  }

  async function executePurge(dryRun: boolean): Promise<void> {
    const payload = validateAndBuildPayload(dryRun);
    if (!payload) return;

    try {
      const result = await runMutation.mutateAsync(payload);
      setLatestResult(result);
      setConfirmingPurge(false);

      if (result.status === "DRY_RUN") {
        toast.info(
          "Dry-run preview completed",
          `${result.totalDeletedNormalizedEvents} expired normalized event(s) and ${result.totalDeletedInvalidEvents} invalid event(s) eligible; ${result.totalProtectedEvents} protected.`,
        );
        return;
      }

      if (result.status === "SKIPPED_LOCKED") {
        toast.warning(
          "Retention purge skipped",
          "Another retention purge run already holds the database lock.",
        );
        return;
      }

      toast.success(
        "Retention purge completed",
        `Deleted ${result.totalDeletedNormalizedEvents} normalized event(s) and ${result.totalDeletedInvalidEvents} invalid event(s); preserved ${result.totalProtectedEvents} protected record(s).`,
      );
    } catch (error: unknown) {
      setConfirmingPurge(false);
      if (error instanceof ApiError) {
        setActionError(error.message);
        if (error.status === 409) {
          toast.warning("Retention purge already running", error.message);
        } else {
          toast.error("Retention purge failed", error.message);
        }
        return;
      }

      const fallbackMessage =
        error instanceof Error
          ? error.message
          : "Unable to execute retention purge job.";
      setActionError(fallbackMessage);
      toast.error("Retention purge failed", fallbackMessage);
    }
  }

  function handleRequestConfirm(): void {
    const valid = validateAndBuildPayload(false);
    if (!valid) return;
    setConfirmingPurge(true);
  }

  const effectiveColumns: readonly DataTableColumn<EffectiveFamilyRetentionPolicy>[] = [
    {
      key: "eventFamily",
      header: "Event family",
      cell: (item) => (
        <span className="text-foreground text-xs font-semibold">
          {familyLabels[item.eventFamily]}
        </span>
      ),
    },
    {
      key: "reason",
      header: "Purge eligibility",
      cell: (item) => {
        const meta = reasonMeta[item.reason];
        return <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>;
      },
    },
    {
      key: "retentionDays",
      header: "Effective retention",
      cell: (item) =>
        item.retentionDays !== null ? (
          <span className="text-foreground text-xs font-medium">
            {item.retentionDays} days
          </span>
        ) : (
          <span className="text-muted text-xs">—</span>
        ),
    },
    {
      key: "cutoffDate",
      header: "Expiration cutoff",
      cell: (item) =>
        item.cutoffDate ? (
          <span className="text-muted font-mono text-xs">
            {formatTimestamp(item.cutoffDate)}
          </span>
        ) : (
          <span className="text-muted text-xs">Not scheduled</span>
        ),
    },
    {
      key: "policyNames",
      header: "Applied policies",
      cell: (item) =>
        item.policyNames.length > 0 ? (
          <span className="text-foreground text-xs">
            {item.policyNames.join(", ")}
          </span>
        ) : (
          <span className="text-muted text-xs">None</span>
        ),
    },
  ];

  const statusData = statusQuery.data;
  const displayedRun = latestResult ?? statusData?.lastRun ?? null;
  const recentRuns = statusData?.recentRuns ?? [];

  return (
    <Dialog
      title="Automated Retention Purge"
      dialogRef={dialogRef}
      onCancel={(e) => {
        e.preventDefault();
        handleClose();
      }}
      onClose={handleClose}
      className="max-h-[calc(100dvh-2rem)] w-[min(56rem,calc(100%-2rem))] overflow-y-auto"
    >
      {isOpen ? (
        <div className="space-y-5">
          <p className="text-muted text-xs leading-5">
            Inspect the scheduled retention enforcement worker, preview expired records with
            dry-run, or trigger an audited manual purge while preserving alert and incident
            evidence.
          </p>

          {statusQuery.isPending ? (
            <TableSkeleton rows={3} />
          ) : statusQuery.isError ? (
            <Alert>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span>
                  Failed to load retention purge status. {statusQuery.error?.message}
                </span>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => void statusQuery.refetch?.()}
                  className="min-h-8 gap-1.5 px-2.5 text-xs"
                >
                  <RefreshCw className="size-3.5" />
                  <span>Retry</span>
                </Button>
              </div>
            </Alert>
          ) : statusData ? (
            <>
              {/* Worker Schedule Posture */}
              <div className="border-border bg-neutral-soft/30 flex flex-wrap items-center justify-between gap-4 rounded-lg border p-3.5">
                <div className="flex flex-wrap items-center gap-2.5">
                  <StatusBadge
                    tone={
                      statusData.workerActive
                        ? "success"
                        : statusData.enabled
                          ? "warning"
                          : "neutral"
                    }
                  >
                    {statusData.workerActive
                      ? "Worker Active"
                      : statusData.enabled
                        ? "Worker Standby"
                        : "Schedule Disabled"}
                  </StatusBadge>
                  {statusData.running ? (
                    <StatusBadge tone="info">Purge Running</StatusBadge>
                  ) : null}
                  <span className="text-muted inline-flex items-center gap-1.5 text-xs">
                    <Clock className="size-3.5" />
                    <span>{formatIntervalLabel(statusData.intervalMs)}</span>
                  </span>
                  <span className="text-muted text-xs">
                    • Default batch:{" "}
                    <strong className="text-foreground">{statusData.batchSize}</strong>
                  </span>
                  <span className="text-muted text-xs">
                    • Max batches/run:{" "}
                    <strong className="text-foreground">{statusData.maxBatchesPerRun}</strong>
                  </span>
                  <span className="text-muted text-xs">
                    • Run on startup:{" "}
                    <strong className="text-foreground">
                      {statusData.runOnStartup ? "Yes" : "No"}
                    </strong>
                  </span>
                </div>

                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => void statusQuery.refetch?.()}
                  disabled={statusQuery.isFetching || runMutation.isPending}
                  className="min-h-8 gap-1.5 px-3 text-xs"
                >
                  <RefreshCw
                    className={`size-3.5 ${statusQuery.isFetching ? "animate-spin" : ""}`}
                  />
                  <span>Refresh status</span>
                </Button>
              </div>

              {/* Manual / Dry-run Controls */}
              <div className="border-border bg-surface-subtle/20 space-y-4 rounded-lg border p-4">
                <div>
                  <h3 className="text-foreground text-sm font-semibold">
                    Manual execution & dry-run preview
                  </h3>
                  <p className="text-muted mt-0.5 text-xs">
                    Dry-run counts eligible expired records without modifying database tables.
                    Events linked to AI alerts or incident evidence are always preserved.
                  </p>
                </div>

                {actionError ? <Alert>{actionError}</Alert> : null}

                <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-3">
                  <FormField id="retention-purge-family" label="Event family scope">
                    <Select
                      id="retention-purge-family"
                      value={eventFamily}
                      onChange={(e) => {
                        setEventFamily(e.target.value as "ALL" | GovernanceEventFamily);
                        setConfirmingPurge(false);
                      }}
                      disabled={runMutation.isPending}
                      className="min-h-10 text-xs"
                    >
                      <option value="ALL">All active event families</option>
                      <option value="AUTHENTICATION">Authentication</option>
                      <option value="VPN_SSO">VPN / SSO</option>
                      <option value="APPLICATION_ACCESS">Application Access</option>
                    </Select>
                  </FormField>

                  <FormField
                    id="retention-purge-batch-size"
                    label="Batch size (10-1000)"
                    error={fieldErrors.batchSize}
                  >
                    <Input
                      id="retention-purge-batch-size"
                      type="number"
                      min={10}
                      max={1000}
                      value={batchSizeDraft}
                      onChange={(e) => {
                        setBatchSizeDraft(e.target.value);
                        setConfirmingPurge(false);
                        if (fieldErrors.batchSize) {
                          setFieldErrors((prev) => ({ ...prev, batchSize: undefined }));
                        }
                      }}
                      placeholder={`Default (${statusData.batchSize})`}
                      disabled={runMutation.isPending}
                      className="min-h-10 text-xs"
                    />
                  </FormField>

                  <FormField
                    id="retention-purge-max-batches"
                    label="Max batches (1-100)"
                    error={fieldErrors.maxBatches}
                  >
                    <Input
                      id="retention-purge-max-batches"
                      type="number"
                      min={1}
                      max={100}
                      value={maxBatchesDraft}
                      onChange={(e) => {
                        setMaxBatchesDraft(e.target.value);
                        setConfirmingPurge(false);
                        if (fieldErrors.maxBatches) {
                          setFieldErrors((prev) => ({ ...prev, maxBatches: undefined }));
                        }
                      }}
                      placeholder={`Default (${statusData.maxBatchesPerRun})`}
                      disabled={runMutation.isPending}
                      className="min-h-10 text-xs"
                    />
                  </FormField>
                </div>

                {confirmingPurge ? (
                  <div
                    className="bg-amber-500/10 text-amber-900 dark:text-amber-200 space-y-3 rounded-lg border border-amber-500/30 p-3.5 text-xs"
                    role="region"
                    aria-label="Confirm retention purge execution"
                  >
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
                      <div className="space-y-1">
                        <p className="font-semibold">Confirm permanent deletion</p>
                        <p className="leading-relaxed">
                          This will permanently delete expired{" "}
                          <strong className="font-semibold">normalized events</strong> (and
                          non-alerted detections, entity mappings, and detection jobs) plus expired{" "}
                          <strong className="font-semibold">invalid events</strong> for{" "}
                          <strong className="font-semibold">
                            {eventFamily === "ALL"
                              ? "All active event families"
                              : familyLabels[eventFamily]}
                          </strong>{" "}
                          (batch size:{" "}
                          <strong className="font-semibold">
                            {batchSizeDraft.trim() || `${statusData.batchSize} default`}
                          </strong>
                          , max batches:{" "}
                          <strong className="font-semibold">
                            {maxBatchesDraft.trim() || `${statusData.maxBatchesPerRun} default`}
                          </strong>
                          ). Records linked to AI alerts or incident evidence are preserved.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setConfirmingPurge(false)}
                        disabled={runMutation.isPending}
                        className="min-h-8 px-3 text-xs"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        variant="danger"
                        onClick={() => void executePurge(false)}
                        disabled={runMutation.isPending}
                        className="min-h-8 gap-1.5 px-3 text-xs"
                      >
                        {runMutation.isPending && !runMutation.variables?.dryRun ? (
                          <>
                            <Loader2 className="size-3.5 animate-spin" />
                            <span>Purging...</span>
                          </>
                        ) : (
                          <>
                            <Trash2 className="size-3.5" />
                            <span>Confirm & Purge</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center justify-end gap-2.5 pt-1">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => void executePurge(true)}
                      disabled={runMutation.isPending}
                      className="min-h-9 gap-1.5 px-3.5 text-xs"
                    >
                      {runMutation.isPending && runMutation.variables?.dryRun ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Eye className="size-3.5" />
                      )}
                      <span>Preview (Dry-run)</span>
                    </Button>

                    <Button
                      type="button"
                      variant="danger"
                      onClick={handleRequestConfirm}
                      disabled={runMutation.isPending}
                      className="min-h-9 gap-1.5 px-3.5 text-xs"
                    >
                      <Trash2 className="size-3.5" />
                      <span>Run purge now</span>
                    </Button>
                  </div>
                )}
              </div>

              {/* Latest Execution / Dry-run Result */}
              {displayedRun ? (
                <div
                  className="border-border bg-neutral-soft/20 space-y-3 rounded-lg border p-4"
                  aria-label="Latest retention purge result"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge
                        tone={
                          displayedRun.status === "COMPLETED"
                            ? "success"
                            : displayedRun.status === "DRY_RUN"
                              ? "info"
                              : "warning"
                        }
                      >
                        {displayedRun.status}
                      </StatusBadge>
                      <span className="text-foreground text-xs font-semibold">
                        {displayedRun.dryRun
                          ? "Dry-run Preview Result"
                          : "Latest Purge Execution"}
                      </span>
                      <span className="text-muted text-xs">
                        • Trigger: {displayedRun.trigger} • Duration: {displayedRun.durationMs} ms
                      </span>
                    </div>
                    <span className="text-muted text-xs">
                      {formatTimestamp(displayedRun.completedAt)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="border-border bg-surface rounded-md border p-3">
                      <p className="text-muted text-[11px] font-medium">
                        {displayedRun.dryRun
                          ? "Normalized events eligible"
                          : "Normalized events deleted"}
                      </p>
                      <p className="text-foreground mt-1 text-lg font-semibold tabular-nums">
                        {displayedRun.totalDeletedNormalizedEvents}
                      </p>
                    </div>
                    <div className="border-border bg-surface rounded-md border p-3">
                      <p className="text-muted text-[11px] font-medium">
                        {displayedRun.dryRun
                          ? "Invalid events eligible"
                          : "Invalid events deleted"}
                      </p>
                      <p className="text-foreground mt-1 text-lg font-semibold tabular-nums">
                        {displayedRun.totalDeletedInvalidEvents}
                      </p>
                    </div>
                    <div className="border-border bg-surface rounded-md border p-3">
                      <p className="text-muted flex items-center gap-1 text-[11px] font-medium">
                        <ShieldCheck className="text-success size-3.5" />
                        <span>Protected (Alerts / Incidents)</span>
                      </p>
                      <p className="text-foreground mt-1 text-lg font-semibold tabular-nums">
                        {displayedRun.totalProtectedEvents}
                      </p>
                    </div>
                  </div>

                  {displayedRun.families.length > 0 ? (
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                      {displayedRun.families.map((familyItem: RetentionPurgeFamilyResult) => (
                        <div
                          key={familyItem.eventFamily}
                          className="border-border bg-surface/60 rounded-md border p-2.5 text-xs"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-foreground font-semibold">
                              {familyLabels[familyItem.eventFamily]}
                            </span>
                            {familyItem.hasMore ? (
                              <StatusBadge tone="warning">More remaining</StatusBadge>
                            ) : null}
                          </div>
                          <p className="text-muted mt-1">
                            {displayedRun.dryRun ? "Eligible" : "Deleted"}:{" "}
                            <strong className="text-foreground">
                              {familyItem.deletedNormalizedEvents}
                            </strong>{" "}
                            normalized,{" "}
                            <strong className="text-foreground">
                              {familyItem.deletedInvalidEvents}
                            </strong>{" "}
                            invalid
                          </p>
                          <p className="text-muted">
                            Protected: {familyItem.protectedByAlertOrIncident}
                            {familyItem.batchesExecuted > 0
                              ? ` • Batches: ${familyItem.batchesExecuted}`
                              : ""}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}

              {/* Effective Per-Family Cutoffs */}
              <div className="space-y-2">
                <h3 className="text-foreground text-sm font-semibold">
                  Effective retention rules by event family
                </h3>
                <DataTable
                  columns={effectiveColumns}
                  rows={statusData.effectivePolicies}
                  getRowKey={(item) => item.eventFamily}
                />
              </div>

              {/* Recent Audited Purge History */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <History className="text-muted size-4" />
                  <h3 className="text-foreground text-sm font-semibold">
                    Recent audited purge runs
                  </h3>
                </div>

                {recentRuns.length === 0 ? (
                  <div className="border-border bg-surface-subtle/30 rounded-lg border px-4 py-6 text-center">
                    <p className="text-foreground text-xs font-medium">
                      No retention purge executions recorded yet.
                    </p>
                    <p className="text-muted mt-1 text-xs">
                      Audited entries appear after scheduled runs delete expired events or an
                      administrator executes a manual purge.
                    </p>
                  </div>
                ) : (
                  <div className="border-border divide-border divide-y rounded-lg border">
                    {recentRuns.map((run: RetentionPurgeHistoryItem) => {
                      const deletedNorm = readSummaryNumber(
                        run.summary,
                        "totalDeletedNormalizedEvents",
                      );
                      const deletedInvalid = readSummaryNumber(
                        run.summary,
                        "totalDeletedInvalidEvents",
                      );
                      const protectedCount = readSummaryNumber(
                        run.summary,
                        "totalProtectedEvents",
                      );

                      return (
                        <div
                          key={run.id}
                          className="flex flex-wrap items-center justify-between gap-3 px-3.5 py-2.5 text-xs"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <StatusBadge
                              tone={run.outcome === "SUCCESS" ? "success" : "warning"}
                            >
                              {run.outcome}
                            </StatusBadge>
                            <span className="text-foreground font-medium">
                              {run.actorType}
                              {run.source ? ` · ${run.source}` : ""}
                            </span>
                            <span className="text-muted">
                              {formatTimestamp(run.occurredAt)}
                            </span>
                          </div>

                          <div className="text-muted flex flex-wrap items-center gap-3 tabular-nums">
                            <span>
                              Normalized:{" "}
                              <strong className="text-foreground">
                                {deletedNorm ?? "—"}
                              </strong>
                            </span>
                            <span>
                              Invalid:{" "}
                              <strong className="text-foreground">
                                {deletedInvalid ?? "—"}
                              </strong>
                            </span>
                            <span>
                              Protected:{" "}
                              <strong className="text-foreground">
                                {protectedCount ?? "—"}
                              </strong>
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          ) : null}

          <div className="border-border flex items-center justify-end border-t pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={runMutation.isPending}
              className="min-h-9 text-xs"
            >
              Close
            </Button>
          </div>
        </div>
      ) : null}
    </Dialog>
  );
}
