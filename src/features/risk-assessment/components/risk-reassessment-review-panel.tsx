"use client";

import { CheckCircle2 } from "lucide-react";
import { DataTable, type DataTableColumn } from "@/components/data-display/data-table";
import { ProductPanel, StatusBadge } from "@/components/data-display/static-product";
import { EmptyState } from "@/components/feedback/empty-state";
import { useToast } from "@/components/feedback/toast";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { TableSkeleton } from "@/components/ui/skeleton";
import {
  useOwnedRiskReassessmentRequests,
  useStartRiskReassessmentReview,
} from "../hooks/use-risk-reassessment-review";
import type { RiskReassessmentReviewItem } from "../schemas/risk-reassessment-review-schema";

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(value),
  );

export function RiskReassessmentReviewPanel({ enabled }: { enabled: boolean }) {
  const requests = useOwnedRiskReassessmentRequests(enabled);
  const review = useStartRiskReassessmentReview();
  const toast = useToast();
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
          <span className="text-muted text-xs">{item.incident.incidentCode}</span>
        </span>
      ),
    },
    {
      key: "reason",
      header: "Reason",
      cell: (item) => <span className="block max-w-80 break-words">{item.reason}</span>,
    },
    {
      key: "requested",
      header: "Requested",
      cell: (item) => (
        <span className="block tabular-nums">
          {formatDate(item.requestedAt)}
          <span className="text-muted block text-xs">by {item.requestedBy.fullName}</span>
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (item) => (
        <StatusBadge tone={item.status === "pending" ? "warning" : "info"}>
          {item.status === "pending" ? "Pending" : "Under review"}
        </StatusBadge>
      ),
    },
    {
      key: "action",
      header: "Action",
      cell: (item) =>
        item.status === "pending" ? (
          <Button
            variant="secondary"
            disabled={review.isPending}
            onClick={() => void startReview(item)}
          >
            <CheckCircle2 aria-hidden="true" className="size-4" strokeWidth={1.8} />
            {review.isPending ? "Starting…" : "Start review"}
          </Button>
        ) : (
          <span className="text-muted text-sm">Review in progress</span>
        ),
    },
  ];
  return (
    <ProductPanel title="My reassessment requests">
      <div className="p-4">
        {review.isError ? (
          <Alert className="border-danger/25 bg-danger-soft text-danger mb-4">
            {review.error instanceof Error ? review.error.message : "Unable to start this review."}
          </Alert>
        ) : null}
        {requests.isPending ? (
          <TableSkeleton rows={3} columns={6} />
        ) : requests.isError ? (
          <Alert className="border-danger/25 bg-danger-soft text-danger">
            Unable to load reassessment requests assigned to your risks.
          </Alert>
        ) : requests.data?.items.length ? (
          <DataTable columns={columns} rows={requests.data.items} getRowKey={(item) => item.id} />
        ) : (
          <EmptyState
            title="No reassessment requests"
            description="Requests appear here when an incident is linked to a risk you own."
          />
        )}
      </div>
    </ProductPanel>
  );
}
