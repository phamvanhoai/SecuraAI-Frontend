"use client";

import {
  RefreshCw,
  Search,
} from "lucide-react";
import { useState } from "react";
import { Pagination } from "@/components/data-display/pagination";
import {
  MetricStrip,
  ProductPageHeader,
  type Metric,
} from "@/components/data-display/static-product";
import { EmptyState } from "@/components/feedback/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useIntegrations } from "../hooks/use-integrations";
import type {
  IntegrationStatus,
  IntegrationType,
} from "../schemas/integration-schema";
import { ConnectIntegrationModal } from "./connect-integration-modal";
import { IntegrationCard } from "./integration-card";
import { IntegrationDetailDrawer } from "./integration-detail-drawer";

export function IntegrationManagementView() {
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [page, setPage] = useState(1);

  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [selectedIntegrationId, setSelectedIntegrationId] = useState<
    string | null
  >(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const integrationsQuery = useIntegrations({
    page,
    limit: 12,
    search: search.trim() || undefined,
    type: selectedType
      ? (selectedType as IntegrationType)
      : undefined,
    status: selectedStatus ? (selectedStatus as IntegrationStatus) : undefined,
  });

  const items = integrationsQuery.data?.items ?? [];
  const pagination = integrationsQuery.data?.pagination;

  const totalCount = pagination?.total ?? items.length;
  const activeCount = items.filter((i) => i.status === "active").length;
  const firewallCount = items.filter(
    (i) => i.integrationType === "firewall",
  ).length;
  const siemCount = items.filter(
    (i) => i.integrationType === "siem" || i.integrationType === "log_source",
  ).length;

  const metrics: readonly Metric[] = [
    {
      label: "Total Connections",
      value: String(totalCount),
      detail: "Security endpoints configured",
    },
    {
      label: "Active Connections",
      value: String(activeCount),
      detail: "Live and responsive",
    },
    {
      label: "Firewalls",
      value: String(firewallCount),
      detail: "Fortinet, Palo Alto, pfSense...",
    },
    {
      label: "SIEM & SOC Collectors",
      value: String(siemCount),
      detail: "Splunk, Wazuh, Elastic...",
    },
  ];

  function handleOpenDetails(id: string) {
    setSelectedIntegrationId(id);
    setDrawerOpen(true);
  }

  return (
    <div className="space-y-6">
      <ProductPageHeader
        description="Connect, test, and manage automated log ingestion from external SIEM and Next-Gen Firewall platforms."
        onPrimaryAction={() => setConnectModalOpen(true)}
        primaryAction="Connect SIEM / Firewall"
        showSampleNotice={false}
        title="Third-Party SIEM & Firewall Integrations"
      />

      <MetricStrip metrics={metrics} />

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

          <Button
            aria-label="Refresh list"
            className="min-h-9 px-2.5 bg-surface text-muted ring-border hover:text-foreground hover:bg-neutral-soft ring-1"
            onClick={() => integrationsQuery.refetch()}
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, idx) => (
            <Skeleton className="h-48 w-full rounded-xl" key={idx} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          description="No security integrations match your search criteria or none have been registered yet."
          title="No Integrations Found"
        />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((integration) => (
              <IntegrationCard
                integration={integration}
                key={integration.id}
                onOpenDetails={handleOpenDetails}
              />
            ))}
          </div>

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
