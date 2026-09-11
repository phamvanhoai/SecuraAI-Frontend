"use client";

import { Eye, RefreshCw, Search } from "lucide-react";
import { useMemo, useState } from "react";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/data-display/data-table";
import { Pagination } from "@/components/data-display/pagination";
import {
  MetricStrip,
  ProductPageHeader,
  ProductPanel,
  StatusBadge,
} from "@/components/data-display/static-product";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { TableSkeleton } from "@/components/ui/skeleton";
import { useAiAlertMetrics, useAiAlerts } from "../hooks/use-ai-alerts";
import {
  aiAlertStatuses,
  type AiAlert,
  type AiAlertStatus,
} from "../schemas/ai-alert-schema";
import {
  AiAlertDetailDialog,
  formatScore,
  formatStatus,
  statusTone,
} from "./ai-alert-detail-dialog";

type TimeRange = "all" | "1h" | "24h" | "7d";

export function AiAlertsManager() {
  const [page, setPage] = useState(1);
  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<AiAlertStatus | "all">("all");
  const [timeRange, setTimeRange] = useState<TimeRange>("24h");
  const [viewing, setViewing] = useState<AiAlert | null>(null);
  const after = useMemo(() => detectedAfter(timeRange), [timeRange]);
  const alerts = useAiAlerts({
    page,
    limit: 20,
    sortOrder: "desc",
    ...(search ? { q: search } : {}),
    ...(status === "all" ? {} : { status }),
    ...(after ? { detectedAfter: after } : {}),
  });
  const metrics = useAiAlertMetrics();

  const columns: readonly DataTableColumn<AiAlert>[] = [
    {
      key: "alert",
      header: "Alert",
      cell: (item) => (
        <span className="block min-w-56">
          <strong className="block">{item.title}</strong>
          <span className="text-muted text-xs">{item.alertCode}</span>
        </span>
      ),
    },
    {
      key: "source",
      header: "Log source",
      cell: (item) => item.logSource.name,
    },
    {
      key: "asset",
      header: "Asset",
      cell: (item) => item.asset?.name ?? "Not linked",
    },
    {
      key: "score",
      header: "Anomaly score",
      cell: (item) => (
        <span className="font-medium tabular-nums">
          {formatScore(item.anomalyScore)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (item) => (
        <StatusBadge tone={statusTone(item.status)}>
          {formatStatus(item.status)}
        </StatusBadge>
      ),
    },
    {
      key: "detected",
      header: "Detected",
      cell: (item) => formatDate(item.detectedAt),
    },
    {
      key: "actions",
      header: "Actions",
      cell: (item) => (
        <Button
          aria-label={`View details for ${item.alertCode}`}
          className="min-h-10 px-3"
          onClick={() => setViewing(item)}
          variant="secondary"
        >
          <Eye aria-hidden="true" className="size-4" strokeWidth={1.8} />
          <span className="sr-only sm:not-sr-only">View</span>
        </Button>
      ),
    },
  ];

  return (
    <>
      <ProductPageHeader
        description="Monitor AI-generated anomaly alerts from connected security log sources."
        showSampleNotice={false}
        title="AI alerts"
      />
      <MetricStrip
        ariaLabel="AI alert metrics for the last 24 hours"
        metrics={[
          {
            label: "Alerts",
            value: metrics.data ? String(metrics.data.total) : "—",
            detail: "Detected in the last 24 hours",
            tone: "brand",
            loading: metrics.isPending,
          },
          {
            label: "New",
            value: metrics.data ? String(metrics.data.newAlerts) : "—",
            detail: "Detected in the last 24 hours",
            tone: "danger",
            loading: metrics.isPending,
          },
          {
            label: "Under review",
            value: metrics.data ? String(metrics.data.reviewing) : "—",
            detail: "Detected in the last 24 hours",
            tone: "warning",
            loading: metrics.isPending,
          },
          {
            label: "Confirmed",
            value: metrics.data ? String(metrics.data.confirmed) : "—",
            detail: "Detected in the last 24 hours",
            tone: "danger",
            loading: metrics.isPending,
          },
        ]}
      />
      <ProductPanel
        description={
          alerts.data
            ? `${alerts.data.pagination.total} alerts match the current filters`
            : "Backend-generated anomaly alerts"
        }
        title="Real-time alert feed"
      >
        <form
          className="border-border flex flex-wrap items-center gap-2 border-b p-4"
          onSubmit={(event) => {
            event.preventDefault();
            setSearch(searchDraft.trim());
            setPage(1);
          }}
        >
          <label className="relative block w-full max-w-md">
            <span className="sr-only">Search AI alerts</span>
            <Search
              aria-hidden="true"
              className="text-muted absolute top-1/2 left-3 size-4 -translate-y-1/2"
              strokeWidth={1.8}
            />
            <Input
              className="bg-background min-h-10 pl-9"
              maxLength={100}
              onChange={(event) => setSearchDraft(event.target.value)}
              placeholder="Search alerts, sources, or assets"
              value={searchDraft}
            />
          </label>
          <Button className="min-h-10" type="submit">
            Search
          </Button>
          <label className="w-full sm:w-48">
            <span className="sr-only">Filter by alert status</span>
            <Select
              aria-label="Filter by alert status"
              onChange={(event) => {
                setStatus(event.target.value as AiAlertStatus | "all");
                setPage(1);
              }}
              value={status}
            >
              <option value="all">All statuses</option>
              {aiAlertStatuses.map((value) => (
                <option key={value} value={value}>
                  {formatStatus(value)}
                </option>
              ))}
            </Select>
          </label>
          <label className="w-full sm:w-48">
            <span className="sr-only">Filter by detection time</span>
            <Select
              aria-label="Filter by detection time"
              onChange={(event) => {
                setTimeRange(event.target.value as TimeRange);
                setPage(1);
              }}
              value={timeRange}
            >
              <option value="1h">Last hour</option>
              <option value="24h">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
              <option value="all">All time</option>
            </Select>
          </label>
          <div className="ml-auto flex flex-wrap items-center gap-3">
            <p aria-live="polite" className="text-muted text-xs">
              {alerts.data
                ? `Updated ${formatTime(alerts.data.serverTime)}`
                : "Updates every 10 seconds"}
            </p>
            <Button
              disabled={alerts.isFetching}
              onClick={() => void alerts.refetch()}
              variant="secondary"
            >
              <RefreshCw
                aria-hidden="true"
                className={`size-4 ${alerts.isFetching ? "animate-spin" : ""}`}
                strokeWidth={1.8}
              />
              Refresh
            </Button>
          </div>
        </form>
        <div className="p-4">
          {alerts.isPending ? (
            <TableSkeleton
              headers={[
                "Alert",
                "Log source",
                "Asset",
                "Anomaly score",
                "Status",
                "Detected",
                "Actions",
              ]}
              label="Loading AI alerts"
              rows={skeletonRows(metrics.data?.total, 6)}
            />
          ) : alerts.isError ? (
            <Alert>
              Unable to load AI alerts. Check your session, permission, and
              backend connection, then try again.
            </Alert>
          ) : alerts.data?.items.length === 0 ? (
            <div className="py-10 text-center">
              <p className="font-medium">No AI alerts found</p>
              <p className="text-muted mt-1 text-sm">
                Try a broader status or detection-time filter.
              </p>
            </div>
          ) : alerts.data ? (
            <DataTable
              columns={columns}
              getRowKey={(item) => item.id}
              rows={alerts.data.items}
            />
          ) : null}
        </div>
        {alerts.data ? (
          <div className="border-border border-t p-4">
            <Pagination
              onPageChange={setPage}
              page={alerts.data.pagination.page}
              pageCount={alerts.data.pagination.totalPages}
            />
          </div>
        ) : null}
      </ProductPanel>
      <AiAlertDetailDialog alert={viewing} onClose={() => setViewing(null)} />
    </>
  );
}

function detectedAfter(range: TimeRange): string | undefined {
  if (range === "all") return undefined;
  const milliseconds =
    range === "1h" ? 3_600_000 : range === "24h" ? 86_400_000 : 604_800_000;
  return new Date(Date.now() - milliseconds).toISOString();
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatTime(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(value));
}

function skeletonRows(total: number | undefined, fallback = 4): number {
  return total === undefined ? fallback : Math.max(1, Math.min(total, 20));
}
