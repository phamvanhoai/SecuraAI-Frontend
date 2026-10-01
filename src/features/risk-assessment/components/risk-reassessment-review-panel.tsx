"use client";

import { CheckCircle2, Gauge, Search, X, XCircle } from "lucide-react";
import { useState } from "react";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/data-display/data-table";
import { Pagination } from "@/components/data-display/pagination";
import {
  ProductPanel,
  StatusBadge,
} from "@/components/data-display/static-product";
import { EmptyState } from "@/components/feedback/empty-state";
import { useToast } from "@/components/feedback/toast";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
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
  const requests = useOwnedRiskReassessmentRequests(
    { page, limit: 10, status, ...(search ? { q: search } : {}) },
    enabled,
  );
  const review = useStartRiskReassessmentReview();
  const toast = useToast();
  const [completionTarget, setCompletionTarget] =
    useState<RiskReassessmentReviewItem | null>(null);
  const [rejectionTarget, setRejectionTarget] =
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
        <span className="block min-w-52">
          <strong className="block">{item.risk.title}</strong>
          <span className="text-muted text-xs">{item.risk.riskCode}</span>
        </span>
      ),
    },
    {
      key: "incident",
      header: "Incident",
      cell: (item) => (
        <span className="block min-w-52">
          <strong className="block font-medium">{item.incident.title}</strong>
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
        <span className="block max-w-80 break-words">{item.reason}</span>
      ),
    },
    {
      key: "requested",
      header: "Requested",
      cell: (item) => (
        <span className="block tabular-nums">
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
          <span className="block min-w-52 tabular-nums">
            {item.reviewedAt ? formatDate(item.reviewedAt) : "Not recorded"}
            <span className="text-muted block text-xs">
              {item.reviewedBy
                ? `by ${item.reviewedBy.fullName}`
                : "Reviewer not recorded"}
            </span>
            {item.reviewComment ? (
              <span className="mt-1 block max-w-80 text-sm break-words">
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
        <div className="flex min-w-max flex-wrap gap-2">
          {item.status === "pending" ? (
            <Button
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
              variant="secondary"
              onClick={() => setCompletionTarget(item)}
            >
              <Gauge aria-hidden="true" className="size-4" strokeWidth={1.8} />
              Reassess
            </Button>
          ) : (
            <span className="text-muted text-sm">No actions</span>
          )}
          {item.canReject &&
          (item.status === "pending" || item.status === "under_review") ? (
            <Button variant="danger" onClick={() => setRejectionTarget(item)}>
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
      ),
    },
  ];
  return (
    <>
      <ProductPanel title="My reassessment requests">
        <div className="p-4">
          <form
            className="mb-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_14rem_auto] md:items-end"
            onSubmit={(event) => {
              event.preventDefault();
              setPage(1);
              setSearch(searchDraft.trim() || undefined);
            }}
          >
            <label className="block min-w-0">
              <span className="mb-1.5 block text-sm font-medium">
                Search requests
              </span>
              <span className="relative block">
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
              </span>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Status</span>
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
            </label>
            <div className="flex gap-2">
              <Button type="submit">
                <Search
                  aria-hidden="true"
                  className="size-4"
                  strokeWidth={1.8}
                />
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
          {review.isError ? (
            <Alert className="border-danger/25 bg-danger-soft text-danger mb-4">
              {review.error instanceof Error
                ? review.error.message
                : "Unable to start this review."}
            </Alert>
          ) : null}
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
            <EmptyState
              title="No reassessment requests"
              description="No reassessment requests match the selected status."
            />
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
    </>
  );
}
