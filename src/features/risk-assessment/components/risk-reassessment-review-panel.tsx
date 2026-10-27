"use client";

import {
  CheckCircle2,
  ClipboardList,
  Ellipsis,
  Eye,
  Gauge,
  Search,
  X,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/data-display/data-table";
import { Pagination } from "@/components/data-display/pagination";
import {
  MetricStrip,
  ProductPanel,
  StatusBadge,
} from "@/components/data-display/static-product";
import { useToast } from "@/components/feedback/toast";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { TableSkeleton } from "@/components/ui/skeleton";
import type { ReassessmentRequestStatusFilter } from "../api/risk-reassessment-review";
import {
  useOwnedRiskReassessmentRequests,
  useStartRiskReassessmentReview,
} from "../hooks/use-risk-reassessment-review";
import type { RiskReassessmentReviewItem } from "../schemas/risk-reassessment-review-schema";
import { CompleteRiskReassessmentDialog } from "./complete-risk-reassessment-dialog";
import { RejectRiskReassessmentDialog } from "./reject-risk-reassessment-dialog";
import { RiskReassessmentRequestDetailDialog } from "./risk-reassessment-request-detail-dialog";

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

export function RiskReassessmentReviewPanel({ enabled }: { enabled: boolean }) {
  const [status, setStatus] = useState<ReassessmentRequestStatusFilter>("all");
  const [page, setPage] = useState(1);
  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState<string | undefined>();
  const hasActiveFilters = status !== "all" || Boolean(search);

  const requests = useOwnedRiskReassessmentRequests(
    { page, limit: 10, status, ...(search ? { q: search } : {}) },
    enabled,
  );

  // Lightweight summary queries for MetricStrip — limit:1 fetches only pagination.total
  const pendingCount = useOwnedRiskReassessmentRequests(
    { page: 1, limit: 1, status: "pending" },
    enabled,
  );
  const underReviewCount = useOwnedRiskReassessmentRequests(
    { page: 1, limit: 1, status: "under_review" },
    enabled,
  );
  const completedCount = useOwnedRiskReassessmentRequests(
    { page: 1, limit: 1, status: "completed" },
    enabled,
  );
  const rejectedCount = useOwnedRiskReassessmentRequests(
    { page: 1, limit: 1, status: "rejected" },
    enabled,
  );

  const review = useStartRiskReassessmentReview();
  const toast = useToast();
  const [completionTarget, setCompletionTarget] =
    useState<RiskReassessmentReviewItem | null>(null);
  const [rejectionTarget, setRejectionTarget] =
    useState<RiskReassessmentReviewItem | null>(null);
  const [detailTarget, setDetailTarget] =
    useState<RiskReassessmentReviewItem | null>(null);

  const startReview = async (item: RiskReassessmentReviewItem) => {
    try {
      await review.mutateAsync(item.id);
      toast.success(
        "Review started",
        `${item.risk.riskCode} is now under review. Its current rating remains unchanged.`,
      );
    } catch {
      /* Normalized mutation error is rendered below. */
    }
  };

  const columns: readonly DataTableColumn<RiskReassessmentReviewItem>[] = [
    {
      key: "risk",
      header: "Risk",
      cell: (item) => (
        <span className="block w-52">
          <strong className="line-clamp-2 leading-5" title={item.risk.title}>
            {item.risk.title}
          </strong>
          <span className="text-muted text-xs">{item.risk.riskCode}</span>
        </span>
      ),
    },
    {
      key: "incident",
      header: "Incident",
      cell: (item) => (
        <span className="block w-52">
          <strong
            className="line-clamp-2 leading-5 font-medium"
            title={item.incident.title}
          >
            {item.incident.title}
          </strong>
          <span className="text-muted text-xs">
            {item.incident.incidentCode}
          </span>
        </span>
      ),
    },
    {
      key: "reason",
      header: "Reason",
      cell: (item) => (
        <span
          className="line-clamp-2 w-64 leading-5 break-words"
          title={item.reason}
        >
          {item.reason}
        </span>
      ),
    },
    {
      key: "requested",
      header: "Requested",
      cell: (item) => (
        <span className="block whitespace-nowrap tabular-nums">
          {formatDate(item.requestedAt)}
          <span className="text-muted block text-xs">
            by {item.requestedBy.fullName}
          </span>
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (item) => {
        const presentation = {
          pending: { label: "Pending", tone: "warning" },
          under_review: { label: "Under review", tone: "info" },
          completed: { label: "Completed", tone: "success" },
          rejected: { label: "Rejected", tone: "danger" },
        } as const;
        const current = presentation[item.status];
        return <StatusBadge tone={current.tone}>{current.label}</StatusBadge>;
      },
    },
    {
      key: "decision",
      header: "Decision",
      cell: (item) =>
        item.status === "completed" || item.status === "rejected" ? (
          <span className="block w-56 tabular-nums">
            {item.reviewedAt ? formatDate(item.reviewedAt) : "Not recorded"}
            <span className="text-muted block text-xs">
              {item.reviewedBy
                ? `by ${item.reviewedBy.fullName}`
                : "Reviewer not recorded"}
            </span>
            {item.reviewComment ? (
              <span
                className="mt-1 line-clamp-2 text-sm leading-5 break-words"
                title={item.reviewComment}
              >
                {item.reviewComment}
              </span>
            ) : null}
          </span>
        ) : (
          <span className="text-muted">Awaiting decision</span>
        ),
    },
    {
      key: "action",
      header: "Action",
      cell: (item) => (
        <DropdownMenu
          className="w-fit"
          label={
            <span className="grid size-6 place-items-center">
              <span className="sr-only">Actions for {item.risk.riskCode}</span>
              <Ellipsis
                aria-hidden="true"
                className="size-5"
                strokeWidth={1.8}
              />
            </span>
          }
        >
          <div className="grid gap-1">
            <Button
              className="w-full justify-start border-0"
              variant="secondary"
              onClick={() => setDetailTarget(item)}
            >
              <Eye aria-hidden="true" className="size-4" strokeWidth={1.8} />
              View details
            </Button>
            <div className="border-border border-t" aria-hidden="true" />
            {item.status === "pending" ? (
              <Button
                className="w-full justify-start border-0"
                variant="secondary"
                disabled={review.isPending}
                onClick={() => void startReview(item)}
              >
                <CheckCircle2
                  aria-hidden="true"
                  className="size-4"
                  strokeWidth={1.8}
                />
                {review.isPending ? "Starting…" : "Start review"}
              </Button>
            ) : item.status === "under_review" ? (
              <Button
                className="w-full justify-start border-0"
                variant="secondary"
                onClick={() => setCompletionTarget(item)}
              >
                <Gauge
                  aria-hidden="true"
                  className="size-4"
                  strokeWidth={1.8}
                />
                Reassess
              </Button>
            ) : (
              <span className="text-muted text-sm">No actions</span>
            )}
            {item.canReject &&
            (item.status === "pending" || item.status === "under_review") ? (
              <Button
                className="w-full justify-start"
                variant="danger"
                onClick={() => setRejectionTarget(item)}
              >
                <XCircle
                  aria-hidden="true"
                  className="size-4"
                  strokeWidth={1.8}
                />
                {item.status === "under_review"
                  ? "Close without reassessment"
                  : "Reject request"}
              </Button>
            ) : null}
          </div>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <>
      {/* Live metric strip */}
      <MetricStrip
        ariaLabel="Reassessment request summary"
        metrics={[
          {
            label: "Pending",
            value: pendingCount.data
              ? String(pendingCount.data.pagination.total)
              : "—",
            detail: "Awaiting review start",
            tone:
              (pendingCount.data?.pagination.total ?? 0) > 0
                ? "warning"
                : "neutral",
            loading: pendingCount.isPending,
          },
          {
            label: "Under review",
            value: underReviewCount.data
              ? String(underReviewCount.data.pagination.total)
              : "—",
            detail: "Review in progress",
            tone:
              (underReviewCount.data?.pagination.total ?? 0) > 0
                ? "brand"
                : "neutral",
            loading: underReviewCount.isPending,
          },
          {
            label: "Completed",
            value: completedCount.data
              ? String(completedCount.data.pagination.total)
              : "—",
            detail: "Reassessment finalised",
            tone: "neutral",
            loading: completedCount.isPending,
          },
          {
            label: "Rejected",
            value: rejectedCount.data
              ? String(rejectedCount.data.pagination.total)
              : "—",
            detail: "Requests closed without reassessment",
            tone:
              (rejectedCount.data?.pagination.total ?? 0) > 0
                ? "danger"
                : "neutral",
            loading: rejectedCount.isPending,
          },
        ]}
      />

      <ProductPanel title="My reassessment requests">
        {/* Toolbar */}
        <form
          className="border-border flex flex-col gap-3 border-b p-4 md:flex-row md:items-center md:justify-between"
          onSubmit={(event) => {
            event.preventDefault();
            setPage(1);
            setSearch(searchDraft.trim() || undefined);
          }}
        >
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            <label className="relative block w-full sm:max-w-xs">
              <span className="sr-only">Search requests</span>
              <Search
                aria-hidden="true"
                className="text-muted absolute top-1/2 left-3 size-4 -translate-y-1/2"
                strokeWidth={1.8}
              />
              <Input
                className="pl-9"
                maxLength={100}
                placeholder="Search by risk, incident, or reason"
                value={searchDraft}
                onChange={(event) => setSearchDraft(event.target.value)}
              />
            </label>
            <Select
              value={status}
              onChange={(event) => {
                setPage(1);
                setStatus(
                  event.target.value as ReassessmentRequestStatusFilter,
                );
              }}
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="under_review">Under review</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
            </Select>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button type="submit">
              <Search aria-hidden="true" className="size-4" strokeWidth={1.8} />
              Search
            </Button>
            <Button
              type="button"
              variant="secondary"
              aria-label="Clear reassessment request filters"
              onClick={() => {
                setSearchDraft("");
                setSearch(undefined);
                setStatus("all");
                setPage(1);
              }}
            >
              <X aria-hidden="true" className="size-4" strokeWidth={1.8} />
            </Button>
          </div>
        </form>

        {/* Mutation error */}
        {review.isError ? (
          <div className="px-4 pt-4">
            <Alert className="border-danger/25 bg-danger-soft text-danger">
              {review.error instanceof Error
                ? review.error.message
                : "Unable to start this review."}
            </Alert>
          </div>
        ) : null}

        {/* Table body */}
        <div className="p-4">
          {requests.isPending ? (
            <TableSkeleton rows={5} columns={7} />
          ) : requests.isError ? (
            <Alert className="border-danger/25 bg-danger-soft text-danger">
              Unable to load reassessment requests assigned to your risks.
            </Alert>
          ) : requests.data?.items.length ? (
            <>
              <p className="text-muted mb-3 text-sm">
                {requests.data.pagination.total} request
                {requests.data.pagination.total === 1 ? "" : "s"} found
              </p>
              <DataTable
                columns={columns}
                rows={requests.data.items}
                getRowKey={(item) => item.id}
              />
              <div className="mt-4">
                <Pagination
                  page={requests.data.pagination.page}
                  pageCount={requests.data.pagination.totalPages}
                  onPageChange={setPage}
                />
              </div>
            </>
          ) : (
            <div className="py-12 text-center">
              <ClipboardList
                aria-hidden="true"
                className="text-muted mx-auto size-10 stroke-1"
              />
              <h3 className="mt-2 text-base font-semibold">
                {hasActiveFilters
                  ? "No matching reassessment requests"
                  : "No reassessment requests"}
              </h3>
              <p className="text-muted mx-auto mt-1 max-w-sm text-sm">
                {hasActiveFilters
                  ? "No reassessment requests match the current search and status filters."
                  : "No reassessment requests are currently assigned to your risks."}
              </p>
              {hasActiveFilters ? (
                <Button
                  className="mt-4 min-h-9 text-xs"
                  onClick={() => {
                    setSearchDraft("");
                    setSearch(undefined);
                    setStatus("all");
                    setPage(1);
                  }}
                  type="button"
                  variant="secondary"
                >
                  Clear filters
                </Button>
              ) : null}
            </div>
          )}
        </div>
      </ProductPanel>

      <CompleteRiskReassessmentDialog
        request={completionTarget}
        onClose={() => setCompletionTarget(null)}
      />
      <RejectRiskReassessmentDialog
        request={rejectionTarget}
        onClose={() => setRejectionTarget(null)}
      />
      <RiskReassessmentRequestDetailDialog
        request={detailTarget}
        onClose={() => setDetailTarget(null)}
      />
    </>
  );
}
