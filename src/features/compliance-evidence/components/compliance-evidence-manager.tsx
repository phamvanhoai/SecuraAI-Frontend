"use client";

import { Paperclip, Search } from "lucide-react";
import { useState, type FormEvent } from "react";
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
import { EmptyState } from "@/components/feedback/empty-state";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSessionUser } from "@/features/authentication-account";
import {
  ControlEvidenceDialog,
  useControlAssessments,
  type ControlAssessmentItem,
} from "@/features/control-assessments";

const allowedRoles = new Set(["SECURITY_OFFICER", "EMPLOYEE"]);

export function ComplianceEvidenceManager() {
  const session = useSessionUser();
  const allowed =
    session.data?.roles.some((role) => allowedRoles.has(role.code)) ?? false;
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [queryText, setQueryText] = useState<string>();
  const [selectedControlId, setSelectedControlId] = useState<string>();
  const controls = useControlAssessments(
    { page, limit: 20, ...(queryText ? { q: queryText } : {}) },
    allowed,
  );

  const columns: readonly DataTableColumn<ControlAssessmentItem>[] = [
    {
      key: "control",
      header: "Security control",
      cell: (item) => (
        <span className="block min-w-56">
          <strong className="block">{item.name}</strong>
          <span className="text-muted text-xs">{item.controlCode}</span>
        </span>
      ),
    },
    {
      key: "owner",
      header: "Control owner",
      cell: (item) => item.owner?.fullName ?? "Unassigned",
    },
    {
      key: "evidence",
      header: "Evidence",
      cell: (item) => (
        <span className="inline-flex items-center gap-2">
          <StatusBadge tone={item.evidence.length > 0 ? "success" : "neutral"}>
            {item.evidence.length} linked
          </StatusBadge>
        </span>
      ),
    },
    {
      key: "action",
      header: "Action",
      cell: (item) =>
        item.canManageEvidence ? (
          <Button
            className="min-h-10"
            onClick={() => setSelectedControlId(item.id)}
            variant="secondary"
          >
            <Paperclip aria-hidden="true" className="size-4" />
            Manage evidence
          </Button>
        ) : (
          <span className="text-muted text-sm">View only</span>
        ),
    },
  ];

  if (session.isPending) {
    return (
      <div
        aria-label="Checking compliance evidence access"
        className="bg-neutral-soft h-56 animate-pulse rounded-xl"
      />
    );
  }

  if (!allowed) {
    return (
      <Alert>
        <strong className="block">Compliance evidence access unavailable</strong>
        <span>
          Evidence is managed by Security Officers and assigned Employee Control
          Owners.
        </span>
      </Alert>
    );
  }

  function submitSearch(event: FormEvent) {
    event.preventDefault();
    setPage(1);
    setQueryText(search.trim() || undefined);
  }

  return (
    <>
      <ProductPageHeader
        description="Manage supporting evidence for controls available within your assigned scope."
        showSampleNotice={false}
        title="Compliance evidence"
      />
      <ProductPanel
        description={
          controls.data
            ? `${controls.data.pagination.total} accessible controls`
            : "Controls available within your role and ownership scope"
        }
        title="Control evidence"
      >
        <div className="space-y-4 p-5">
          <form className="flex flex-col gap-2 sm:flex-row" onSubmit={submitSearch}>
            <div className="relative flex-1">
              <Search
                aria-hidden="true"
                className="text-muted absolute top-1/2 left-3 size-4 -translate-y-1/2"
              />
              <Input
                aria-label="Search controls"
                className="pl-9"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by control code or name"
                value={search}
              />
            </div>
            <Button type="submit">
              <Search aria-hidden="true" className="size-4" />
              Search
            </Button>
          </form>

          {controls.isError ? (
            <Alert>
              Unable to load accessible controls. Check your session and backend
              connection.
            </Alert>
          ) : controls.isPending ? (
            <div className="bg-neutral-soft h-64 animate-pulse rounded-xl" />
          ) : controls.data.items.length > 0 ? (
            <DataTable
              columns={columns}
              getRowKey={(item) => item.id}
              rows={controls.data.items}
            />
          ) : (
            <EmptyState
              description="Security Officers can manage all accessible controls. Employee Control Owners see controls assigned to them."
              title="No accessible controls"
            />
          )}

          {controls.data ? (
            <Pagination
              onPageChange={setPage}
              page={page}
              pageCount={controls.data.pagination.totalPages}
            />
          ) : null}
        </div>
      </ProductPanel>

      {selectedControlId ? (
        <ControlEvidenceDialog
          controlId={selectedControlId}
          onClose={() => setSelectedControlId(undefined)}
        />
      ) : null}
    </>
  );
}
