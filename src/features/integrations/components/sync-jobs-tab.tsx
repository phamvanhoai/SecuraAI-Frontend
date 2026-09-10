"use client";

import { CheckCircle2, Clock, RefreshCw, XCircle } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/components/feedback/toast";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useSyncJobs,
  useTriggerSync,
} from "../hooks/use-integrations";
import type { SyncJob } from "../schemas/integration-schema";

export function SyncJobsTab({
  integrationId,
}: {
  integrationId: string;
}) {
  const toast = useToast();
  const [page, setPage] = useState(1);
  const jobsQuery = useSyncJobs({ integrationId, page, limit: 10 });
  const triggerSyncMutation = useTriggerSync();

  const jobs: readonly SyncJob[] = jobsQuery.data?.items ?? [];
  const pagination = jobsQuery.data?.pagination;

  async function handleTrigger() {
    try {
      const job = await triggerSyncMutation.mutateAsync({ id: integrationId });
      toast.success(
        "Sync Completed",
        `Processed ${job.recordsProcessed} records.`,
      );
    } catch {
      toast.error(
        "Sync Failed",
        "Could not complete the data synchronization job.",
      );
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Synchronization History</h3>
          <p className="text-muted text-xs">
            Recent data extraction and ingestion executions triggered automatically or manually.
          </p>
        </div>
        <Button
          className="min-h-9 px-3 text-xs"
          disabled={triggerSyncMutation.isPending}
          onClick={handleTrigger}
          type="button"
        >
          <RefreshCw
            className={`mr-1.5 size-3.5 ${triggerSyncMutation.isPending ? "animate-spin" : ""}`}
          />
          {triggerSyncMutation.isPending ? "Syncing..." : "Sync Now"}
        </Button>
      </div>

      {jobsQuery.isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      ) : jobs.length === 0 ? (
        <div className="border-border rounded-lg border border-dashed p-6 text-center text-xs text-muted">
          No synchronization tasks have been executed yet.
        </div>
      ) : (
        <div className="divide-border border-border divide-y rounded-lg border text-xs">
          {jobs.map((job) => {
            const isSuccess = job.status === "completed";
            const isRunning = job.status === "running";
            const durationMs =
              job.completedAt && job.startedAt
                ? new Date(job.completedAt).getTime() -
                  new Date(job.startedAt).getTime()
                : null;

            return (
              <div
                className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between"
                key={job.id}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {isSuccess && (
                      <span className="inline-flex items-center gap-1 rounded bg-success-soft px-2 py-0.5 text-[11px] font-medium text-success border border-success/20">
                        <CheckCircle2 className="size-3" />
                        Completed
                      </span>
                    )}
                    {isRunning && (
                      <span className="inline-flex items-center gap-1 rounded bg-brand-soft px-2 py-0.5 text-[11px] font-medium text-brand border border-brand/20">
                        <RefreshCw className="size-3 animate-spin" />
                        Running
                      </span>
                    )}
                    {!isSuccess && !isRunning && (
                      <span className="inline-flex items-center gap-1 rounded bg-danger-soft px-2 py-0.5 text-[11px] font-medium text-danger border border-danger/20">
                        <XCircle className="size-3" />
                        Failed
                      </span>
                    )}

                    <span className="text-muted font-mono text-[11px]">
                      ID: {job.id.slice(0, 8)}...
                    </span>
                  </div>

                  {job.errorMessage ? (
                    <p className="text-danger text-[11px]">{job.errorMessage}</p>
                  ) : null}

                  <div className="text-muted flex items-center gap-3 text-[11px]">
                    <span className="flex items-center gap-1">
                      <Clock className="size-3" />
                      {job.startedAt
                        ? new Date(job.startedAt).toLocaleString("en-US")
                        : "—"}
                    </span>
                    {durationMs !== null ? (
                      <span>Duration: {(durationMs / 1000).toFixed(1)}s</span>
                    ) : null}
                  </div>
                </div>

                <div className="flex items-center gap-3 text-[11px]">
                  <span className="bg-neutral-soft px-2 py-1 rounded border border-border">
                    Processed:{" "}
                    <strong className="text-foreground font-mono">
                      {job.recordsProcessed}
                    </strong>
                  </span>
                  <span className="bg-neutral-soft px-2 py-1 rounded border border-border">
                    Failed:{" "}
                    <strong className="text-danger font-mono">
                      {job.recordsFailed}
                    </strong>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination controls */}
      {pagination && pagination.totalPages > 1 ? (
        <div className="flex items-center justify-between text-xs pt-2">
          <span className="text-muted">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <div className="flex gap-1.5">
            <Button
              className="min-h-7 px-2 text-xs bg-surface text-foreground ring-border hover:bg-neutral-soft ring-1"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              type="button"
            >
              Previous
            </Button>
            <Button
              className="min-h-7 px-2 text-xs bg-surface text-foreground ring-border hover:bg-neutral-soft ring-1"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
              type="button"
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
