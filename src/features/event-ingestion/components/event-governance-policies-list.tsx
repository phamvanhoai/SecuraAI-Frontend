"use client";

import {
  Archive,
  Calendar,
  CheckCircle2,
  Eye,
  RotateCcw,
  Search,
  Shield,
  XCircle,
} from "lucide-react";
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
import { useEventGovernancePolicies } from "../hooks/use-event-governance";
import type {
  EventGovernancePolicy,
  GovernanceEventFamily,
  GovernancePolicyStatus,
} from "../schemas/event-governance-schema";
import { EventGovernancePolicyDetailDialog } from "./event-governance-policy-detail-dialog";

const familyLabels: Record<string, string> = {
  AUTHENTICATION: "Authentication",
  VPN_SSO: "VPN / SSO",
  APPLICATION_ACCESS: "App Access",
};

const familyBadgeStyles: Record<string, string> = {
  AUTHENTICATION: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20",
  VPN_SSO: "bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/20",
  APPLICATION_ACCESS: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
};

export function EventGovernancePoliciesList() {
  const [page, setPage] = useState(1);
  const [draftSearch, setDraftSearch] = useState("");
  const [search, setSearch] = useState("");
  const [familyFilter, setFamilyFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedPolicyId, setSelectedPolicyId] = useState<string | null>(null);

  const policiesQuery = useEventGovernancePolicies({
    page,
    limit: 20,
    ...(search ? { search } : {}),
    ...(familyFilter !== "ALL"
      ? { eventFamily: familyFilter as GovernanceEventFamily }
      : {}),
    ...(statusFilter !== "ALL"
      ? { status: statusFilter as GovernancePolicyStatus }
      : {}),
  });

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSearch(draftSearch.trim());
    setPage(1);
  };

  const handleResetFilters = () => {
    setDraftSearch("");
    setSearch("");
    setFamilyFilter("ALL");
    setStatusFilter("ALL");
    setPage(1);
  };

  const columns: readonly DataTableColumn<EventGovernancePolicy>[] = [
    {
      key: "name",
      header: "Policy name & Purpose",
      cell: (item: EventGovernancePolicy) => (
        <div className="py-0.5">
          <strong className="text-foreground block font-medium">
            {item.name}
          </strong>
          <span className="text-muted mt-0.5 line-clamp-1 text-xs">
            {item.purpose}
          </span>
        </div>
      ),
    },
    {
      key: "eventFamily",
      header: "Event family",
      cell: (item: EventGovernancePolicy) => (
        <span
          className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold ${
            item.eventFamily
              ? familyBadgeStyles[item.eventFamily] ??
                "border-border bg-neutral-soft/60 text-foreground"
              : "border-border bg-neutral-soft/60 text-foreground"
          }`}
        >
          {item.eventFamily
            ? familyLabels[item.eventFamily] ?? item.eventFamily
            : "Global (All families)"}
        </span>
      ),
    },
    {
      key: "retentionDays",
      header: "Retention period",
      cell: (item: EventGovernancePolicy) => (
        <div className="flex items-center gap-1.5 text-xs font-medium">
          <Calendar className="text-muted h-3.5 w-3.5" />
          <span className="text-foreground">{item.retentionDays} days</span>
          <span className="text-muted text-[11px]">
            (~{(item.retentionDays / 30).toFixed(0)} mo)
          </span>
        </div>
      ),
    },
    {
      key: "archiveAfterDays",
      header: "Archival rule",
      cell: (item: EventGovernancePolicy) => (
        <div className="flex items-center gap-1.5 text-xs">
          {item.archiveAfterDays ? (
            <span className="text-amber-600 dark:text-amber-400 font-medium">
              After {item.archiveAfterDays} days
            </span>
          ) : (
            <span className="text-muted">Not applicable</span>
          )}
        </div>
      ),
    },
    {
      key: "deletionEnabled",
      header: "Automated purge",
      cell: (item: EventGovernancePolicy) => (
        <div className="flex items-center gap-1.5 text-xs">
          {item.deletionEnabled ? (
            <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 font-medium">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Enabled
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-muted">
              <XCircle className="h-3.5 w-3.5" />
              Disabled
            </span>
          )}
        </div>
      ),
    },
    {
      key: "exportAllowed",
      header: "Export",
      cell: (item: EventGovernancePolicy) => (
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
            item.exportAllowed
              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
              : "bg-neutral-soft text-muted"
          }`}
        >
          {item.exportAllowed ? "Allowed" : "Restricted"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (item: EventGovernancePolicy) => (
        <StatusBadge tone={item.status === "ACTIVE" ? "success" : "neutral"}>
          {item.status === "ACTIVE" ? "ACTIVE" : "INACTIVE"}
        </StatusBadge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      cell: (item: EventGovernancePolicy) => (
        <div className="flex items-center justify-end">
          <Button
            type="button"
            variant="secondary"
            className="min-h-7 py-0.5 px-2 text-xs flex items-center gap-1"
            onClick={() => setSelectedPolicyId(item.id)}
            aria-label={`View policy details for ${item.name}`}
          >
            <Eye className="size-3.5" />
            <span>View</span>
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Main Panel */}
      <ProductPanel
        title="Event data governance policies"
        description={
          policiesQuery.data
            ? `${policiesQuery.data.pagination.totalItems} governance & retention policies found`
            : "Define retention periods, archival rules, automated disposal, and export permissions across event streams."
        }
      >
        <div className="p-4 space-y-4">
          {/* Filter Bar */}
          <div className="border-border bg-neutral-soft/20 flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
            <form
              onSubmit={handleSearchSubmit}
              className="flex flex-1 items-center gap-2"
            >
              <div className="relative flex-1">
                <Search className="text-muted absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                <Input
                  value={draftSearch}
                  onChange={(e) => setDraftSearch(e.target.value)}
                  placeholder="Search by policy name, purpose, or scope..."
                  className="pl-9 text-xs"
                />
              </div>
              <Button type="submit" variant="primary" className="text-xs">
                Search
              </Button>
            </form>

            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={familyFilter}
                onChange={(e) => {
                  setFamilyFilter(e.target.value);
                  setPage(1);
                }}
                className="w-44 text-xs"
              >
                <option value="ALL">All event families</option>
                <option value="AUTHENTICATION">Authentication</option>
                <option value="VPN_SSO">VPN & SSO</option>
                <option value="APPLICATION_ACCESS">Application Access</option>
              </Select>

              <Select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="w-36 text-xs"
              >
                <option value="ALL">All statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </Select>

              {(search || familyFilter !== "ALL" || statusFilter !== "ALL") && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleResetFilters}
                  className="text-muted hover:text-foreground text-xs flex items-center gap-1"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Reset</span>
                </Button>
              )}
            </div>
          </div>

          {/* Data Content */}
          {policiesQuery.isPending ? (
            <TableSkeleton rows={5} />
          ) : policiesQuery.isError ? (
            <Alert>
              Failed to load event data governance policies.{" "}
              {policiesQuery.error?.message}
            </Alert>
          ) : (
            <div className="space-y-4">
              <DataTable
                columns={columns}
                rows={policiesQuery.data?.items ?? []}
                getRowKey={(item) => item.id}
              />

              {policiesQuery.data?.pagination ? (
                <Pagination
                  page={policiesQuery.data.pagination.page}
                  pageCount={policiesQuery.data.pagination.totalPages}
                  onPageChange={setPage}
                />
              ) : null}
            </div>
          )}
        </div>
      </ProductPanel>

      {/* Policy Detail Dialog */}
      <EventGovernancePolicyDetailDialog
        policyId={selectedPolicyId}
        isOpen={Boolean(selectedPolicyId)}
        onClose={() => setSelectedPolicyId(null)}
      />
    </div>
  );
}
