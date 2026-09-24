"use client";

import { useEffect, useRef, useState } from "react";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/data-display/data-table";
import { Pagination } from "@/components/data-display/pagination";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/data-display/static-product";
import { TableSkeleton } from "@/components/ui/skeleton";
import { useAiAlertFeedback } from "../hooks/use-ai-alerts";
import type {
  AiAlert,
  AiAlertFeedback,
  AiAlertFeedbackLabel,
} from "../schemas/ai-alert-schema";

const columns: readonly DataTableColumn<AiAlertFeedback>[] = [
  {
    key: "assessment",
    header: "Assessment",
    cell: (item) => (
      <StatusBadge tone={feedbackTone(item.feedbackLabel)}>
        {formatFeedbackLabel(item.feedbackLabel)}
      </StatusBadge>
    ),
  },
  {
    key: "comment",
    header: "Comment",
    cell: (item) => (
      <span className="block max-w-lg min-w-56 whitespace-normal">
        {item.comment ?? "No comment"}
      </span>
    ),
  },
  {
    key: "reviewer",
    header: "Reviewer ID",
    cell: (item) => (
      <span className="font-mono text-xs">
        {item.reviewedByUserId ?? "System"}
      </span>
    ),
  },
  {
    key: "submitted",
    header: "Submitted",
    cell: (item) => formatDate(item.createdAt),
  },
];

export function AlertFeedbackHistoryDialog({
  alert,
  onClose,
}: {
  alert: AiAlert | null;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [page, setPage] = useState(1);
  const feedback = useAiAlertFeedback(alert?.id ?? null, page, alert !== null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (alert && !dialog.open) dialog.showModal();
    if (!alert && dialog.open) dialog.close();
  }, [alert]);

  const close = (): void => {
    setPage(1);
    onClose();
  };

  return (
    <Dialog
      className="max-h-[calc(100dvh-2rem)] w-[min(64rem,calc(100%-2rem))] overflow-y-auto"
      dialogRef={dialogRef}
      onClose={close}
      title="Feedback history"
    >
      {alert ? (
        <div className="space-y-4">
          <div>
            <p className="font-medium">{alert.title}</p>
            <p className="text-muted mt-1 text-sm">{alert.alertCode}</p>
          </div>
          {feedback.isPending ? (
            <TableSkeleton
              headers={["Assessment", "Comment", "Reviewer ID", "Submitted"]}
              label="Loading alert feedback"
              rows={4}
            />
          ) : feedback.isError ? (
            <Alert>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span>Unable to load feedback history.</span>
                <Button
                  onClick={() => void feedback.refetch()}
                  variant="secondary"
                >
                  Try again
                </Button>
              </div>
            </Alert>
          ) : feedback.data?.items.length === 0 ? (
            <div className="border-border rounded-xl border py-10 text-center">
              <p className="font-medium">No feedback submitted</p>
              <p className="text-muted mt-1 text-sm">
                Reliability assessments for this alert will appear here.
              </p>
            </div>
          ) : feedback.data ? (
            <DataTable
              columns={columns}
              getRowKey={(item) => item.id}
              rows={feedback.data.items}
            />
          ) : null}
          {feedback.data && feedback.data.pagination.totalPages > 1 ? (
            <Pagination
              onPageChange={setPage}
              page={feedback.data.pagination.page}
              pageCount={feedback.data.pagination.totalPages}
            />
          ) : null}
          <div className="flex justify-end">
            <Button onClick={close} variant="secondary">
              Close
            </Button>
          </div>
        </div>
      ) : null}
    </Dialog>
  );
}

function formatFeedbackLabel(label: AiAlertFeedbackLabel): string {
  if (label === "confirmed_incident") return "Confirmed incident";
  if (label === "false_positive") return "False positive";
  return "Needs further review";
}

function feedbackTone(
  label: AiAlertFeedbackLabel,
): "danger" | "success" | "warning" {
  if (label === "confirmed_incident") return "danger";
  if (label === "false_positive") return "success";
  return "warning";
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
