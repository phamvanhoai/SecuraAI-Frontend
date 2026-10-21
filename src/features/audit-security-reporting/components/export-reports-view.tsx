"use client";

import { useState } from "react";
import {
  Ban,
  Download,
  FileCheck,
  FileSpreadsheet,
  FileText,
  Plus,
  RefreshCw,
  ShieldAlert,
  User,
  X,
} from "lucide-react";
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
import { Select } from "@/components/ui/select";
import { TableSkeleton } from "@/components/ui/skeleton";
import { useSessionUser } from "@/features/authentication-account";
import { useExportReportsQuery } from "../hooks/use-export-reports";
import type { ReportExportItem } from "../schemas/export-report-schema";
import { ExportReportDialog } from "./export-report-dialog";
import { RevokeReportDialog } from "./revoke-report-dialog";
import { RevokeStatusBadge } from "./revoke-status-badge";
import { cn } from "@/lib/utils";

function getReportTypeLabel(type: string): { title: string; subtitle: string; icon: typeof FileSpreadsheet } {
  switch (type) {
    case "RISK":
      return {
        title: "Security Risk Register",
        subtitle: "Threats, Impacts & Treatments",
        icon: ShieldAlert,
      };
    case "INCIDENT":
      return {
        title: "Security Incident Records",
        subtitle: "Incident Log & Resolution Lifecycle",
        icon: FileText,
      };
    case "SECURITY_POSTURE":
      return {
        title: "Executive Security Posture",
        subtitle: "Overall Indicators & ISO 27001 Metrics",
        icon: FileCheck,
      };
    case "INVESTIGATION_LOGS":
      return {
        title: "Investigation Logs & Audit",
        subtitle: "Event Ingestion & Audit Trails",
        icon: FileText,
      };
    default:
      return {
        title: `${type} Report`,
        subtitle: "Security & Operations Export",
        icon: FileSpreadsheet,
      };
  }
}

function getFormatBadgeTone(format: string): "success" | "warning" | "info" | "neutral" {
  switch (format.toUpperCase()) {
    case "EXCEL":
    case "XLSX":
      return "success";
    case "PDF":
      return "warning";
    case "CSV":
      return "info";
    default:
      return "neutral";
  }
}

function getStatusBadgeTone(status: string): "success" | "warning" | "danger" | "info" | "neutral" {
  switch (status) {
    case "COMPLETED":
      return "success";
    case "GENERATING":
    case "REQUESTED":
      return "warning";
    case "FAILED":
      return "danger";
    default:
      return "neutral";
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case "COMPLETED":
      return "Completed";
    case "GENERATING":
      return "Generating";
    case "REQUESTED":
      return "Requested";
    case "FAILED":
      return "Failed";
    default:
      return status;
  }
}

function formatPeriodText(period?: string): string {
  if (!period) return "All available records";
  if (period.includes(" to ")) {
    const [start, end] = period.split(" to ");
    const formatDate = (d?: string) => {
      if (!d || d === "All") return "All";
      if (d === "Now") return "Present";
      try {
        const parsed = new Date(d);
        if (isNaN(parsed.getTime())) return d;
        return new Intl.DateTimeFormat("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }).format(parsed);
      } catch {
        return d;
      }
    };
    return `${formatDate(start)} – ${formatDate(end)}`;
  }
  return period;
}

function formatExactTime(isoString: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date(isoString));
  } catch {
    return isoString;
  }
}

