"use client";

import { Eye, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { TableSkeleton } from "@/components/ui/skeleton";
import {
  useCompletionCampaign,
  useCompletionCampaigns,
} from "../hooks/use-completion";
import type {
  CompletionCampaign,
  CompletionStatus,
} from "../schemas/completion-schema";

const date = (value: string) =>
  new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(
    new Date(value),
  );

export function TrainingCompletionManager({
  onViewCourses,
}: {
  onViewCourses?: () => void;
}) {
  const [page, setPage] = useState(1);
  const [draftQuery, setDraftQuery] = useState("");
  const [query, setQuery] = useState("");
  const [campaignId, setCampaignId] = useState<string>();
  const campaigns = useCompletionCampaigns(page, query, true);
  const pageItems = campaigns.data?.items ?? [];
  const columns: readonly DataTableColumn<CompletionCampaign>[] = [
    {
      key: "campaign",
      header: "Campaign",
      cell: (item) => (
        <span>
          <strong className="block">{item.title}</strong>
          <span className="text-muted text-xs">{item.courseTitle}</span>
        </span>
      ),
    },
    {
      key: "period",
      header: "Period",
      cell: (item) => `${date(item.startDate)} – ${date(item.dueDate)}`,
    },
    {
      key: "status",
      header: "Status",
      cell: (item) => (
        <StatusBadge tone={item.status === "active" ? "success" : "neutral"}>
          {item.status}
        </StatusBadge>
      ),
    },
    { key: "assigned", header: "Assigned", cell: (item) => item.assigned },
    {
      key: "completion",
      header: "Completion",
      cell: (item) => (
        <div className="min-w-32">
          <div className="mb-1 flex justify-between text-xs">
            <span>
              {item.completed}/{item.assigned}
            </span>
            <strong>{item.completionRate}%</strong>
          </div>
          <div className="bg-neutral-soft h-2 overflow-hidden rounded-full">
            <div
              className="bg-brand h-full"
              style={{ width: `${item.completionRate}%` }}
            />
          </div>
        </div>
      ),
    },
    { key: "overdue", header: "Overdue", cell: (item) => item.overdue },
    {
      key: "actions",
      header: "Actions",
      cell: (item) => (
        <Button
          className="min-h-10 px-3"
          variant="secondary"
          onClick={() => setCampaignId(item.id)}
        >
          <Eye className="size-4" aria-hidden="true" />
          View details
        </Button>
      ),
    },
  ];
  const totalAssigned = pageItems.reduce((sum, item) => sum + item.assigned, 0);
  const totalCompleted = pageItems.reduce(
    (sum, item) => sum + item.completed,
    0,
  );

  return (
    <>
      <ProductPageHeader
        title="Training completion"
        description="Monitor security awareness campaign completion and follow up with employees who are incomplete or overdue."
        showSampleNotice={false}
        {...(onViewCourses
          ? {
              secondaryAction: "Manage courses",
              onSecondaryAction: onViewCourses,
            }
          : {})}
      />
      <MetricStrip
        ariaLabel="Training completion summary"
        metrics={[
          {
            label: "Campaigns",
            value: String(campaigns.data?.pagination.total ?? 0),
            detail: "Returned by the backend",
          },
          {
            label: "Assigned employees",
            value: String(totalAssigned),
            detail: "On this page",
          },
          {
            label: "Completed",
            value: String(totalCompleted),
            detail: "On this page",
            tone: "brand",
          },
          {
            label: "Completion rate",
            value: `${totalAssigned ? Math.round((totalCompleted / totalAssigned) * 100) : 0}%`,
            detail: "On this page",
          },
        ]}
      />
      <ProductPanel
        title="Training campaigns"
        description={
          campaigns.data
            ? `${campaigns.data.pagination.total} campaigns found`
            : "Campaign completion returned by the backend"
        }
      >
        <form
          className="border-border flex flex-wrap gap-2 border-b p-4"
          onSubmit={(event) => {
            event.preventDefault();
            setQuery(draftQuery.trim());
            setPage(1);
          }}
        >
          <label className="relative block w-full max-w-md">
            <span className="sr-only">Search campaigns</span>
            <Search
              className="text-muted absolute top-1/2 left-3 size-4 -translate-y-1/2"
              aria-hidden="true"
            />
            <Input
              className="pl-9"
              maxLength={100}
              placeholder="Search campaigns or courses"
              value={draftQuery}
              onChange={(event) => setDraftQuery(event.target.value)}
            />
          </label>
          <Button type="submit">Search</Button>
        </form>
        <div className="p-4">
          {campaigns.isPending ? (
            <TableSkeleton
              headers={[
                "Campaign",
                "Period",
                "Status",
                "Assigned",
                "Completion",
                "Overdue",
                "Actions",
              ]}
              rows={5}
              label="Loading training completion"
            />
          ) : campaigns.isError ? (
            <Alert>Unable to load training completion data.</Alert>
          ) : pageItems.length === 0 ? (
            <p className="text-muted py-10 text-center text-sm">
              No training campaigns match your search.
            </p>
          ) : (
            <DataTable
              columns={columns}
              rows={pageItems}
              getRowKey={(item) => item.id}
            />
          )}
        </div>
        {campaigns.data ? (
          <div className="border-border border-t p-4">
            <Pagination
              page={campaigns.data.pagination.page}
              pageCount={campaigns.data.pagination.totalPages}
              onPageChange={setPage}
            />
          </div>
        ) : null}
      </ProductPanel>
      <CompletionDetailDialog
        campaignId={campaignId}
        onClose={() => setCampaignId(undefined)}
      />
    </>
  );
}

function CompletionDetailDialog({
  campaignId,
  onClose,
}: {
  campaignId: string | undefined;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [draftQuery, setDraftQuery] = useState("");
  const [status, setStatus] = useState<CompletionStatus>("all");
  const detail = useCompletionCampaign(campaignId, page, query, status);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (campaignId && dialog && !dialog.open) dialog.showModal();
  }, [campaignId]);
  const close = () => {
    dialogRef.current?.close();
    setPage(1);
    setQuery("");
    setDraftQuery("");
    setStatus("all");
    onClose();
  };
  const rows = detail.data?.items ?? [];

  return (
    <Dialog
      className="max-h-[calc(100dvh-2rem)] w-[min(64rem,calc(100%-2rem))] overflow-y-auto"
      dialogRef={dialogRef}
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onClose={() => {
        if (campaignId) onClose();
      }}
      title={detail.data?.campaign.title ?? "Campaign completion details"}
    >
      <form
        className="mb-4 flex flex-col gap-2 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          setQuery(draftQuery.trim());
          setPage(1);
        }}
      >
        <Input
          aria-label="Search employees"
          placeholder="Search employee name, email, or code"
          value={draftQuery}
          onChange={(event) => setDraftQuery(event.target.value)}
        />
        <Select
          aria-label="Filter completion status"
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as CompletionStatus);
            setPage(1);
          }}
        >
          <option value="all">All statuses</option>
          <option value="assigned">Not started</option>
          <option value="in_progress">In progress</option>
          <option value="completed">Completed</option>
          <option value="overdue">Overdue</option>
        </Select>
        <Button type="submit">Search</Button>
      </form>
      {detail.isPending ? (
        <TableSkeleton
          headers={["Employee", "Status", "Progress", "Last activity"]}
          rows={5}
          label="Loading employee completion"
        />
      ) : detail.isError ? (
        <Alert>Unable to load campaign details.</Alert>
      ) : rows.length === 0 ? (
        <p className="text-muted py-10 text-center text-sm">
          No employees match these filters.
        </p>
      ) : (
        <DataTable
          rows={rows}
          getRowKey={(item) => item.id}
          columns={[
            {
              key: "employee",
              header: "Employee",
              cell: (item) => (
                <span>
                  <strong className="block">{item.user.name}</strong>
                  <span className="text-muted text-xs">
                    {item.user.email}
                    {item.user.employeeCode
                      ? ` · ${item.user.employeeCode}`
                      : ""}
                  </span>
                </span>
              ),
            },
            {
              key: "status",
              header: "Status",
              cell: (item) => (
                <StatusBadge
                  tone={
                    item.status === "completed"
                      ? "success"
                      : item.status === "overdue"
                        ? "danger"
                        : "neutral"
                  }
                >
                  {item.status.replace("_", " ")}
                </StatusBadge>
              ),
            },
            {
              key: "progress",
              header: "Progress",
              cell: (item) => `${item.progressPercent}%`,
            },
            {
              key: "activity",
              header: "Last activity",
              cell: (item) =>
                item.lastAccessedAt ? date(item.lastAccessedAt) : "Never",
            },
          ]}
        />
      )}
      {detail.data ? (
        <div className="border-border mt-4 border-t pt-4">
          <Pagination
            page={detail.data.pagination.page}
            pageCount={detail.data.pagination.totalPages}
            onPageChange={setPage}
          />
        </div>
      ) : null}
      <div className="mt-5 flex justify-end">
        <Button variant="secondary" onClick={close}>
          Close
        </Button>
      </div>
    </Dialog>
  );
}
