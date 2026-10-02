"use client";

import { Layers, ShieldAlert, UserCheck } from "lucide-react";
import { useState } from "react";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/data-display/data-table";
import { Pagination } from "@/components/data-display/pagination";
import {
  ProductPanel,
  StatusBadge,
} from "@/components/data-display/static-product";
import { Alert } from "@/components/ui/alert";
import { TableSkeleton } from "@/components/ui/skeleton";
import { useNormalizedEvents } from "../hooks/use-normalized-events";
import type { NormalizedEventItem } from "../schemas/normalized-event-schema";
import { cn } from "@/lib/utils";

const mappingStatusTones = {
  MAPPED: "success",
  PARTIALLY_MAPPED: "warning",
  UNMAPPED: "neutral",
  NEEDS_REVIEW: "danger",
} as const;

const familyStyles: Record<string, string> = {
  AUTHENTICATION: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20",
  VPN_SSO: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
  APPLICATION_ACCESS:
    "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20",
};

const formatFamilyLabel: Record<string, string> = {
  AUTHENTICATION: "Authentication",
  VPN_SSO: "VPN / SSO",
  APPLICATION_ACCESS: "App Access",
};

export function NormalizedEventsList() {
  const [page, setPage] = useState(1);

  const eventsQuery = useNormalizedEvents({
    page,
    limit: 20,
  });

  const columns: readonly DataTableColumn<NormalizedEventItem>[] = [
    {
      key: "occurredAt",
      header: "Timestamp",
      cell: (item) => {
        const date = new Date(item.occurredAt);
        return (
          <div className="py-0.5 whitespace-nowrap">
            <span className="text-foreground block font-mono text-xs font-semibold">
              {new Intl.DateTimeFormat("en-US", {
                dateStyle: "short",
                timeStyle: "medium",
              }).format(date)}
            </span>
            <span className="text-muted text-[11px]">
              Ingested:{" "}
              {new Intl.DateTimeFormat("en-US", {
                timeStyle: "medium",
              }).format(new Date(item.ingestedAt))}
            </span>
          </div>
        );
      },
    },
    {
      key: "source",
      header: "Source",
      cell: (item) => (
        <div className="py-0.5">
          <strong className="text-foreground block font-medium text-xs">
            {item.eventSourceName}
          </strong>
          <span className="text-muted font-mono text-[11px]">
            {item.eventSourceType}
          </span>
        </div>
      ),
    },
    {
      key: "eventFamily",
      header: "Event family",
      cell: (item) => (
        <span
          className={cn(
            "inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
            familyStyles[item.eventFamily] ??
              "border-border bg-neutral-soft/60 text-foreground",
          )}
        >
          {formatFamilyLabel[item.eventFamily] ?? item.eventFamily}
        </span>
      ),
    },
    {
      key: "eventType",
      header: "Event type",
      cell: (item) => (
        <div className="py-0.5 flex items-center gap-1.5 flex-wrap">
          <span className="text-foreground font-mono text-xs font-semibold block">
            {item.eventType}
          </span>
          {item.anomalyCount > 0 ? (
            <span className="inline-flex items-center gap-0.5 rounded-md border border-red-500/30 bg-red-500/10 px-1.5 py-0.5 text-[10px] font-bold text-red-600 dark:text-red-400">
              <ShieldAlert className="size-3" />
              <span>Anomaly</span>
            </span>
          ) : null}
        </div>
      ),
    },
    {
      key: "identity",
      header: "User / Account",
      cell: (item) => (
        <div className="py-0.5 space-y-0.5">
          <span className="text-foreground font-mono text-xs font-medium block">
            {item.accountIdentifier ?? "—"}
          </span>
          {item.mappedUser ? (
            <span className="text-emerald-600 dark:text-emerald-400 text-[11px] font-medium flex items-center gap-1">
              <UserCheck className="size-3" />
              <span>{item.mappedUser.fullName ?? item.mappedUser.email}</span>
            </span>
          ) : (
            <span className="text-muted text-[11px]">Unmapped user</span>
          )}
        </div>
      ),
    },
    {
      key: "asset",
      header: "Associated asset",
      cell: (item) => (
        <div className="py-0.5">
          {item.mappedAsset ? (
            <div className="space-y-0.5">
              <span className="text-foreground font-medium text-xs block">
                {item.mappedAsset.name}
              </span>
              <span className="text-muted font-mono text-[10px]">
                {item.mappedAsset.assetCode} ({item.mappedAsset.assetType})
              </span>
            </div>
          ) : (
            <span className="text-muted text-xs">
              {item.sourceIp ? (
                <span className="font-mono text-[11px]">{item.sourceIp}</span>
              ) : (
                "—"
              )}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "status",
      header: "Processing status",
      cell: (item) => (
        <StatusBadge tone={mappingStatusTones[item.mappingStatus] ?? "neutral"}>
          {item.mappingStatus.replace(/_/g, " ")}
        </StatusBadge>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <ProductPanel
        title="Ingested Security Events"
        description="Centralized stream of normalized security events with source telemetry, identity, and asset resolution."
      >
        <div className="p-4 space-y-4">
          {eventsQuery.isPending ? (
            <TableSkeleton rows={6} />
          ) : eventsQuery.error ? (
            <Alert>{eventsQuery.error.message}</Alert>
          ) : eventsQuery.data.items.length === 0 ? (
            <div className="py-12 text-center">
              <Layers className="text-muted mx-auto mb-3 size-10" />
              <h3 className="text-foreground font-semibold text-base">
                No security events found
              </h3>
              <p className="text-muted mx-auto mt-1 max-w-sm text-sm">
                No telemetry events have been ingested into the system yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <DataTable
                columns={columns}
                rows={eventsQuery.data.items}
                getRowKey={(item) => item.id}
              />

              <div className="border-border border-t pt-4">
                <Pagination
                  page={eventsQuery.data.pagination.page}
                  pageCount={eventsQuery.data.pagination.totalPages}
                  onPageChange={setPage}
                />
              </div>
            </div>
          )}
        </div>
      </ProductPanel>
    </div>
  );
}
