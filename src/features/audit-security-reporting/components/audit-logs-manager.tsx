"use client";

import {
  Calendar,
  Filter,
  History,
  Key,
  RefreshCw,
  Search,
  Server,
  ShieldCheck,
  User,
  X,
} from "lucide-react";
import { useId, useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { TableSkeleton } from "@/components/ui/skeleton";
import { useAuditLogs } from "../hooks/use-audit-logs";
import {
  auditActorTypes,
  type AuditActorType,
  type AuditLogItem,
  type ListAuditLogsQuery,
} from "../schemas/audit-log-schema";
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
  const searchInputId = useId();
  const actorInputId = useId();
  const actorTypeSelectId = useId();
  const actionInputId = useId();
  const resourceInputId = useId();
  const correlationInputId = useId();
  const startDateInputId = useId();
  const endDateInputId = useId();

  const [page, setPage] = useState(1);
  const limit = 20;

  // Search and filter states
  const [search, setSearch] = useState("");
  const [actor, setActor] = useState("");
  const [actorType, setActorType] = useState<AuditActorType | "">("");
  const [action, setAction] = useState("");
  const [resourceType, setResourceType] = useState("");
  const [correlationId, setCorrelationId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const activeFilterCount = [
    Boolean(search.trim()),
    Boolean(actor.trim()),
    Boolean(actorType),
    Boolean(action.trim()),
    Boolean(resourceType.trim()),
    Boolean(correlationId.trim()),
    Boolean(startDate),
    Boolean(endDate),
  ].filter(Boolean).length;

  const queryParams: ListAuditLogsQuery = {
    page,
    limit,
    search: search.trim() || undefined,
    actor: actor.trim() || undefined,
    actorType: actorType || undefined,
    action: action.trim() || undefined,
    resourceType: resourceType.trim() || undefined,
    correlationId: correlationId.trim() || undefined,
    startDate: startDate ? new Date(startDate).toISOString() : undefined,
    endDate: endDate ? new Date(endDate).toISOString() : undefined,
    sortBy: "occurredAt",
    sortOrder: "desc",
  };

  const {
    data: auditData,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useAuditLogs(queryParams);

  const handleResetFilters = () => {
    setSearch("");
    setActor("");
    setActorType("");
    setAction("");
    setResourceType("");
    setCorrelationId("");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

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
        <div className="flex flex-col items-start gap-1">
          <StatusBadge tone={getActionTone(item.action)}>
            <span className="font-mono text-xs font-semibold">{item.action}</span>
          </StatusBadge>
          {item.correlationId && (
            <span
              className="font-mono text-[10px] text-muted truncate max-w-[150px]"
              title={`Correlation ID: ${item.correlationId}`}
            >
              corr: {item.correlationId}
            </span>
          )}
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
        description="Search, filter, and review system audit records covering user actions, configuration changes, and system access activities for compliance monitoring and accountability."
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
        {/* Search & Filter Toolbar */}
        <div className="border-b border-border p-4 space-y-3.5 bg-surface-subtle/50">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Keyword Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted pointer-events-none" />
              <Input
                id={searchInputId}
                type="text"
                placeholder="Search by action, resource, IP, user, correlation ID..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9 pr-8"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setPage(1);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-foreground p-0.5"
                  aria-label="Clear search input"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            {/* Filter Toggle & Reset Buttons */}
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant={showAdvancedFilters || activeFilterCount > 0 ? "primary" : "secondary"}
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="gap-1.5 text-xs"
              >
                <Filter className="size-3.5" />
                <span>Filters</span>
                {activeFilterCount > 0 && (
                  <span className="ml-0.5 flex size-4 items-center justify-center rounded-full bg-surface text-[10px] font-bold text-foreground">
                    {activeFilterCount}
                  </span>
                )}
              </Button>

              {activeFilterCount > 0 && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleResetFilters}
                  className="gap-1.5 text-xs text-muted hover:text-foreground"
                >
                  <X className="size-3.5" />
                  <span>Clear all</span>
                </Button>
              )}
            </div>
          </div>

          {/* Advanced Filter Criteria Drawer / Grid */}
          {showAdvancedFilters && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 pt-2 border-t border-border/60">
              {/* Actor Type */}
              <div className="space-y-1.5">
                <Label htmlFor={actorTypeSelectId} className="text-xs text-muted">
                  Actor Type
                </Label>
                <Select
                  id={actorTypeSelectId}
                  value={actorType}
                  onChange={(e) => {
                    setActorType(e.target.value as AuditActorType | "");
                    setPage(1);
                  }}
                  className="h-9 text-xs"
                >
                  <option value="">All Actor Types</option>
                  {auditActorTypes.map((type) => (
                    <option key={type} value={type}>
                      {type === "USER" ? "User (USER)" : type === "API_KEY" ? "API Key (API_KEY)" : "System Engine (SYSTEM)"}
                    </option>
                  ))}
                </Select>
              </div>

              {/* Actor Name / Email / ID */}
              <div className="space-y-1.5">
                <Label htmlFor={actorInputId} className="text-xs text-muted">
                  Actor (Name / Email / ID)
                </Label>
                <Input
                  id={actorInputId}
                  type="text"
                  placeholder="e.g. admin@securaai.internal"
                  value={actor}
                  onChange={(e) => {
                    setActor(e.target.value);
                    setPage(1);
                  }}
                  className="h-9 text-xs"
                >
                </Input>
              </div>

              {/* Action Type */}
              <div className="space-y-1.5">
                <Label htmlFor={actionInputId} className="text-xs text-muted">
                  Action Type
                </Label>
                <Input
                  id={actionInputId}
                  type="text"
                  placeholder="e.g. LOGIN, UPDATE, DELETE..."
                  value={action}
                  onChange={(e) => {
                    setAction(e.target.value);
                    setPage(1);
                  }}
                  className="h-9 text-xs font-mono"
                />
              </div>

              {/* Resource Type */}
              <div className="space-y-1.5">
                <Label htmlFor={resourceInputId} className="text-xs text-muted">
                  Affected Resource
                </Label>
                <Input
                  id={resourceInputId}
                  type="text"
                  placeholder="e.g. users, policies, risks..."
                  value={resourceType}
                  onChange={(e) => {
                    setResourceType(e.target.value);
                    setPage(1);
                  }}
                  className="h-9 text-xs font-mono"
                />
              </div>

              {/* Correlation ID */}
              <div className="space-y-1.5">
                <Label htmlFor={correlationInputId} className="text-xs text-muted">
                  Correlation ID
                </Label>
                <Input
                  id={correlationInputId}
                  type="text"
                  placeholder="e.g. corr-12345"
                  value={correlationId}
                  onChange={(e) => {
                    setCorrelationId(e.target.value);
                    setPage(1);
                  }}
                  className="h-9 text-xs font-mono"
                />
              </div>

              {/* Start Date */}
              <div className="space-y-1.5">
                <Label htmlFor={startDateInputId} className="text-xs text-muted flex items-center gap-1">
                  <Calendar className="size-3" />
                  <span>Start Time (From)</span>
                </Label>
                <Input
                  id={startDateInputId}
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setPage(1);
                  }}
                  className="h-9 text-xs"
                />
              </div>

              {/* End Date */}
              <div className="space-y-1.5">
                <Label htmlFor={endDateInputId} className="text-xs text-muted flex items-center gap-1">
                  <Calendar className="size-3" />
                  <span>End Time (To)</span>
                </Label>
                <Input
                  id={endDateInputId}
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setPage(1);
                  }}
                  className="h-9 text-xs"
                />
              </div>

              {/* Quick Reset in Drawer */}
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleResetFilters}
                  disabled={activeFilterCount === 0}
                  className="h-9 w-full text-xs gap-1"
                >
                  <X className="size-3.5" />
                  <span>Reset All Filters</span>
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Content Table / Status */}
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
              {activeFilterCount > 0 ? "No matching audit records found" : "No audit logs found"}
            </p>
            <p className="mt-1 text-xs max-w-sm">
              {activeFilterCount > 0
                ? "Try adjusting your search query, actor, action type, or time range."
                : "No audit events have been recorded by the system yet."}
            </p>
            {activeFilterCount > 0 && (
              <Button
                type="button"
                variant="secondary"
                onClick={handleResetFilters}
                className="mt-4 gap-1.5 text-xs"
              >
                <X className="size-3.5" />
                <span>Clear all filters</span>
              </Button>
            )}
          </div>
        ) : (
          <div>
            <DataTable
              columns={columns}
              rows={auditData.items}
              getRowKey={(item: AuditLogItem) => item.id}
            />

            {/* Pagination Controls */}
            <div className="border-t border-border p-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted">
              <span>
                Showing {auditData.items.length} of {auditData.pagination.totalItems} matching records
              </span>
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
