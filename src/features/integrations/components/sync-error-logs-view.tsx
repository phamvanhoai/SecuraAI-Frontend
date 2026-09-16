"use client";

import {
  AlertCircle,
  AlertTriangle,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  FileWarning,
  Filter,
  Info,
  Link2,
  RefreshCw,
  Search,
  ServerCrash,
  ShieldAlert,
  X,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  useAllIntegrationLogs,
  useIntegrationLogStats,
  useIntegrations,
} from "../hooks/use-integrations";
import type { IntegrationLog } from "../schemas/integration-schema";

// ── Helpers ───────────────────────────────────────────────────────────────────

function levelIcon(level: string, className?: string) {
  if (level === "error")
    return <AlertCircle className={cn("size-3.5 text-danger", className)} />;
  if (level === "warn")
    return (
      <AlertTriangle className={cn("size-3.5 text-warning", className)} />
    );
  return <Info className={cn("size-3.5 text-brand", className)} />;
}

function levelBadge(level: string) {
  if (level === "error")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-danger/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-danger">
        <AlertCircle className="size-2.5" /> ERROR
      </span>
    );
  if (level === "warn")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-warning">
        <AlertTriangle className="size-2.5" /> WARN
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand">
      <Info className="size-2.5" /> INFO
    </span>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  bg,
  loading,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
  bg: string;
  loading?: boolean;
}) {
  return (
    <div className="border-border bg-surface flex items-center gap-3 rounded-xl border p-4">
      <span
        className={cn(
          "grid size-9 shrink-0 place-items-center rounded-lg",
          bg,
        )}
      >
        <Icon className={cn("size-4", color)} />
      </span>
      <div className="min-w-0">
        {loading ? (
          <Skeleton className="h-6 w-10 rounded" />
        ) : (
          <p className="text-2xl font-bold leading-none">{value}</p>
        )}
        <p className="text-muted mt-0.5 truncate text-[11px]">{label}</p>
      </div>
    </div>
  );
}

// ── Diagnostic Dialog ─────────────────────────────────────────────────────────

