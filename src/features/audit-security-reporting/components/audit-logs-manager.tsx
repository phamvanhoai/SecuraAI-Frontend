"use client";

import {
  History,
  Key,
  RefreshCw,
  Server,
  ShieldCheck,
  User,
} from "lucide-react";
import { useState } from "react";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/data-display/data-table";
import { Pagination } from "@/components/data-display/pagination";
import {
  ProductPageHeader,
  ProductPanel,
  StatusBadge,
} from "@/components/data-display/static-product";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { TableSkeleton } from "@/components/ui/skeleton";
import { useAuditLogs } from "../hooks/use-audit-logs";
import { type AuditLogItem } from "../schemas/audit-log-schema";
import { cn } from "@/lib/utils";

function getActionTone(action: string): "success" | "warning" | "danger" | "info" | "neutral" {
  const upper = action.toUpperCase();
  if (
    upper.includes("DELETE") ||
    upper.includes("REMOVE") ||
    upper.includes("LOCK") ||
    upper.includes("REVOKE") ||
    upper.includes("FAIL")
  ) {
    return "danger";
  }
  if (
    upper.includes("UPDATE") ||
    upper.includes("CHANGE") ||
    upper.includes("ASSIGN") ||
    upper.includes("CORRECT") ||
    upper.includes("SUBMIT")
  ) {
    return "warning";
  }
  if (
    upper.includes("CREATE") ||
    upper.includes("LOGIN") ||
    upper.includes("PUBLISH") ||
    upper.includes("APPROVE") ||
    upper.includes("SUCCESS")
  ) {
    return "success";
  }
  if (upper.includes("READ") || upper.includes("VIEW") || upper.includes("EXPORT")) {
    return "neutral";
  }
  return "info";
}

function formatRelativeTime(isoString: string): string {
  try {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return `${diffDays}d ago`;
    return new Date(isoString).toLocaleDateString("en-US");
  } catch {
    return isoString;
  }
}

function formatExactTime(isoString: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(new Date(isoString));
  } catch {
    return isoString;
  }
}

