"use client";

import { useState } from "react";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/data-display/data-table";
import { Pagination } from "@/components/data-display/pagination";
import { StatusBadge } from "@/components/data-display/static-product";
import { Alert } from "@/components/ui/alert";
import { useControlWeaknessHistory } from "../hooks/use-incidents";
import type { ControlWeaknessHistoryItem } from "../schemas/control-weakness-schema";

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

const severityTone = (severity: string | null) => {
  if (severity === "critical") return "danger" as const;
  if (severity === "high") return "warning" as const;
  if (severity === "low") return "success" as const;
  return "info" as const;
};

const statusTone = (status: string) => {
  if (status === "open") return "danger" as const;
  if (status === "under_review") return "warning" as const;
  if (status === "resolved") return "success" as const;
  return "neutral" as const;
};

const label = (value: string) =>
  value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

const columns: readonly DataTableColumn<ControlWeaknessHistoryItem>[] = [
  {
    key: "control",
    header: "Control",
    cell: (item) => (
      <span className="block min-w-44">
        <strong className="block">{item.control.name}</strong>
        <span className="text-muted text-xs">{item.control.controlCode}</span>
      </span>
    ),
  },
  {
    key: "weakness",
    header: "Weakness",
    cell: (item) => (
      <p className="max-w-md break-words whitespace-normal">
        {item.description}
      </p>
    ),
  },
  {
    key: "severity",
    header: "Severity",
    cell: (item) => (
      <StatusBadge tone={severityTone(item.severity)}>
        {item.severity ? label(item.severity) : "Not set"}
      </StatusBadge>
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
    key: "identified",
    header: "Recorded by",
    cell: (item) => (
      <span className="block min-w-40">
        <strong className="block font-medium">
          {item.identifiedBy.fullName}
        </strong>
        <span className="text-muted text-xs tabular-nums">
          {formatDate(item.identifiedAt)}
        </span>
      </span>
    ),
  },
];

export function ControlWeaknessHistoryPanel({
  incidentId,
}: {
  incidentId: string;
}) {
  const [page, setPage] = useState(1);
  const history = useControlWeaknessHistory(incidentId, page);

  return (
    <div className="space-y-4" role="tabpanel">
      {history.isPending ? (
        <div
          className="border-border bg-neutral-soft h-40 animate-pulse rounded-xl border"
          aria-label="Loading control weakness history"
        />
      ) : history.isError ? (
        <Alert className="border-danger/25 bg-danger-soft text-danger">
          Unable to load control weakness history. Check your session and
          backend connection.
        </Alert>
      ) : history.data.items.length === 0 ? (
        <div className="border-border rounded-xl border px-6 py-10 text-center">
          <p className="font-semibold">No control weaknesses recorded</p>
          <p className="text-muted mt-1 text-sm">
            Use the Record weakness tab to document the first finding.
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