function DiagnosticDialog({
  log,
  onClose,
}: {
  log: IntegrationLog;
  onClose: () => void;
}) {
  const safeDetails = useMemo(() => {
    if (!log.details) return null;
    try {
      return JSON.stringify(log.details, null, 2);
    } catch {
      return String(log.details);
    }
  }, [log.details]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="border-border bg-background relative flex max-h-[85vh] w-full flex-col rounded-t-2xl border sm:max-w-2xl sm:rounded-2xl">
        {/* Header */}
        <div className="border-border flex items-start gap-3 border-b p-5">
          <span className="bg-danger/10 grid size-9 shrink-0 place-items-center rounded-lg">
            {levelIcon(log.level)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold leading-snug">{log.message}</p>
            <p className="text-muted mt-1 text-[11px]">
              {formatDate(log.createdAt)}
              {log.integration && (
                <>
                  {" · "}
                  <span className="text-brand font-medium">
                    {log.integration.name}
                  </span>
                </>
              )}
            </p>
          </div>
          <Button
            className="text-muted hover:text-foreground -mt-0.5 ml-auto size-7 rounded-lg bg-transparent p-0 ring-0 hover:bg-neutral-soft"
            onClick={onClose}
            type="button"
          >
            <X className="size-4" />
          </Button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Meta fields */}
          <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-3">
            <div className="border-border rounded-lg border p-3">
              <p className="text-muted mb-1 text-[10px] font-semibold uppercase tracking-wider">
                Level
              </p>
              {levelBadge(log.level)}
            </div>
            <div className="border-border rounded-lg border p-3">
              <p className="text-muted mb-1 text-[10px] font-semibold uppercase tracking-wider">
                Integration
              </p>
              <p className="font-medium truncate">
                {log.integration?.name ?? "—"}
              </p>
              <p className="text-muted text-[10px] truncate uppercase">
                {log.integration?.type ?? log.integration?.integrationType ?? ""}
              </p>
            </div>
            <div className="border-border rounded-lg border p-3">
              <p className="text-muted mb-1 text-[10px] font-semibold uppercase tracking-wider">
                Sync Job
              </p>
              {log.syncJob ? (
                <>
                  <p className="font-medium truncate text-[11px] font-mono">
                    {log.syncJob.id.slice(0, 8)}…
                  </p>
                  <p
                    className={cn(
                      "text-[10px] font-medium uppercase",
                      log.syncJob.status === "failed"
                        ? "text-danger"
                        : "text-success",
                    )}
                  >
                    {log.syncJob.status}
                  </p>
                </>
              ) : (
                <p className="text-muted text-[11px]">—</p>
              )}
            </div>
          </div>

          {/* Sync Job Error */}
          {log.syncJob?.errorMessage && (
            <div className="border-danger/30 bg-danger/5 rounded-lg border p-3">
              <p className="text-muted mb-1 text-[10px] font-semibold uppercase tracking-wider">
                Sync Job Error
              </p>
              <p className="text-danger text-xs">{log.syncJob.errorMessage}</p>
            </div>
          )}

          {/* Diagnostic Payload */}
          {safeDetails ? (
            <div>
              <p className="text-muted mb-2 text-[10px] font-semibold uppercase tracking-wider">
                Diagnostic Payload
              </p>
              <pre className="border-border bg-neutral-soft/80 overflow-x-auto rounded-lg border p-3 font-mono text-[11px] leading-relaxed text-foreground">
                {safeDetails}
              </pre>
            </div>
          ) : (
            <div className="border-border rounded-lg border border-dashed p-4 text-center text-xs text-muted">
              No diagnostic payload available for this log entry.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-border border-t px-5 py-3">
          <p className="text-muted text-[11px]">
            Log ID:{" "}
            <span className="font-mono">{log.id}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Log row ───────────────────────────────────────────────────────────────────

function LogRow({
  log,
  onViewDiagnostic,
}: {
  log: IntegrationLog;
  onViewDiagnostic: () => void;
}) {
  return (
    <tr className="border-border hover:bg-neutral-soft/50 border-b transition-colors last:border-0">
      <td className="py-3 pl-4 pr-2 align-top">
        <span className="mt-0.5 block">{levelIcon(log.level)}</span>
      </td>
      <td className="py-3 pr-3 align-top">
        {levelBadge(log.level)}
      </td>
      <td className="py-3 pr-3 align-top">
        <p className="text-foreground line-clamp-2 text-xs font-medium">
          {log.message}
        </p>
        {log.syncJob?.errorMessage && (
          <p className="text-danger mt-0.5 line-clamp-1 text-[11px]">
            ↳ {log.syncJob.errorMessage}
          </p>
        )}
      </td>
      <td className="py-3 pr-3 align-top">
        {log.integration ? (
          <div className="flex items-center gap-1.5">
            <Link2 className="text-muted size-3 shrink-0" />
            <div>
              <p className="text-foreground truncate text-xs font-medium max-w-[120px]">
                {log.integration.name}
              </p>
              <p className="text-muted text-[10px] uppercase">
                {log.integration.type ?? log.integration.integrationType ?? ""}
              </p>
            </div>
          </div>
        ) : (
          <span className="text-muted text-xs">—</span>
        )}
      </td>
      <td className="py-3 pr-4 align-top">
        <p className="text-muted whitespace-nowrap text-[11px]">
          {formatDate(log.createdAt)}
        </p>
      </td>
      <td className="py-3 pr-4 align-top">
        {log.details || log.syncJob ? (
          <Button
            className="min-h-6 px-2 text-[11px] bg-surface text-muted ring-border hover:bg-neutral-soft ring-1"
            onClick={onViewDiagnostic}
            type="button"
          >
            <Filter className="mr-1 size-2.5" />
            Xem chi tiết
          </Button>
        ) : (
          <span className="text-muted text-[11px]">—</span>
        )}
      </td>
    </tr>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function SyncErrorLogsView() {
  // Filters
  const [level, setLevel] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [integrationId, setIntegrationId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);

  // Debounce search
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearch(value);
      setPage(1);
      clearTimeout(undefined); // reset debounce (React handles re-render)
      const timer = setTimeout(() => setDebouncedSearch(value), 400);
      return () => clearTimeout(timer);
    },
    [],
  );

  // Selected log for diagnostic dialog
  const [selectedLog, setSelectedLog] = useState<IntegrationLog | null>(null);

  // Integrations list for filter dropdown
  const integrationsQuery = useIntegrations({ limit: 100 });
  const integrations = integrationsQuery.data?.items ?? [];

  // Stats
  const statsParams = useMemo(() => {
    if (!startDate && !endDate) return undefined;
    const p: { startDate?: string; endDate?: string } = {};
    if (startDate) p.startDate = startDate;
    if (endDate) p.endDate = endDate;
    return p;
  }, [startDate, endDate]);
  const statsQuery = useIntegrationLogStats(statsParams);
  const stats = statsQuery.data;

  // Logs
  const logsInput = useMemo(
    () => ({
      level: level || undefined,
      search: debouncedSearch || undefined,
      integrationId: integrationId || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      page,
      limit: 20,
    }),
    [level, debouncedSearch, integrationId, startDate, endDate, page],
  );
  const logsQuery = useAllIntegrationLogs(logsInput);
  const logs = logsQuery.data?.items ?? [];
  const pagination = logsQuery.data?.pagination;

  function clearFilters() {
    setLevel("");
    setSearch("");
    setDebouncedSearch("");
    setIntegrationId("");
    setStartDate("");
    setEndDate("");
    setPage(1);
  }

  const hasActiveFilters =
    Boolean(level) ||
    Boolean(debouncedSearch) ||
    Boolean(integrationId) ||
    Boolean(startDate) ||
    Boolean(endDate);

  const statCards = [
    {
      label: "Lỗi (ERROR)",
      value: stats?.totalErrors ?? 0,
      icon: AlertCircle,
      color: "text-danger",
      bg: "bg-danger/10",
    },
    {
      label: "Cảnh báo (WARN)",
      value: stats?.totalWarnings ?? 0,
      icon: AlertTriangle,
      color: "text-warning",
      bg: "bg-warning/10",
    },
    {
      label: "Sync Jobs lỗi",
      value: stats?.failedJobsCount ?? 0,
      icon: ServerCrash,
      color: "text-danger",
      bg: "bg-danger/8",
    },
    {
      label: "Integrations bị ảnh hưởng",
      value: stats?.affectedIntegrationsCount ?? 0,
      icon: ShieldAlert,
      color: "text-warning",
      bg: "bg-warning/8",
    },
  ] as const;

  return (
    <>
      {/* Diagnostic dialog */}
      {selectedLog && (
        <DiagnosticDialog
          log={selectedLog}
          onClose={() => setSelectedLog(null)}
        />
      )}

      <div className="space-y-6">
        {/* Page header */}
        <div className="flex items-center gap-3">
          <span className="bg-danger/10 grid size-10 place-items-center rounded-xl">
            <FileWarning className="text-danger size-5" />
          </span>
          <div>
            <h2 className="text-lg font-semibold">
              Nhật ký lỗi đồng bộ dữ liệu
            </h2>
            <p className="text-muted text-sm">
              Theo dõi lỗi và cảnh báo phát sinh trong quá trình đồng bộ log từ
              các integration.
            </p>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {statCards.map((c) => (
            <StatCard
              bg={c.bg}
              color={c.color}
              icon={c.icon}
              key={c.label}
              label={c.label}
              loading={statsQuery.isLoading}
              value={c.value}
            />
          ))}
        </div>

        {/* Filter bar */}
        <div className="border-border bg-surface rounded-xl border p-4">
          <div className="flex flex-wrap items-end gap-3">
            {/* Search */}
            <div className="relative min-w-[200px] flex-1">
              <Search className="text-muted pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2" />
              <Input
                className="h-9 pl-8 text-xs"
                id="sync-error-logs-search"
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Tìm theo message, tên integration…"
                type="search"
                value={search}
              />
            </div>

            {/* Level filter */}
            <Select
              className="h-9 w-36 text-xs"
              id="sync-error-logs-level"
              onChange={(e) => {
                setLevel(e.target.value);
                setPage(1);
              }}
              value={level}
            >
              <option value="">Tất cả mức</option>
              <option value="error">ERROR</option>
              <option value="warn">WARN</option>
              <option value="info">INFO</option>
            </Select>

            {/* Integration filter */}
            <Select
              className="h-9 w-44 text-xs"
              id="sync-error-logs-integration"
              onChange={(e) => {
                setIntegrationId(e.target.value);
                setPage(1);
              }}
              value={integrationId}
            >
              <option value="">Tất cả integration</option>
              {integrations.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </Select>

            {/* Date range */}
            <div className="flex items-center gap-2">
              <input
                className="border-border bg-background text-foreground h-9 rounded-lg border px-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand/50"
                id="sync-error-logs-start-date"
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
                placeholder="Từ ngày"
                title="Từ ngày"
                type="date"
                value={startDate}
              />
              <span className="text-muted text-xs">→</span>
              <input
                className="border-border bg-background text-foreground h-9 rounded-lg border px-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand/50"
                id="sync-error-logs-end-date"
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
                placeholder="Đến ngày"
                title="Đến ngày"
                type="date"
                value={endDate}
              />
            </div>

            {/* Refresh + clear */}
            <Button
              className="h-9 px-3 text-xs bg-surface text-foreground ring-1 ring-border hover:bg-neutral-soft"
              onClick={() => logsQuery.refetch()}
              type="button"
            >
              <RefreshCw
                className={cn(
                  "size-3.5",
                  logsQuery.isFetching && "animate-spin",
                )}
              />
            </Button>
            {hasActiveFilters && (
              <Button
                className="h-9 px-3 text-xs bg-transparent text-muted hover:text-danger hover:bg-neutral-soft"
                onClick={clearFilters}
                type="button"
              >
                <X className="mr-1 size-3.5" />
                Xóa bộ lọc
              </Button>
            )}
          </div>
        </div>

        {/* Log table */}
        <div className="border-border rounded-xl border">
          {logsQuery.isLoading ? (
            <div className="space-y-px p-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton className="h-14 rounded-lg" key={i} />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <span className="bg-neutral-soft grid size-14 place-items-center rounded-2xl">
                <BarChart3 className="text-muted size-7" />
              </span>
              <div>
                <p className="text-sm font-medium">Không có log nào</p>
                <p className="text-muted mt-1 text-xs">
                  {hasActiveFilters
                    ? "Không tìm thấy log phù hợp với bộ lọc đang chọn."
                    : "Chưa có nhật ký đồng bộ nào được ghi lại."}
                </p>
              </div>
              {hasActiveFilters && (
                <Button
                  className="text-xs bg-surface text-foreground ring-1 ring-border hover:bg-neutral-soft"
                  onClick={clearFilters}
                  type="button"
                >
                  Xóa bộ lọc
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-border border-b">
                    <th className="pb-2.5 pl-4 pr-2 pt-3 text-[10px] font-semibold uppercase tracking-wider text-muted w-6" />
                    <th className="pb-2.5 pr-3 pt-3 text-[10px] font-semibold uppercase tracking-wider text-muted">
                      Mức
                    </th>
                    <th className="pb-2.5 pr-3 pt-3 text-[10px] font-semibold uppercase tracking-wider text-muted">
                      Thông điệp
                    </th>
                    <th className="pb-2.5 pr-3 pt-3 text-[10px] font-semibold uppercase tracking-wider text-muted">
                      Integration
                    </th>
                    <th className="pb-2.5 pr-4 pt-3 text-[10px] font-semibold uppercase tracking-wider text-muted whitespace-nowrap">
                      Thời gian (UTC)
                    </th>
                    <th className="pb-2.5 pr-4 pt-3 text-[10px] font-semibold uppercase tracking-wider text-muted">
                      Chi tiết
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <LogRow
                      key={log.id}
                      log={log}
                      onViewDiagnostic={() => setSelectedLog(log)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="border-border flex items-center justify-between border-t px-4 py-3">
              <p className="text-muted text-xs">
                Trang {pagination.page}/{pagination.totalPages} · {pagination.total} log
              </p>
              <div className="flex items-center gap-1.5">
                <Button
                  className="size-7 p-0 text-xs bg-surface text-foreground ring-1 ring-border hover:bg-neutral-soft disabled:opacity-50"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  type="button"
                >
                  <ChevronLeft className="size-3.5" />
                </Button>
                <Button
                  className="size-7 p-0 text-xs bg-surface text-foreground ring-1 ring-border hover:bg-neutral-soft disabled:opacity-50"
                  disabled={page >= pagination.totalPages}
                  onClick={() =>
                    setPage((p) => Math.min(pagination.totalPages, p + 1))
                  }
                  type="button"
                >
                  <ChevronRight className="size-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
