"use client";

import {
  Calendar,
  ChevronDown,
  ChevronUp,
  Eye,
  Filter,
  Layers,
  RotateCcw,
  Search,
  ShieldAlert,
  UserCheck,
  X,
} from "lucide-react";
import { useId, useState, type FormEvent } from "react";
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
import { useNormalizedEvents } from "../hooks/use-normalized-events";
import {
  eventFamilies,
  mappingStatuses,
  type EventFamily,
  type MappingStatus,
  type NormalizedEventItem,
} from "../schemas/normalized-event-schema";
import { NormalizedEventDetailDialog } from "./normalized-event-detail-dialog";
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
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(false);

  // Search and Filter States
  const [searchDraft, setSearchDraft] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [familyFilter, setFamilyFilter] = useState<string>("ALL");
  const [sourceFilter, setSourceFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [sourceIpFilter, setSourceIpFilter] = useState("");
  const [accountFilter, setAccountFilter] = useState("");
  const [assetFilter, setAssetFilter] = useState("");
  const [fromDateFilter, setFromDateFilter] = useState("");
  const [toDateFilter, setToDateFilter] = useState("");

  const searchInputId = useId();
  const familySelectId = useId();
  const sourceSelectId = useId();
  const statusSelectId = useId();
  const sourceIpInputId = useId();
  const accountInputId = useId();
  const assetInputId = useId();
  const fromDateInputId = useId();
  const toDateInputId = useId();

  // Load available event sources for filter dropdown
  const eventSourcesQuery = useEventSources({ limit: 100 });

  const queryParams = {
    page,
    limit: 20,
    ...(searchQuery ? { q: searchQuery } : {}),
    ...(familyFilter !== "ALL" ? { eventFamily: familyFilter as EventFamily } : {}),
    ...(sourceFilter !== "ALL" ? { eventSourceId: sourceFilter } : {}),
    ...(statusFilter !== "ALL"
      ? { mappingStatus: statusFilter as MappingStatus }
      : {}),
    ...(sourceIpFilter ? { sourceIp: sourceIpFilter } : {}),
    ...(accountFilter ? { account: accountFilter } : {}),
    ...(assetFilter ? { asset: assetFilter } : {}),
    ...(fromDateFilter ? { from: fromDateFilter } : {}),
    ...(toDateFilter ? { to: toDateFilter } : {}),
  };

  const eventsQuery = useNormalizedEvents(queryParams);

  const hasActiveFilters = Boolean(
    searchQuery ||
      familyFilter !== "ALL" ||
      sourceFilter !== "ALL" ||
      statusFilter !== "ALL" ||
      sourceIpFilter ||
      accountFilter ||
      assetFilter ||
      fromDateFilter ||
      toDateFilter,
  );

  const activeFilterCount = [
    Boolean(searchQuery),
    familyFilter !== "ALL",
    sourceFilter !== "ALL",
    statusFilter !== "ALL",
    Boolean(sourceIpFilter),
    Boolean(accountFilter),
    Boolean(assetFilter),
    Boolean(fromDateFilter || toDateFilter),
  ].filter(Boolean).length;

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchDraft.trim());
    setPage(1);
  };

  const handleClearAllFilters = () => {
    setSearchDraft("");
    setSearchQuery("");
    setFamilyFilter("ALL");
    setSourceFilter("ALL");
    setStatusFilter("ALL");
    setSourceIpFilter("");
    setAccountFilter("");
    setAssetFilter("");
    setFromDateFilter("");
    setToDateFilter("");
    setPage(1);
  };

  const handleTimePreset = (preset: "24h" | "7d" | "30d") => {
    const now = new Date();
    let past = new Date();
    if (preset === "24h") {
      past = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    } else if (preset === "7d") {
      past = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (preset === "30d") {
      past = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    setFromDateFilter(past.toISOString().split("T")[0] ?? "");
    setToDateFilter(now.toISOString().split("T")[0] ?? "");
    setPage(1);
  };

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
    {
      key: "actions",
      header: "Actions",
      cell: (item) => (
        <Button
          type="button"
          variant="secondary"
          className="min-h-7 py-0.5 px-2 text-xs flex items-center gap-1"
          onClick={() => {
            setSelectedEventId(item.id);
            setIsDetailOpen(true);
          }}
        >
          <Eye className="size-3.5" />
          <span>View</span>
        </Button>
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
          {/* Top Filter Bar */}
          <div className="space-y-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              {/* Free Text Search */}
              <form
                onSubmit={handleSearchSubmit}
                className="flex items-center gap-2 flex-1 max-w-md"
              >
                <div className="relative flex-1">
                  <Search className="text-muted absolute left-3 top-1/2 -translate-y-1/2 size-4 pointer-events-none" />
                  <Input
                    id={searchInputId}
                    type="search"
                    placeholder="Search event type, account, IP, asset..."
                    className="pl-9 pr-8"
                    value={searchDraft}
                    onChange={(e) => setSearchDraft(e.target.value)}
                  />
                  {searchDraft ? (
                    <button
                      type="button"
                      aria-label="Clear search text"
                      className="text-muted hover:text-foreground absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5"
                      onClick={() => {
                        setSearchDraft("");
                        setSearchQuery("");
                        setPage(1);
                      }}
                    >
                      <X className="size-3.5" />
                    </button>
                  ) : null}
                </div>
                <Button type="submit" variant="secondary" className="text-xs px-3">
                  Search
                </Button>
              </form>

              {/* Quick Dropdown Filters */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Event Family Filter */}
                <div className="w-40">
                  <Select
                    id={familySelectId}
                    aria-label="Filter by event family"
                    value={familyFilter}
                    onChange={(e) => {
                      setFamilyFilter(e.target.value);
                      setPage(1);
                    }}
                    className="h-9 text-xs"
                  >
                    <option value="ALL">All Families</option>
                    {eventFamilies.map((f) => (
                      <option key={f} value={f}>
                        {formatFamilyLabel[f] ?? f}
                      </option>
                    ))}
                  </Select>
                </div>

                {/* Source Filter */}
                <div className="w-44">
                  <Select
                    id={sourceSelectId}
                    aria-label="Filter by event source"
                    value={sourceFilter}
                    onChange={(e) => {
                      setSourceFilter(e.target.value);
                      setPage(1);
                    }}
                    className="h-9 text-xs"
                  >
                    <option value="ALL">All Sources</option>
                    {eventSourcesQuery.data?.items.map((src) => (
                      <option key={src.id} value={src.id}>
                        {src.name}
                      </option>
                    ))}
                  </Select>
                </div>

                {/* Ingestion / Mapping Status Filter */}
                <div className="w-40">
                  <Select
                    id={statusSelectId}
                    aria-label="Filter by ingestion status"
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setPage(1);
                    }}
                    className="h-9 text-xs"
                  >
                    <option value="ALL">All Statuses</option>
                    {mappingStatuses.map((s) => (
                      <option key={s} value={s}>
                        {s.replace(/_/g, " ")}
                      </option>
                    ))}
                  </Select>
                </div>

                {/* Advanced Filters Toggle Button */}
                <Button
                  type="button"
                  variant={isAdvancedFiltersOpen ? "primary" : "secondary"}
                  className="h-9 text-xs flex items-center gap-1.5"
                  onClick={() => setIsAdvancedFiltersOpen(!isAdvancedFiltersOpen)}
                >
                  <Filter className="size-3.5" />
                  <span>Filters</span>
                  {activeFilterCount > 0 ? (
                    <span className="inline-flex size-4 items-center justify-center rounded-full bg-brand-soft text-[10px] font-bold text-brand">
                      {activeFilterCount}
                    </span>
                  ) : null}
                  {isAdvancedFiltersOpen ? (
                    <ChevronUp className="size-3" />
                  ) : (
                    <ChevronDown className="size-3" />
                  )}
                </Button>

                {/* Reset Filters */}
                {hasActiveFilters ? (
                  <Button
                    type="button"
                    variant="secondary"
                    className="h-9 text-xs text-muted hover:text-foreground flex items-center gap-1"
                    onClick={handleClearAllFilters}
                  >
                    <RotateCcw className="size-3.5" />
                    <span>Reset</span>
                  </Button>
                ) : null}
              </div>
            </div>

            {/* Collapsible Advanced Filters Panel */}
            {isAdvancedFiltersOpen ? (
              <div className="rounded-lg border border-border bg-neutral-soft/30 p-3.5 space-y-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {/* Time Range: From */}
                  <div>
                    <label
                      htmlFor={fromDateInputId}
                      className="text-muted block text-xs font-medium mb-1"
                    >
                      From Date
                    </label>
                    <Input
                      id={fromDateInputId}
                      type="date"
                      value={fromDateFilter}
                      onChange={(e) => {
                        setFromDateFilter(e.target.value);
                        setPage(1);
                      }}
                      className="h-8 text-xs"
                    />
                  </div>

                  {/* Time Range: To */}
                  <div>
                    <label
                      htmlFor={toDateInputId}
                      className="text-muted block text-xs font-medium mb-1"
                    >
                      To Date
                    </label>
                    <Input
                      id={toDateInputId}
                      type="date"
                      value={toDateFilter}
                      onChange={(e) => {
                        setToDateFilter(e.target.value);
                        setPage(1);
                      }}
                      className="h-8 text-xs"
                    />
                  </div>

                  {/* Source IP Filter */}
                  <div>
                    <label
                      htmlFor={sourceIpInputId}
                      className="text-muted block text-xs font-medium mb-1"
                    >
                      Source IP Address
                    </label>
                    <Input
                      id={sourceIpInputId}
                      type="text"
                      placeholder="e.g. 192.168.1.100"
                      value={sourceIpFilter}
                      onChange={(e) => {
                        setSourceIpFilter(e.target.value);
                        setPage(1);
                      }}
                      className="h-8 text-xs font-mono"
                    />
                  </div>

                  {/* User Account Filter */}
                  <div>
                    <label
                      htmlFor={accountInputId}
                      className="text-muted block text-xs font-medium mb-1"
                    >
                      User Account
                    </label>
                    <Input
                      id={accountInputId}
                      type="text"
                      placeholder="e.g. admin@company.com"
                      value={accountFilter}
                      onChange={(e) => {
                        setAccountFilter(e.target.value);
                        setPage(1);
                      }}
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                </div>

                {/* Second row of advanced filters */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 items-end">
                  {/* Associated Asset Filter */}
                  <div>
                    <label
                      htmlFor={assetInputId}
                      className="text-muted block text-xs font-medium mb-1"
                    >
                      Associated Asset
                    </label>
                    <Input
                      id={assetInputId}
                      type="text"
                      placeholder="e.g. AST-DC-01, Server..."
                      value={assetFilter}
                      onChange={(e) => {
                        setAssetFilter(e.target.value);
                        setPage(1);
                      }}
                      className="h-8 text-xs"
                    />
                  </div>

                  {/* Time Range Quick Presets */}
                  <div className="sm:col-span-2 lg:col-span-3">
                    <span className="text-muted block text-xs font-medium mb-1">
                      Quick Time Presets
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Button
                        type="button"
                        variant="secondary"
                        className="h-8 text-xs px-2.5 py-1 flex items-center gap-1"
                        onClick={() => handleTimePreset("24h")}
                      >
                        <Calendar className="size-3" />
                        <span>Last 24 Hours</span>
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        className="h-8 text-xs px-2.5 py-1 flex items-center gap-1"
                        onClick={() => handleTimePreset("7d")}
                      >
                        <Calendar className="size-3" />
                        <span>Last 7 Days</span>
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        className="h-8 text-xs px-2.5 py-1 flex items-center gap-1"
                        onClick={() => handleTimePreset("30d")}
                      >
                        <Calendar className="size-3" />
                        <span>Last 30 Days</span>
                      </Button>
                      {(fromDateFilter || toDateFilter) ? (
                        <Button
                          type="button"
                          variant="secondary"
                          className="h-8 text-xs px-2 text-muted hover:text-foreground"
                          onClick={() => {
                            setFromDateFilter("");
                            setToDateFilter("");
                            setPage(1);
                          }}
                        >
                          Clear Range
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Active Filter Tags */}
            {hasActiveFilters ? (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-muted text-[11px] font-medium mr-1">
                  Active criteria:
                </span>
                {searchQuery ? (
                  <span className="inline-flex items-center gap-1 rounded-md border border-border bg-surface px-2 py-0.5 text-xs text-foreground">
                    <span>Query: &quot;{searchQuery}&quot;</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery("");
                        setSearchDraft("");
                        setPage(1);
                      }}
                      className="text-muted hover:text-foreground"
                      aria-label="Remove search filter"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ) : null}
                {familyFilter !== "ALL" ? (
                  <span className="inline-flex items-center gap-1 rounded-md border border-border bg-surface px-2 py-0.5 text-xs text-foreground">
                    <span>Family: {formatFamilyLabel[familyFilter] ?? familyFilter}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setFamilyFilter("ALL");
                        setPage(1);
                      }}
                      className="text-muted hover:text-foreground"
                      aria-label="Remove family filter"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ) : null}
                {sourceFilter !== "ALL" ? (
                  <span className="inline-flex items-center gap-1 rounded-md border border-border bg-surface px-2 py-0.5 text-xs text-foreground">
                    <span>
                      Source:{" "}
                      {eventSourcesQuery.data?.items.find((s) => s.id === sourceFilter)?.name ??
                        sourceFilter}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSourceFilter("ALL");
                        setPage(1);
                      }}
                      className="text-muted hover:text-foreground"
                      aria-label="Remove source filter"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ) : null}
                {statusFilter !== "ALL" ? (
                  <span className="inline-flex items-center gap-1 rounded-md border border-border bg-surface px-2 py-0.5 text-xs text-foreground">
                    <span>Status: {statusFilter.replace(/_/g, " ")}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setStatusFilter("ALL");
                        setPage(1);
                      }}
                      className="text-muted hover:text-foreground"
                      aria-label="Remove status filter"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ) : null}
                {sourceIpFilter ? (
                  <span className="inline-flex items-center gap-1 rounded-md border border-border bg-surface px-2 py-0.5 text-xs text-foreground">
                    <span>IP: {sourceIpFilter}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSourceIpFilter("");
                        setPage(1);
                      }}
                      className="text-muted hover:text-foreground"
                      aria-label="Remove IP filter"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ) : null}
                {accountFilter ? (
                  <span className="inline-flex items-center gap-1 rounded-md border border-border bg-surface px-2 py-0.5 text-xs text-foreground">
                    <span>Account: {accountFilter}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setAccountFilter("");
                        setPage(1);
                      }}
                      className="text-muted hover:text-foreground"
                      aria-label="Remove account filter"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ) : null}
                {assetFilter ? (
                  <span className="inline-flex items-center gap-1 rounded-md border border-border bg-surface px-2 py-0.5 text-xs text-foreground">
                    <span>Asset: {assetFilter}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setAssetFilter("");
                        setPage(1);
                      }}
                      className="text-muted hover:text-foreground"
                      aria-label="Remove asset filter"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ) : null}
                {fromDateFilter || toDateFilter ? (
                  <span className="inline-flex items-center gap-1 rounded-md border border-border bg-surface px-2 py-0.5 text-xs text-foreground">
                    <span>
                      Time: {fromDateFilter || "Start"} → {toDateFilter || "Now"}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setFromDateFilter("");
                        setToDateFilter("");
                        setPage(1);
                      }}
                      className="text-muted hover:text-foreground"
                      aria-label="Remove time filter"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>

          {eventsQuery.isPending ? (
            <TableSkeleton rows={6} />
          ) : eventsQuery.error ? (
            <Alert>{eventsQuery.error.message}</Alert>
          ) : eventsQuery.data.items.length === 0 ? (
            <div className="py-12 text-center">
              <Layers className="text-muted mx-auto mb-3 size-10" />
              <h3 className="text-foreground font-semibold text-base">
                {hasActiveFilters
                  ? "No matching security events found"
                  : "No security events found"}
              </h3>
              <p className="text-muted mx-auto mt-1 max-w-sm text-sm">
                {hasActiveFilters
                  ? "No security events match your search and filter criteria. Try adjusting your filters."
                  : "No telemetry events have been ingested into the system yet."}
              </p>
              {hasActiveFilters ? (
                <div className="mt-4">
                  <Button
                    type="button"
                    variant="secondary"
                    className="text-xs"
                    onClick={handleClearAllFilters}
                  >
                    Clear all filters
                  </Button>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-muted">
                <span>
                  Showing {eventsQuery.data.items.length} of{" "}
                  {eventsQuery.data.pagination.total} security events
                </span>
              </div>

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

      <NormalizedEventDetailDialog
        eventId={selectedEventId}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
      />
    </div>
  );
}

