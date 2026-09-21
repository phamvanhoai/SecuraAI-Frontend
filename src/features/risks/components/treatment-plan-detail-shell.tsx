"use client";

import { ArrowLeft, Ban, CalendarClock, ExternalLink, Pencil } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
  ProductPageHeader,
  ProductPanel,
  StatusBadge,
} from "@/components/data-display/static-product";
import { DashboardLoadingSkeleton } from "@/components/feedback/loading-skeletons";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useSessionUser } from "@/features/auth";
import { useTreatmentPlanDetail } from "../hooks/use-treatment-plan-detail";
import { EditTreatmentPlanDialog } from "./edit-treatment-plan-dialog";
import { CancelTreatmentPlanDialog } from "./cancel-treatment-plan-dialog";
import { UpdateTreatmentActionProgressDialog } from "./update-treatment-action-progress-dialog";
import type { TreatmentPlanDetail } from "../schemas/treatment-plan-detail-schema";

const labels: Record<string, string> = {
  draft: "Draft",
  pending_approval: "Pending approval",
  approved: "Approved",
  in_progress: "In progress",
  completed: "Completed",
  rejected: "Rejected",
  cancelled: "Cancelled",
  avoid: "Avoid",
  mitigate: "Mitigate",
  transfer: "Transfer",
  accept: "Accept",
};
const tones = {
  draft: "neutral",
  pending_approval: "warning",
  approved: "info",
  in_progress: "info",
  completed: "success",
  rejected: "danger",
  cancelled: "neutral",
} as const;
const date = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(
        new Date(value),
      )
    : "Not set";

