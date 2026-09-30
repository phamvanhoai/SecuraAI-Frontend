"use client";

import { Eye, Power, Search, Server, Upload, X } from "lucide-react";
import { useState, type FormEvent } from "react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { TableSkeleton } from "@/components/ui/skeleton";
import { useEventSources } from "../hooks/use-event-sources";
import type {
  EventSourceResponse,
  eventSourceStatuses,
} from "../schemas/event-source-schema";
import { EventSourceDetailDialog } from "./event-source-detail-dialog";
import { ImportBatchResultDialog } from "./import-batch-result-dialog";
import { ImportEventsDialog } from "./import-events-dialog";
import { ToggleEventSourceStatusDialog } from "./toggle-event-source-status-dialog";

const statusTones = {
  ACTIVE: "success",
  INACTIVE: "neutral",
} as const;

const sourceTypeStyles: Record<string, string> = {
  WAZUH: "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20",
  IDENTITY_PROVIDER:
    "bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/20",
  FIREWALL: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
  EDR: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
};

const formatFamilyLabel: Record<string, string> = {
  AUTHENTICATION: "Authentication",
  VPN_SSO: "VPN / SSO",
  APPLICATION_ACCESS: "App Access",
  NETWORK_TRAFFIC: "Network Traffic",
  SYSTEM_LOGS: "System Logs",
  AUDIT_LOGS: "Audit Logs",
};

