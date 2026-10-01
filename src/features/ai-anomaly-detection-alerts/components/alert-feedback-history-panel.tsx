"use client";

import { useState } from "react";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/data-display/data-table";
import { Pagination } from "@/components/data-display/pagination";
import { StatusBadge } from "@/components/data-display/static-product";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { TableSkeleton } from "@/components/ui/skeleton";
import { useAiAlertFeedback } from "../hooks/use-ai-alerts";
import type {
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
    key: "reason",
    header: "Feedback reason",
    cell: (item) => (
      <span className="block max-w-lg min-w-56 whitespace-normal">
        {item.reason}
      </span>
    ),
  },
  {
    key: "analyst",
    header: "Analyst",
    cell: (item) => (
      <span className="block min-w-44">
        <strong className="block text-sm font-medium">
          {item.analyst.name}
        </strong>
        <span className="text-muted block text-xs">{item.analyst.email}</span>
      </span>
    ),
  },
  {
    key: "modelVersion",
    header: "Model version",
    cell: (item) => (
      <span className="block min-w-36">
        <strong className="block text-sm font-medium">
          {item.modelVersion.modelName}
        </strong>
        <span className="text-muted block text-xs tabular-nums">
          v{item.modelVersion.version}
        </span>
      </span>
    ),
  },
  {
    key: "recordedAt",
    header: "Recorded time",
    cell: (item) => formatDate(item.recordedAt),
  },
];

export function AlertFeedbackHistoryPanel({ alertId }: { alertId: string }) {
  const [page, setPage] = useState(1);
  const feedback = useAiAlertFeedback(alertId, page, true);
  return (
    <div className="space-y-4">
      {feedback.isPending ? (
        <TableSkeleton
          headers={[
            "Assessment",
            "Feedback reason",
            "Analyst",
            "Model version",
            "Recorded time",
          ]}
          label="Loading alert feedback"
          rows={4}
        />
      ) : feedback.isError ? (
        <Alert>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>Unable to load feedback history.</span>
            <Button onClick={() => void feedback.refetch()} variant="secondary">
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
    </div>
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
