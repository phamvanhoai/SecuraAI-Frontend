"use client";

import { useState } from "react";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/data-display/data-table";
import { Pagination } from "@/components/data-display/pagination";
import { StatusBadge } from "@/components/data-display/static-product";
import { Alert } from "@/components/ui/alert";
import { useRiskReassessmentRequestHistory } from "../hooks/use-incidents";
import type { RiskReassessmentRequestHistoryItem } from "../schemas/risk-reassessment-request-schema";

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
const label = (value: string) =>
  value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
const statusTone = (status: string) => {
  if (status === "completed") return "success" as const;
  if (status === "rejected") return "danger" as const;
  if (status === "under_review") return "warning" as const;
  return "info" as const;
};

const columns: readonly DataTableColumn<RiskReassessmentRequestHistoryItem>[] =
  [
    {
      key: "risk",
      header: "Risk",
      cell: (item) => (
        <span className="block min-w-44">
          <strong className="block">{item.risk.title}</strong>
          <span className="text-muted text-xs">{item.risk.riskCode}</span>
        </span>
      ),
    },
    {
      key: "reason",
      header: "Reason",
      cell: (item) => (
        <p className="max-w-sm break-words whitespace-normal">{item.reason}</p>
      ),
    },
    {
      key: "weakness",
      header: "Control weakness",
      cell: (item) =>
        item.controlWeakness ? (
          <span className="block min-w-36">
            <strong className="block font-medium">
              {item.controlWeakness.control.name}
            </strong>
            <span className="text-muted text-xs">
              {item.controlWeakness.control.controlCode}
            </span>
          </span>
        ) : (
          <span className="text-muted">None</span>
        ),
    },
    {
      key: "status",
      header: "Status",
      cell: (item) => (
        <StatusBadge tone={statusTone(item.status)}>
          {label(item.status)}
        </StatusBadge>
      ),
    },
    {
      key: "ownership",
      header: "Owner / reviewer",
      cell: (item) => (
        <span className="block min-w-40">
          <strong className="block font-medium">
            {item.risk.owner?.fullName ?? "Unassigned"}
          </strong>
          <span className="text-muted text-xs">
            {item.reviewedBy && item.reviewedAt
              ? `Reviewed by ${item.reviewedBy.fullName} · ${formatDate(item.reviewedAt)}`
              : "Not reviewed"}
          </span>
        </span>
      ),
    },
    {
      key: "requested",
      header: "Requested",
      cell: (item) => (
        <span className="block min-w-40">
          <strong className="block font-medium">
            {item.requestedBy.fullName}
          </strong>
          <span className="text-muted text-xs tabular-nums">
            {formatDate(item.requestedAt)}
          </span>
        </span>
      ),
    },
  ];

export function RiskReassessmentRequestHistoryPanel({
  incidentId,
}: {
  incidentId: string;
}) {
  const [page, setPage] = useState(1);
  const history = useRiskReassessmentRequestHistory(incidentId, page);
  return (
    <div className="space-y-4" role="tabpanel">
      {history.isPending ? (
        <div
          className="border-border bg-neutral-soft h-40 animate-pulse rounded-xl border"
          aria-label="Loading request history"
        />
      ) : history.isError ? (
        <Alert className="border-danger/25 bg-danger-soft text-danger">
          Unable to load reassessment request history. Check your session and
          backend connection.
        </Alert>
      ) : history.data.items.length === 0 ? (
        <div className="border-border rounded-xl border px-6 py-10 text-center">
          <p className="font-semibold">No reassessment requests created</p>
          <p className="text-muted mt-1 text-sm">
            Use the Create request tab to submit the first request.
          </p>
        </div>
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={history.data.items}
            getRowKey={(item) => item.id}
          />
          <Pagination
            page={history.data.pagination.page}
            pageCount={history.data.pagination.totalPages}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}