export function TreatmentPlanDetailShell({
  treatmentPlanId,
}: {
  treatmentPlanId: string;
}) {
  const session = useSessionUser();
  const [editing, setEditing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [progressAction, setProgressAction] = useState<TreatmentPlanDetail["actions"][number] | null>(null);
  const canRead =
    session.data?.permissions.includes("risk-treatment-plans.read") ?? false;
  const detail = useTreatmentPlanDetail(treatmentPlanId, canRead);
  if (session.isPending || (canRead && detail.isPending))
    return <DashboardLoadingSkeleton variant="table" />;
  if (!canRead)
    return (
      <Alert>
        <strong className="block">
          You do not have permission to view treatment plans
        </strong>
        <span>
          Contact an administrator if you need the risk-treatment-plans.read
          permission.
        </span>
      </Alert>
    );
  if (detail.isError || !detail.data)
    return (
      <div className="space-y-3">
        <Alert>
          <strong className="block">Unable to load treatment plan</strong>
          <span>
            The plan may no longer exist, or the backend could not be reached.
          </span>
        </Alert>
        <Button variant="secondary" onClick={() => void detail.refetch()}>
          Retry
        </Button>
      </div>
    );
  const plan = detail.data;
  const isAdmin = session.data?.roles.some(({ code }) => code === "ADMIN") ?? false;
  const canUpdate =
    (session.data?.permissions.includes("risk-treatment-plans.update") ?? false) &&
    ["draft", "rejected"].includes(plan.status) &&
    (isAdmin || plan.owner?.id === session.data?.id || plan.createdBy?.id === session.data?.id);
  const canCancel =
    (session.data?.permissions.includes("risk-treatment-plans.cancel") ?? false) &&
    ["draft", "rejected"].includes(plan.status) &&
    plan.actions.every((action) =>
      ["pending", "cancelled"].includes(action.status) && action.progressPercent === 0,
    ) &&
    (isAdmin || plan.owner?.id === session.data?.id || plan.createdBy?.id === session.data?.id);
  return (
    <>
      <ProductPageHeader
        title={`${labels[plan.strategy] ?? plan.strategy} treatment plan`}
        description={`${plan.risk.riskCode} — ${plan.risk.title}`}
        showSampleNotice={false}
        additionalActions={
          <div className="flex flex-wrap gap-2">
            {canUpdate ? <Button type="button" onClick={() => setEditing(true)}><Pencil className="size-4" aria-hidden="true" /> Edit plan</Button> : null}
            {canCancel ? <Button type="button" variant="danger" onClick={() => setCancelling(true)}><Ban className="size-4" aria-hidden="true" /> Cancel plan</Button> : null}
            <Link className="border-border bg-surface hover:bg-neutral-soft inline-flex min-h-10 items-center gap-2 rounded-lg border px-3.5 text-sm font-medium" href="/risks/treatment-plans">
              <ArrowLeft className="size-4" aria-hidden="true" /> Treatment plans
            </Link>
          </div>
        }
      />
      <EditTreatmentPlanDialog plan={plan} open={editing} onClose={() => setEditing(false)} />
      <CancelTreatmentPlanDialog plan={plan} open={cancelling} onClose={() => setCancelling(false)} />
      {progressAction ? <UpdateTreatmentActionProgressDialog
        treatmentPlanId={plan.id} action={progressAction}
        onClose={() => setProgressAction(null)}
        onReload={() => { setProgressAction(null); void detail.refetch(); }}
      /> : null}
      {plan.cancellation ? (
        <Alert className="mb-5 border-danger/25 bg-danger-soft text-danger">
          <strong className="block">Treatment plan cancelled</strong>
          <span className="block">
            Cancelled by {plan.cancellation.cancelledBy?.fullName ?? "Unknown user"} on {date(plan.cancellation.cancelledAt)}.
          </span>
          <span className="mt-1 block">Reason: {plan.cancellation.reason}</span>
        </Alert>
      ) : null}
      <div className="grid gap-5 xl:grid-cols-3">
        <div className="space-y-5 xl:col-span-2">
          <ProductPanel title="Plan overview" description={plan.description}>
            <dl className="grid gap-5 p-5 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <dt className="text-muted text-xs uppercase">Status</dt>
                <dd className="mt-1">
                  <StatusBadge tone={tones[plan.status]}>
                    {labels[plan.status]}
                  </StatusBadge>
                </dd>
              </div>
              <div>
                <dt className="text-muted text-xs uppercase">Owner</dt>
                <dd className="mt-1 font-medium">
                  {plan.owner?.fullName ?? "Unassigned"}
                  {plan.owner?.inactive ? " (Inactive)" : ""}
                </dd>
              </div>
              <div>
                <dt className="text-muted text-xs uppercase">Target date</dt>
                <dd
                  className={
                    plan.isOverdue
                      ? "text-danger mt-1 font-medium"
                      : "mt-1 font-medium"
                  }
                >
                  {date(plan.targetDate)}
                  {plan.isOverdue ? " · Overdue" : ""}
                </dd>
              </div>
              <div>
                <dt className="text-muted text-xs uppercase">Created by</dt>
                <dd className="mt-1">
                  {plan.createdBy?.fullName ?? "Unknown"}
                </dd>
              </div>
              <div>
                <dt className="text-muted text-xs uppercase">Submitted</dt>
                <dd className="mt-1">{date(plan.submittedAt)}</dd>
              </div>
              <div>
                <dt className="text-muted text-xs uppercase">Completed</dt>
                <dd className="mt-1">{date(plan.completedAt)}</dd>
              </div>
            </dl>
          </ProductPanel>
          <ProductPanel
            title="Treatment actions"
            description={`${plan.completedActions} of ${plan.totalActions} active actions completed`}
          >
            {plan.actions.length === 0 ? (
              <p className="text-muted p-5">
                No treatment actions have been added.
              </p>
            ) : (
              <ul className="divide-border divide-y">
                {plan.actions.map((action) => (
                  <li className="p-5" key={action.id}>
                    <div className="flex flex-wrap justify-between gap-3">
                      <div>
                        <h3 className="font-medium">{action.title}</h3>
                        <p className="text-muted mt-1 text-sm">
                          {action.description || "No description"}
                        </p>
                      </div>
                      <StatusBadge
                        tone={
                          action.status === "completed"
                            ? "success"
                            : action.status === "cancelled"
                              ? "neutral"
                              : "info"
                        }
                      >
                        {labels[action.status] ?? action.status}
                      </StatusBadge>
                    </div>
                    <div className="text-muted mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
                      <span>
                        Assignee: {action.assignee?.fullName ?? "Unassigned"}
                      </span>
                      <span>Due: {date(action.dueDate)}</span>
                      <span>{action.progressPercent}% complete</span>
                      {action.completedAt ? <span>Completed: {date(action.completedAt)}</span> : null}
                    </div>
                    <div
                      className="bg-neutral-soft mt-3 h-2 overflow-hidden rounded-full"
                      role="progressbar"
                      aria-label={`${action.title} progress`}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={action.progressPercent}
                    >
                      <div
                        className="bg-brand h-full"
                        style={{ width: `${action.progressPercent}%` }}
                      />
                    </div>
                    {session.data?.permissions.includes("risk-treatment-actions.update-progress") &&
                      ["approved", "in_progress"].includes(plan.status) &&
                      ["approved", "in_treatment"].includes(plan.risk.status) &&
                      action.status !== "cancelled" &&
                      (isAdmin || plan.owner?.id === session.data.id || action.assignee?.id === session.data.id) ? (
                        <Button type="button" variant="secondary" className="mt-3"
                          onClick={() => setProgressAction(action)}
                          aria-label={`Update progress for ${action.title}`}>
                          <Pencil className="size-4" aria-hidden="true" /> Update progress
                        </Button>
                      ) : null}
                  </li>
                ))}
              </ul>
            )}
          </ProductPanel>
        </div>
        <div className="space-y-5">
          <ProductPanel title="Overall progress">
            <div className="p-5">
              <p className="text-3xl font-semibold">
                {plan.progressPercent === null
                  ? "N/A"
                  : `${plan.progressPercent}%`}
              </p>
              <p className="text-muted mt-1 text-sm">
                Cancelled actions are excluded.
              </p>
            </div>
          </ProductPanel>
          <ProductPanel title="Risk context">
            <div className="space-y-3 p-5">
              <div>
                <p className="text-muted text-xs uppercase">Risk</p>
                <p className="font-medium">
                  {plan.risk.riskCode} — {plan.risk.title}
                </p>
              </div>
              <div>
                <p className="text-muted text-xs uppercase">Target</p>
                <p>
                  {plan.risk.target.code} — {plan.risk.target.name}
                  {plan.risk.target.deleted ? " (Deleted)" : ""}
                </p>
              </div>
              <div>
                <p className="text-muted text-xs uppercase">Inherent risk</p>
                <p>
                  {plan.risk.score} · {plan.risk.level}
                </p>
              </div>
              <Link
                className="text-brand inline-flex items-center gap-1 text-sm font-medium"
                href={`/risks?assessment=${plan.risk.id}`}
              >
                View risk assessment{" "}
                <ExternalLink className="size-3.5" aria-hidden="true" />
              </Link>
            </div>
          </ProductPanel>
          <ProductPanel title="Approval">
            <div className="p-5">
              {plan.approval ? (
                <dl className="space-y-3">
                  <div>
                    <dt className="text-muted text-xs uppercase">Status</dt>
                    <dd>
                      {labels[plan.approval.status] ?? plan.approval.status}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted text-xs uppercase">
                      Current step
                    </dt>
                    <dd>
                      {plan.approval.currentStepName ??
                        `Step ${plan.approval.currentStep}`}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted text-xs uppercase">
                      Approver role
                    </dt>
                    <dd>
                      {plan.approval.approverRole?.name ?? "Not assigned"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted text-xs uppercase">
                      Submitted by
                    </dt>
                    <dd>{plan.approval.submittedBy?.fullName ?? "Unknown"}</dd>
                  </div>
                  {plan.approval.submissionNote ? (
                    <div>
                      <dt className="text-muted text-xs uppercase">
                        Submission note
                      </dt>
                      <dd className="whitespace-pre-wrap">
                        {plan.approval.submissionNote}
                      </dd>
                    </div>
                  ) : null}
                </dl>
              ) : (
                <p className="text-muted">Not submitted for approval.</p>
              )}
            </div>
          </ProductPanel>
          <p className="text-muted flex items-center gap-2 text-xs">
            <CalendarClock className="size-4" aria-hidden="true" />
            Last updated {date(plan.updatedAt)}
          </p>
        </div>
      </div>
    </>
  );
}
