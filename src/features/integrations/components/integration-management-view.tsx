"use client";

import {
  LayoutGrid,
  RefreshCw,
  Search,
  Table as TableIcon,
} from "lucide-react";
import { useState } from "react";
import { Pagination } from "@/components/data-display/pagination";
import { ProductPageHeader } from "@/components/data-display/static-product";
import { EmptyState } from "@/components/feedback/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useConnectionStatusSummary,
  useIntegrations,
} from "../hooks/use-integrations";
import type {
  IntegrationStatus,
  IntegrationType,
} from "../schemas/integration-schema";
import { ConnectIntegrationModal } from "./connect-integration-modal";
import { ConnectionMonitoringHeader } from "./connection-monitoring-header";
import { ConnectionStatusTable } from "./connection-status-table";
import { IntegrationCard } from "./integration-card";
import { IntegrationDetailDrawer } from "./integration-detail-drawer";

export function IntegrationManagementView() {
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number | false>(30000);

  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [selectedIntegrationId, setSelectedIntegrationId] = useState<
    string | null
  >(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Live Connection Status Summary
  const summaryQuery = useConnectionStatusSummary({
    timeWindow: "24h",
    refetchInterval: autoRefreshInterval,
  });

  // Integrations List
  const integrationsQuery = useIntegrations(
    {
      page,
      limit: 12,
      search: search.trim() || undefined,
      type: selectedType
        ? (selectedType as IntegrationType)
        : undefined,
      status: selectedStatus ? (selectedStatus as IntegrationStatus) : undefined,
    },
    { refetchInterval: autoRefreshInterval },
  );

  const items = integrationsQuery.data?.items ?? [];
  const pagination = integrationsQuery.data?.pagination;

  function handleOpenDetails(id: string) {
    setSelectedIntegrationId(id);
    setDrawerOpen(true);
  }

  function handleRefreshAll() {
    integrationsQuery.refetch();
    summaryQuery.refetch();
  }

  return (
    <div className="space-y-6">
      <ProductPageHeader
        description="Connect, monitor live connection health, test latency, and manage automated log ingestion from external SIEM and Next-Gen Firewall platforms."
        onPrimaryAction={() => setConnectModalOpen(true)}
        primaryAction="Connect SIEM / Firewall"
        showSampleNotice={false}
        title="Third-Party SIEM & Firewall Integrations"
      />

      {/* Connection Monitoring Live Header & Metrics */}
      <ConnectionMonitoringHeader
        autoRefreshInterval={autoRefreshInterval}
        isLoading={summaryQuery.isLoading || summaryQuery.isFetching}
        onAutoRefreshChange={setAutoRefreshInterval}
        onRefresh={handleRefreshAll}
        summary={summaryQuery.data}
      />

      {/* Filter and Search Bar */}
      <div className="border-border bg-surface flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="text-muted absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            aria-label="Search integrations"
            className="pl-9 text-xs"
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by name or URL endpoint..."
            value={search}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Select
            aria-label="Filter by type"
            className="w-40 text-xs"
            onChange={(e) => {
              setSelectedType(e.target.value);
              setPage(1);
            }}
            value={selectedType}
          >
            <option value="">All System Types</option>
            <option value="siem">SIEM Systems</option>
            <option value="firewall">Firewalls</option>
            <option value="log_source">Log Sources</option>
            <option value="api">Custom APIs</option>
          </Select>

          <Select
            aria-label="Filter by status"
            className="w-36 text-xs"
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(1);
            }}
            value={selectedStatus}
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="error">Connection Error</option>
            <option value="pending">Pending</option>
          </Select>


          {/* View Mode Toggle */}
          <div className="border-border bg-neutral-soft/50 flex items-center rounded-lg border p-0.5">
            <button
              aria-label="Xem dạng bảng"
              className={`flex size-7.5 items-center justify-center rounded-md text-xs transition-colors ${
                viewMode === "table"
                  ? "bg-surface text-foreground shadow-xs"
                  : "text-muted hover:text-foreground"
              }`}
              onClick={() => setViewMode("table")}
              type="button"
            >
              <TableIcon className="size-3.5" />
            </button>
            <button
              aria-label="Xem dạng thẻ"
              className={`flex size-7.5 items-center justify-center rounded-md text-xs transition-colors ${
                viewMode === "grid"
                  ? "bg-surface text-foreground shadow-xs"
                  : "text-muted hover:text-foreground"
              }`}
              onClick={() => setViewMode("grid")}
              type="button"
            >
              <LayoutGrid className="size-3.5" />
            </button>
          </div>

          <Button
            aria-label="Tải lại danh sách"
            className="min-h-8 px-2.5 bg-surface text-muted ring-border hover:text-foreground hover:bg-neutral-soft ring-1"
            onClick={handleRefreshAll}
            type="button"
          >
            <RefreshCw
              className={`size-3.5 ${integrationsQuery.isFetching ? "animate-spin text-brand" : ""}`}
            />
          </Button>
        </div>
      </div>

      {/* Content Area */}
      {integrationsQuery.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, idx) => (
            <Skeleton className="h-16 w-full rounded-xl" key={idx} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          description="Không tìm thấy hệ thống tích hợp nào phù hợp với điều kiện tìm kiếm hoặc chưa có hệ thống nào được thiết lập."
          title="Không tìm thấy kết nối nào"
        />
      ) : (
        <div className="space-y-6">
          {viewMode === "table" ? (
            <ConnectionStatusTable
              integrations={items}
              onOpenDetails={handleOpenDetails}
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((integration) => (
                <IntegrationCard
                  integration={integration}
                  key={integration.id}
                  onOpenDetails={handleOpenDetails}
                />
              ))}
            </div>
          )}

          {pagination && pagination.totalPages > 1 ? (
            <div className="flex justify-center pt-2">
              <Pagination
                onPageChange={(p) => setPage(p)}
                page={pagination.page}
                pageCount={pagination.totalPages}
              />
            </div>
          ) : null}
        </div>
      )}

      {/* Modals & Drawers */}
      <ConnectIntegrationModal
        onOpenChange={setConnectModalOpen}
        open={connectModalOpen}
      />

      <IntegrationDetailDrawer
        integrationId={selectedIntegrationId}
        onOpenChange={setDrawerOpen}
        open={drawerOpen}
      />
    </div>
  );
}