export function EventSourcesList({
  onRegisterClick,
}: {
  onRegisterClick?: () => void;
}) {
  const [page, setPage] = useState(1);
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [togglingSource, setTogglingSource] = useState<EventSourceResponse | null>(null);
  const [importingSource, setImportingSource] = useState<EventSourceResponse | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [viewingBatchId, setViewingBatchId] = useState<string | null>(null);

  const eventSourcesQuery = useEventSources({
    page,
    limit: 20,
    ...(query ? { q: query } : {}),
    ...(statusFilter !== "ALL"
      ? { status: statusFilter as (typeof eventSourceStatuses)[number] }
      : {}),
  });

  const columns: readonly DataTableColumn<EventSourceResponse>[] = [
    {
      key: "name",
      header: "Source name",
      cell: (item) => (
        <div className="py-0.5">
          <strong className="text-foreground block font-medium">
            {item.name}
          </strong>
          {item.description ? (
            <span className="text-muted mt-0.5 line-clamp-1 text-xs">
              {item.description}
            </span>
          ) : null}
        </div>
      ),
    },
    {
      key: "sourceType",
      header: "Type",
      cell: (item) => (
        <span
          className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold ${
            sourceTypeStyles[item.sourceType] ??
            "border-border bg-neutral-soft/60 text-foreground"
          }`}
        >
          {item.sourceType}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (item) => (
        <StatusBadge tone={statusTones[item.status]}>
          {item.status === "ACTIVE" ? "Active" : "Inactive"}
        </StatusBadge>
      ),
    },
    {
      key: "ingestionMethod",
      header: "Method / Endpoint",
      cell: (item) => (
        <div className="text-xs">
          <div className="flex items-center gap-1.5">
            <span className="border-border bg-neutral-soft/80 text-foreground inline-flex items-center rounded px-1.5 py-0.5 font-mono text-[10px] font-bold">
              {item.ingestionMethod}
            </span>
          </div>
          {item.endpoint ? (
            <span
              className="text-muted mt-1 block max-w-xs truncate font-mono text-[11px]"
              title={item.endpoint}
            >
              {item.endpoint}
            </span>
          ) : null}
        </div>
      ),
    },
    {
      key: "eventFamilies",
      header: "Event families",
      cell: (item) => (
        <div className="flex flex-wrap gap-1">
          {item.eventFamilies.map((family) => (
            <span
              key={family}
              className="border-primary/20 bg-primary/10 text-primary inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium"
            >
              {formatFamilyLabel[family] ?? family}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: "updatedAt",
      header: "Last updated",
      cell: (item) => (
        <span className="text-muted whitespace-nowrap text-xs">
          {formatDate(item.updatedAt)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      cell: (item) => (
        <div className="flex items-center gap-1.5">
          <Button
            className="min-h-8 gap-1.5 px-2.5 text-xs font-medium"
            onClick={() => setSelectedSourceId(item.id)}
            type="button"
            variant="secondary"
          >
            <Eye aria-hidden="true" className="size-3.5" strokeWidth={1.8} />
            <span>Details</span>
          </Button>
          <Button
            className={`min-h-8 gap-1.5 px-2 text-xs font-medium ${
              item.status === "ACTIVE"
                ? "text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
                : "text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
            }`}
            onClick={() => setTogglingSource(item)}
            title={
              item.status === "ACTIVE"
                ? "Pause event ingestion"
                : "Resume event ingestion"
            }
            type="button"
            variant="secondary"
          >
            <Power aria-hidden="true" className="size-3.5" strokeWidth={1.8} />
            <span className="hidden sm:inline">
              {item.status === "ACTIVE" ? "Pause" : "Resume"}
            </span>
          </Button>
        </div>
      ),
    },
  ];

  function handleSearchSubmit(e: FormEvent) {
    e.preventDefault();
    setPage(1);
    setQuery(draft.trim());
  }

  function handleStatusChange(value: string) {
    setPage(1);
    setStatusFilter(value);
  }

  function handleClearFilters() {
    setDraft("");
    setQuery("");
    setStatusFilter("ALL");
    setPage(1);
  }

  const isFiltered = Boolean(query || statusFilter !== "ALL");

  return (
    <>
      <ProductPanel
        description={
          eventSourcesQuery.data
            ? `${eventSourcesQuery.data.pagination.total} event sources found`
            : "Backend-managed security event sources"
        }
        title="Event source list"
      >
        <form
          className="border-border flex flex-wrap items-center gap-2 border-b p-4"
          onSubmit={handleSearchSubmit}
        >
          <label className="relative block min-w-[220px] max-w-md flex-1">
            <span className="sr-only">Search event sources</span>
            <Search
              aria-hidden="true"
              className="text-muted absolute top-1/2 left-3 size-4 -translate-y-1/2"
              strokeWidth={1.8}
            />
            <Input
              className="bg-background min-h-10 pl-9"
              maxLength={100}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Search by name or source type"
              value={draft}
            />
          </label>
          <Select
            aria-label="Filter by status"
            className="min-h-10 w-36"
            value={statusFilter}
            onChange={(e) => handleStatusChange(e.target.value)}
          >
            <option value="ALL">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </Select>
          <Button className="min-h-10" type="submit">
            Search
          </Button>
          {isFiltered ? (
            <Button
              className="min-h-10 gap-1.5"
              onClick={handleClearFilters}
              type="button"
              variant="secondary"
            >
              <X aria-hidden="true" className="size-4" strokeWidth={1.8} />
              Clear
            </Button>
          ) : null}
          <Button
            className="min-h-10 gap-1.5 sm:ml-auto"
            onClick={() => {
              setImportingSource(null);
              setIsImportOpen(true);
            }}
            type="button"
            variant="secondary"
          >
            <Upload aria-hidden="true" className="size-4" strokeWidth={1.8} />
            <span>Import events</span>
          </Button>
        </form>

        <div className="p-4">
          {eventSourcesQuery.isPending ? (
            <TableSkeleton
              headers={[
                "Source name",
                "Type",
                "Status",
                "Method / Endpoint",
                "Event families",
                "Last updated",
                "Actions",
              ]}
              label="Loading event sources"
              rows={4}
            />
          ) : eventSourcesQuery.isError ? (
            <Alert>
              Unable to load event sources. Please check your backend connection
              and session.
            </Alert>
          ) : eventSourcesQuery.data?.items.length === 0 ? (
            <div className="py-12 text-center">
              <Server className="text-muted mx-auto size-10 stroke-1" />
              <h4 className="mt-2 text-base font-semibold">
                No event sources found
              </h4>
              <p className="text-muted mt-1 text-sm">
                {isFiltered
                  ? "No configured event sources match the current filter criteria."
                  : "No normalized event sources have been registered yet."}
              </p>
              {onRegisterClick && !isFiltered ? (
                <Button
                  className="mt-4 min-h-9 gap-2 text-xs"
                  onClick={onRegisterClick}
                >
                  Register first source
                </Button>
              ) : null}
            </div>
          ) : eventSourcesQuery.data ? (
            <DataTable
              columns={columns}
              getRowKey={(item) => item.id}
              rows={eventSourcesQuery.data.items}
            />
          ) : null}
        </div>

        {eventSourcesQuery.data && eventSourcesQuery.data.items.length > 0 ? (
          <div className="border-border border-t p-4">
            <Pagination
              page={eventSourcesQuery.data.pagination.page}
              pageCount={eventSourcesQuery.data.pagination.totalPages}
              onPageChange={setPage}
            />
          </div>
        ) : null}
      </ProductPanel>

      <EventSourceDetailDialog
        onClose={() => setSelectedSourceId(null)}
        sourceId={selectedSourceId}
      />

      <ToggleEventSourceStatusDialog
        onClose={() => setTogglingSource(null)}
        source={togglingSource}
      />

      <ImportEventsDialog
        isOpen={isImportOpen}
        onClose={() => {
          setIsImportOpen(false);
          setImportingSource(null);
        }}
        presetSource={importingSource}
        onViewBatchReport={(batchId) => setViewingBatchId(batchId)}
      />

      {viewingBatchId ? (
        <ImportBatchResultDialog
          batchId={viewingBatchId}
          isOpen={Boolean(viewingBatchId)}
          onClose={() => setViewingBatchId(null)}
          onImportAnotherFile={() => {
            setViewingBatchId(null);
            setIsImportOpen(true);
          }}
        />
      ) : null}
    </>
  );
}

function formatDate(value: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}