export function ExportReportsView() {
  const session = useSessionUser();
  const canAccess =
    session.data?.roles.some(
      (role) => role.code === "SECURITY_OFFICER" || role.code === "EXECUTIVE",
    ) ?? false;

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [revokingItem, setRevokingItem] = useState<ReportExportItem | null>(null);
  const [page, setPage] = useState(1);
  const limit = 10;

  const [reportTypeFilter, setReportTypeFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  const {
    data: reportsData,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useExportReportsQuery({
    page,
    limit,
    reportType: reportTypeFilter || undefined,
    status: statusFilter || undefined,
  }, canAccess);

  const items = reportsData?.items ?? [];
  const pagination = reportsData?.pagination ?? {
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 1,
  };

  const totalReports = pagination.totalItems;
  const riskReportsCount = items.filter((r) => r.reportType === "RISK").length;
  const incidentReportsCount = items.filter((r) => r.reportType === "INCIDENT").length;
  const postureReportsCount = items.filter((r) => r.reportType === "SECURITY_POSTURE").length;

  const handleDownload = (item: ReportExportItem) => {
    const link = document.createElement("a");
    link.href = `/api/reports/exports/${item.id}/download`;
    link.setAttribute("download", "");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns: readonly DataTableColumn<ReportExportItem>[] = [
    {
      key: "reportType",
      header: "Report",
      cell: (item: ReportExportItem) => {
        const info = getReportTypeLabel(item.reportType);
        const Icon = info.icon;
        return (
          <div className="flex items-center gap-3">
            <span className="bg-brand-soft text-brand grid size-9 place-items-center rounded-lg shrink-0">
              <Icon className="size-4" />
            </span>
            <div className="flex flex-col min-w-0">
              <span className="font-medium text-foreground">{info.title}</span>
              <span className="text-muted text-xs truncate max-w-[240px]">
                {info.subtitle} • ID: {item.id.slice(0, 8)}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      key: "format",
      header: "Format",
      cell: (item: ReportExportItem) => (
        <StatusBadge tone={getFormatBadgeTone(item.format)}>
          <span className="font-mono text-xs font-semibold">{item.format}</span>
        </StatusBadge>
      ),
    },
    {
      key: "requestedBy",
      header: "Requested By",
      cell: (item: ReportExportItem) => (
        <div className="flex items-center gap-2">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-surface-subtle border border-border">
            <User className="size-3.5 text-muted" />
          </div>
          <div className="flex flex-col truncate">
            <span className="font-medium text-foreground truncate max-w-[160px]">
              {item.requestedBy.fullName}
            </span>
            <span className="text-xs text-muted font-mono">
              {item.requestedBy.role}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "filters",
      header: "Scope & Filters",
      cell: (item: ReportExportItem) => {
        const summary = item.summary;
        const filters = item.filters as Record<string, string | undefined> | null;
        return (
          <div className="flex flex-col text-xs text-muted">
            <span className="font-medium text-foreground">
              {formatPeriodText(summary?.period)}
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              {summary?.recordCount !== undefined && (
                <span>Records: <strong className="text-foreground">{summary.recordCount}</strong></span>
              )}
              {filters?.severity && (
                <>
                  <span>•</span>
                  <span>Severity: <strong className="text-foreground">{filters.severity}</strong></span>
                </>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: "createdAt",
      header: "Generated At",
      cell: (item: ReportExportItem) => (
        <div className="flex flex-col text-xs">
          <span className="font-medium text-foreground">
            {formatExactTime(item.createdAt)}
          </span>
          {item.generatedAt && item.generatedAt !== item.createdAt && (
            <span className="text-muted text-[11px]">
              Completed: {formatExactTime(item.generatedAt)}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (item: ReportExportItem) => {
        if (item.isRevoked) {
          return (
            <RevokeStatusBadge
              revokedBy={item.revokedBy}
              revokedAt={item.revokedAt}
              reason={item.revocationReason}
            />
          );
        }

        return (
          <StatusBadge tone={getStatusBadgeTone(item.status)}>
            {getStatusLabel(item.status)}
          </StatusBadge>
        );
      },
    },
    {
      key: "actions",
      header: "Actions",
      cell: (item: ReportExportItem) => (
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="secondary"
            onClick={() => handleDownload(item)}
            disabled={item.status !== "COMPLETED" || item.isRevoked}
            className={cn(
              "size-8 p-0 text-xs",
              item.isRevoked && "opacity-45 cursor-not-allowed",
            )}
            title={item.isRevoked ? "This report export has been revoked and cannot be downloaded" : "Download report file"}
            aria-label="Download report file"
          >
            <Download className="size-3.5" />
          </Button>

          {!item.isRevoked && item.status === "COMPLETED" && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => setRevokingItem(item)}
              className="size-8 p-0 text-xs text-danger hover:text-danger hover:bg-danger-soft border-border hover:border-danger/30"
              title="Revoke this report export"
              aria-label="Revoke this report export"
            >
              <Ban className="size-3.5" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  if (session.isPending) {
    return (
      <div className="space-y-6">
        <ProductPageHeader
          title="Security & Risk Reports"
          description="Compile and export security risk registers, incident logs, and organization security posture reports for executive leadership and compliance auditors in accordance with ISO/IEC 27001."
        />
        <TableSkeleton columns={6} rows={5} />
      </div>
    );
  }

  if (!canAccess) {
    return (
      <div className="space-y-6">
        <ProductPageHeader
          title="Security & Risk Reports"
          description="Compile and export security risk registers, incident logs, and organization security posture reports for executive leadership and compliance auditors in accordance with ISO/IEC 27001."
        />
        <Alert>This reporting module is available to Security Officers and Executives only.</Alert>
      </div>
    );
  }

  return (
    <>
      <ProductPageHeader
        title="Security & Risk Reports"
        description="Compile and export security risk registers, incident logs, and organization security posture reports for executive leadership and compliance auditors in accordance with ISO/IEC 27001."
        primaryAction="Generate Report"
        onPrimaryAction={() => setIsDialogOpen(true)}
        additionalActions={
          <Button
            type="button"
            variant="secondary"
            onClick={() => void refetch()}
            disabled={isFetching}
            className="gap-1.5"
          >
            <RefreshCw className={cn("size-3.5", isFetching && "animate-spin")} />
            <span>Refresh</span>
          </Button>
        }
      />

      <MetricStrip
        metrics={[
          {
            label: "Total Exports",
            value: String(totalReports),
            detail: "Recorded in system",
            tone: "brand",
          },
          {
            label: "Risk Registers",
            value: String(riskReportsCount),
            detail: "Assessments & treatments",
            tone: "neutral",
          },
          {
            label: "Incident Logs",
            value: String(incidentReportsCount),
            detail: "Security incidents",
            tone: "brand",
          },
          {
            label: "Security Posture",
            value: String(postureReportsCount),
            detail: "Posture & compliance KPIs",
            tone: "brand",
          },
        ]}
      />

      <div className="grid gap-6">
        <ProductPanel title="Exported Reports History">
          {/* Filters Toolbar - Cleaned and optimized without redundant button */}
          <div className="border-b border-border p-4 bg-surface-subtle/50 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="w-56">
                <Select
                  value={reportTypeFilter}
                  onChange={(e) => {
                    setReportTypeFilter(e.target.value);
                    setPage(1);
                  }}
                  className="min-h-9 text-xs"
                >
                  <option value="">All Security Reports</option>
                  <option value="RISK">Risk Register (RISK)</option>
                  <option value="INCIDENT">Incident Log (INCIDENT)</option>
                  <option value="SECURITY_POSTURE">Security Posture (POSTURE)</option>
                </Select>
              </div>

              <div className="w-44">
                <Select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  className="min-h-9 text-xs"
                >
                  <option value="">All Statuses</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="GENERATING">Generating</option>
                  <option value="FAILED">Failed</option>
                </Select>
              </div>

              {(reportTypeFilter || statusFilter) && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setReportTypeFilter("");
                    setStatusFilter("");
                    setPage(1);
                  }}
                  className="min-h-9 text-xs gap-1 text-muted hover:text-foreground"
                >
                  <X className="size-3.5" />
                  <span>Clear filters</span>
                </Button>
              )}
            </div>

            <span className="text-xs text-muted">
              {pagination.totalItems} total record{pagination.totalItems !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Table Content */}
          {isLoading ? (
            <div className="p-4">
              <TableSkeleton rows={5} columns={7} />
            </div>
          ) : isError ? (
            <div className="p-6">
              <Alert className="border-danger/30 bg-danger-soft text-danger">
                <div className="flex items-center justify-between">
                  <span>Failed to load report exports: {error?.message}</span>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => void refetch()}
                  >
                    Retry
                  </Button>
                </div>
              </Alert>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-muted">
              <FileSpreadsheet className="size-10 text-muted/60" />
              <p className="mt-3 font-semibold text-foreground">
                No report exports found
              </p>
              <p className="mt-1 text-xs max-w-sm">
                Click &ldquo;Generate Report&rdquo; above to compile risk assessments, incident logs, or security posture indicators.
              </p>
              <Button
                type="button"
                variant="primary"
                onClick={() => setIsDialogOpen(true)}
                className="mt-4 gap-1.5 text-xs"
              >
                <Plus className="size-3.5" />
                <span>Generate First Report</span>
              </Button>
            </div>
          ) : (
            <div>
              <DataTable
                columns={columns}
                rows={items}
                getRowKey={(item: ReportExportItem) => item.id}
              />

              <div className="border-t border-border p-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted">
                <span>
                  Showing {items.length} of {pagination.totalItems} report exports
                </span>
                <Pagination
                  page={pagination.page}
                  pageCount={pagination.totalPages}
                  onPageChange={(newPage) => setPage(newPage)}
                />
              </div>
            </div>
          )}
        </ProductPanel>
      </div>

      <ExportReportDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />

      <RevokeReportDialog
        item={revokingItem}
        isOpen={!!revokingItem}
        onClose={() => setRevokingItem(null)}
      />
    </>
  );
}