export function AuditLogsManager() {
  const [page, setPage] = useState(1);
  const limit = 20;

  const {
    data: auditData,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useAuditLogs({ page, limit });

  const columns: readonly DataTableColumn<AuditLogItem>[] = [
    {
      key: "occurredAt",
      header: "Timestamp",
      cell: (item: AuditLogItem) => (
        <div className="flex flex-col">
          <span className="font-medium text-foreground">
            {formatRelativeTime(item.occurredAt)}
          </span>
          <span className="text-xs text-muted">
            {formatExactTime(item.occurredAt)}
          </span>
        </div>
      ),
    },
    {
      key: "action",
      header: "Action",
      cell: (item: AuditLogItem) => (
        <div className="flex items-center gap-1.5">
          <StatusBadge tone={getActionTone(item.action)}>
            <span className="font-mono text-xs font-semibold">{item.action}</span>
          </StatusBadge>
        </div>
      ),
    },
    {
      key: "actor",
      header: "Actor",
      cell: (item: AuditLogItem) => {
        const type = item.actorType;
        return (
          <div className="flex items-center gap-2">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-surface-subtle border border-border">
              {type === "USER" ? (
                <User className="size-3.5 text-blue-500" />
              ) : type === "API_KEY" ? (
                <Key className="size-3.5 text-amber-500" />
              ) : (
                <Server className="size-3.5 text-emerald-500" />
              )}
            </div>
            <div className="flex flex-col truncate">
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-foreground truncate max-w-[200px]">
                  {item.actor?.name ?? (type === "SYSTEM" ? "System Engine" : "Unknown Actor")}
                </span>
                <span className="rounded bg-neutral-soft px-1 py-0.5 text-[10px] font-mono text-muted uppercase">
                  {type}
                </span>
              </div>
              {item.actor?.email ? (
                <span className="text-xs text-muted truncate max-w-[200px]">
                  {item.actor.email}
                </span>
              ) : item.actor?.keyPrefix ? (
                <span className="font-mono text-xs text-muted">
                  Prefix: {item.actor.keyPrefix}***
                </span>
              ) : null}
            </div>
          </div>
        );
      },
    },
    {
      key: "resource",
      header: "Resource",
      cell: (item: AuditLogItem) => (
        <div className="flex flex-col">
          <span className="font-mono text-xs font-semibold text-foreground">
            {item.resourceType}
          </span>
          {item.resourceId && (
            <span className="font-mono text-[11px] text-muted truncate max-w-[160px]" title={item.resourceId}>
              {item.resourceId}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "sourceIp",
      header: "Source IP / System",
      cell: (item: AuditLogItem) => (
        <div className="flex flex-col">
          <span className="font-mono text-xs text-foreground">
            {item.sourceIp ?? "—"}
          </span>
          <span className="text-[11px] text-muted">
            {item.source ?? "System"}
          </span>
        </div>
      ),
    },
    {
      key: "integrityHash",
      header: "Integrity Hash",
      cell: (item: AuditLogItem) => (
        <div className="flex items-center gap-1">
          <span
            className="inline-flex items-center gap-1 rounded border border-border/80 bg-surface-subtle px-1.5 py-0.5 font-mono text-[11px] text-muted"
            title={`SHA-256: ${item.recordHash}`}
          >
            <ShieldCheck className="size-3 text-success shrink-0" />
            <span>{item.recordHash.slice(0, 8)}...{item.recordHash.slice(-6)}</span>
          </span>
        </div>
      ),
    },
  ];

  return (
    <>
      <ProductPageHeader
        title="System Audit Logs"
        description="View system audit records covering user actions, configuration changes, and system access activities for compliance monitoring and accountability."
        additionalActions={
          <Button
            type="button"
            variant="secondary"
            onClick={() => refetch()}
            disabled={isFetching}
            className="gap-1.5"
          >
            <RefreshCw className={cn("size-3.5", isFetching && "animate-spin")} />
            <span>Refresh</span>
          </Button>
        }
      />

      {/* Cryptographic Protection Banner */}
      <div className="mb-6 flex items-start gap-3 rounded-xl border border-success/30 bg-success-soft p-4 text-sm text-success">
        <ShieldCheck className="mt-0.5 size-5 shrink-0" />
        <div>
          <p className="font-semibold text-foreground">
            Immutable Audit Trail (Append-Only & Cryptographic Hash Chain)
          </p>
          <p className="mt-0.5 text-xs text-muted leading-5">
            All administrative actions, access events, and configuration modifications are recorded with SHA-256 cryptographic chaining. Database triggers prevent tampering or deletion (UPDATE/DELETE) to ensure compliance with ISO/IEC 27001 and SOC 2 standards.
          </p>
        </div>
      </div>

      {/* Main Panel */}
      <ProductPanel title="Audit Trail Records">
        {isLoading ? (
          <div className="p-4">
            <TableSkeleton rows={8} columns={6} />
          </div>
        ) : isError ? (
          <div className="p-6">
            <Alert className="border-danger/30 bg-danger-soft text-danger">
              <div className="flex items-center justify-between">
                <span>Failed to load audit logs: {error?.message}</span>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => refetch()}
                >
                  Retry
                </Button>
              </div>
            </Alert>
          </div>
        ) : !auditData?.items || auditData.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-muted">
            <History className="size-10 text-muted/60" />
            <p className="mt-3 font-semibold text-foreground">
              No audit logs found
            </p>
            <p className="mt-1 text-xs max-w-sm">
              No audit events have been recorded by the system yet.
            </p>
          </div>
        ) : (
          <div>
            <DataTable
              columns={columns}
              rows={auditData.items}
              getRowKey={(item: AuditLogItem) => item.id}
            />

            {/* Pagination Controls */}
            <div className="border-t border-border p-3">
              <Pagination
                page={auditData.pagination.page}
                pageCount={auditData.pagination.totalPages}
                onPageChange={(newPage) => setPage(newPage)}
              />
            </div>
          </div>
        )}
      </ProductPanel>
    </>
  );
}
