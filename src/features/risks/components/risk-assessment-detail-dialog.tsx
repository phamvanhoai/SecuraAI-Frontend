"use client";
import { useEffect, useRef, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useSessionUser } from "@/features/auth";
import { useRiskAssessmentDetail } from "../hooks/use-risk-assessment-detail";
import type { RiskDetail } from "../schemas/risk-detail-schema";
import { SubmitTreatmentPlanDialog } from "./submit-treatment-plan-dialog";
import { ApproveTreatmentPlanDialog } from "./approve-treatment-plan-dialog";
import { ReturnTreatmentPlanForRevisionDialog } from "./return-treatment-plan-for-revision-dialog";

const formatDate = (value: string | null): string =>
  value
    ? new Intl.DateTimeFormat("en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "Not available";
const Detail = ({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) => (
  <div>
    <dt className="text-muted text-xs font-medium tracking-wide uppercase">
      {label}
    </dt>
    <dd className="mt-1 text-sm font-medium">{value ?? "Not available"}</dd>
  </div>
);

function submissionIssues(
  plan: RiskDetail["treatmentPlans"][number],
  riskStatus: RiskDetail["assessment"]["status"],
): string[] {
  const issues: string[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDate = plan.targetDate ? new Date(plan.targetDate) : null;
  if (!["draft", "rejected"].includes(riskStatus))
    issues.push("Only a draft or rejected risk assessment can be submitted.");
  if (plan.description.trim().length < 10)
    issues.push("Add a meaningful plan description.");
  if (!plan.owner || plan.owner.inactive)
    issues.push("Assign an active plan owner.");
  if (!targetDate) issues.push("Set a target date.");
  else if (targetDate < today) issues.push("The target date is in the past.");
  const actions = plan.actions.filter(({ status }) => status !== "cancelled");
  if (plan.strategy !== "accept" && actions.length === 0)
    issues.push("This strategy requires an active treatment action.");
  if (actions.some(({ assignee }) => !assignee || assignee.inactive))
    issues.push("Every action needs an active assignee.");
  if (actions.some(({ dueDate }) => !dueDate))
    issues.push("Every action needs a due date.");
  if (
    targetDate &&
    actions.some(
      ({ dueDate }) =>
        dueDate !== null &&
        (new Date(dueDate) < today || new Date(dueDate) > targetDate),
    )
  )
    issues.push("Action due dates must be current and before the target date.");
  if (
    actions.some(
      ({ status, progressPercent }) => status !== "pending" || progressPercent !== 0,
    )
  )
    issues.push("Actions must be pending with zero progress.");
  return issues;
}

export function RiskAssessmentDetailDialog({
  id,
  onClose,
}: {
  id: string | null;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const detail = useRiskAssessmentDetail(id);
  const session = useSessionUser();
  const [submittingPlan, setSubmittingPlan] = useState<
    RiskDetail["treatmentPlans"][number] | null
  >(null);
  const [approvingPlan, setApprovingPlan] = useState<
    RiskDetail["treatmentPlans"][number] | null
  >(null);
  const [returningPlan, setReturningPlan] = useState<
    RiskDetail["treatmentPlans"][number] | null
  >(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (id && !dialog.open) dialog.showModal();
    if (!id && dialog.open) dialog.close();
  }, [id]);
  const data = detail.data;
  const canSubmit =
    session.data?.permissions.includes("risk-treatment-plans.submit") ?? false;
  const canApprove =
    session.data?.permissions.includes("risk-treatment-plans.approve") ?? false;
  const isAdmin =
    session.data?.roles.some(({ code }) => code === "ADMIN") ?? false;
  return (
    <>
      <Dialog
      title="Risk Assessment Details"
      dialogRef={ref}
      onClose={onClose}
      className="max-h-[90vh] w-[min(70rem,calc(100%-2rem))] overflow-y-auto"
    >
      {detail.isPending ? (
        <p className="text-muted py-10 text-center">
          Loading risk assessment details…
        </p>
      ) : null}
      {detail.isError ? (
        <Alert>
          <strong className="block">
            Unable to load risk assessment details
          </strong>
          <span>The assessment may not exist or you may not have access.</span>
        </Alert>
      ) : null}
      {data ? (
        <div className="space-y-6">
          <section>
            <p className="text-muted text-sm">{data.assessment.riskCode}</p>
            <h3 className="mt-1 text-xl font-semibold">
              {data.assessment.title}
            </h3>
            <p className="text-muted mt-2 text-sm leading-6">
              {data.assessment.description ?? "No description provided."}
            </p>
          </section>
          {data.assessment.cancellation ? (
            <section className="border-danger/25 bg-danger-soft rounded-xl border p-4">
              <h3 className="text-danger font-semibold">Cancellation record</h3>
              <dl className="mt-3 grid gap-4 sm:grid-cols-2">
                <Detail
                  label="Cancelled by"
                  value={
                    data.assessment.cancellation.cancelledBy?.fullName ??
                    "Unknown user"
                  }
                />
                <Detail
                  label="Cancelled at"
                  value={formatDate(data.assessment.cancellation.cancelledAt)}
                />
              </dl>
              <p className="mt-4 text-sm">
                <span className="font-medium">Reason:</span>{" "}
                {data.assessment.cancellation.reason}
              </p>
            </section>
          ) : null}
          <section className="border-border grid gap-4 rounded-xl border p-4 sm:grid-cols-2 lg:grid-cols-4">
            <Detail
              label="Status"
              value={data.assessment.status.replaceAll("_", " ")}
            />
            <Detail
              label="Target"
              value={`${data.target.code} — ${data.target.name}`}
            />
            <Detail
              label="Assessed by"
              value={
                data.assessment.assessedBy
                  ? `${data.assessment.assessedBy.fullName}${data.assessment.assessedBy.inactive ? " (Inactive)" : ""}`
                  : "Unassigned"
              }
            />
            <Detail
              label="Assessed at"
              value={formatDate(data.assessment.assessedAt)}
            />
          </section>
          <section>
            <h3 className="font-semibold">Risk analysis</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="bg-neutral-soft rounded-xl p-4">
                <p className="text-muted text-xs font-medium uppercase">
                  Inherent risk
                </p>
                <p className="mt-2 text-2xl font-semibold">
                  {data.inherentRisk.score}{" "}
                  <span className="text-sm capitalize">
                    {data.inherentRisk.level}
                  </span>
                </p>
                <p className="text-muted mt-1 text-sm">
                  Likelihood {data.inherentRisk.likelihood} × Impact{" "}
                  {data.inherentRisk.impact}
                </p>
              </div>
              <div className="bg-neutral-soft rounded-xl p-4">
                <p className="text-muted text-xs font-medium uppercase">
                  Residual risk
                </p>
                {data.residualRisk ? (
                  <>
                    <p className="mt-2 text-2xl font-semibold">
                      {data.residualRisk.score}{" "}
                      <span className="text-sm capitalize">
                        {data.residualRisk.level}
                      </span>
                    </p>
                    <p className="text-muted mt-1 text-sm">
                      Reduced by {data.residualRisk.reduction} points
                    </p>
                  </>
                ) : (
                  <p className="text-muted mt-3 text-sm">Not assessed</p>
                )}
              </div>
            </div>
          </section>
          <div className="grid gap-5 lg:grid-cols-2">
            <LinkedItems
              title="Threats"
              empty="No threats linked"
              items={data.threats.map((item) => ({
                key: item.id,
                heading: `${item.code} — ${item.name}`,
                detail: item.notes ?? item.description,
              }))}
            />
            <LinkedItems
              title="Vulnerabilities"
              empty="No vulnerabilities linked"
              items={data.vulnerabilities.map((item) => ({
                key: item.id,
                heading: `${item.code} — ${item.name}`,
                detail: item.notes ?? item.description,
              }))}
            />
          </div>
          <section>
            <h3 className="font-semibold">Treatment plans</h3>
            {data.treatmentPlans.length === 0 ? (
              <p className="text-muted mt-2 text-sm">No treatment plan</p>
            ) : (
              <div className="mt-3 space-y-3">
                {data.treatmentPlans.map((plan) => {
                  const issues = submissionIssues(plan, data.assessment.status);
                  const canManage =
                    isAdmin ||
                    plan.owner?.id === session.data?.id ||
                    plan.createdBy?.id === session.data?.id;
                  return (
                  <article
                    className="border-border rounded-xl border p-4"
                    key={plan.id}
                  >
                    <div className="flex flex-wrap justify-between gap-2">
                      <strong className="capitalize">
                        {plan.strategy} · {plan.status.replaceAll("_", " ")}
                      </strong>
                      <span className="text-muted text-sm">
                        Target: {formatDate(plan.targetDate)}
                      </span>
                    </div>
                    <p className="text-muted mt-2 text-sm">
                      {plan.description}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                      <p className="text-muted text-sm">
                        Owner: {plan.owner?.fullName ?? "Unassigned"}
                      </p>
                      {canSubmit &&
                      ["draft", "rejected"].includes(plan.status) &&
                      canManage ? (
                        <Button
                          type="button"
                          disabled={issues.length > 0}
                          title={issues[0]}
                          onClick={() => setSubmittingPlan(plan)}
                        >
                          Submit for approval
                        </Button>
                      ) : null}
                      {canApprove &&
                      plan.status === "pending_approval" &&
                      plan.approval?.status === "pending" &&
                      plan.approval.submittedBy?.id !== session.data?.id ? (
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setReturningPlan(plan)}
                          >
                            Return for revision
                          </Button>
                          <Button type="button" onClick={() => setApprovingPlan(plan)}>
                            Review and approve
                          </Button>
                        </div>
                      ) : null}
                    </div>
                    {issues.length > 0 &&
                    ["draft", "rejected"].includes(plan.status) &&
                    canManage ? (
                      <div className="border-warning/25 bg-warning-soft text-warning mt-3 rounded-lg border p-3 text-xs">
                        <p className="font-medium">Not ready for submission</p>
                        <ul className="mt-1 list-disc space-y-1 pl-4">
                          {issues.map((issue) => (
                            <li key={issue}>{issue}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {plan.approval ? (
                      <div className="bg-info-soft text-info mt-3 rounded-lg p-3 text-xs">
                        <p className="font-medium">
                          Approval: {plan.approval.status.replaceAll("_", " ")}
                        </p>
                        <p className="mt-1">
                          Step {plan.approval.currentStep}
                          {plan.approval.currentStepName
                            ? ` — ${plan.approval.currentStepName}`
                            : ""}
                          {plan.approval.approverRole
                            ? ` · ${plan.approval.approverRole.name}`
                            : ""}
                        </p>
                        <p className="mt-1">
                          Submitted by {plan.approval.submittedBy?.fullName ?? "Unknown"} ·{" "}
                          {formatDate(plan.approval.submittedAt)}
                        </p>
                        {plan.approval.submissionNote ? (
                          <p className="mt-1">Note: {plan.approval.submissionNote}</p>
                        ) : null}
                        {plan.approval.latestDecision?.decision === "returned" ? (
                          <div className="border-danger/25 bg-danger-soft text-danger mt-3 rounded-lg border p-3">
                            <p className="font-medium">Returned for revision</p>
                            <p className="mt-1 whitespace-pre-wrap">
                              {plan.approval.latestDecision.comment ?? "No revision reason provided."}
                            </p>
                            <p className="mt-1">
                              By {plan.approval.latestDecision.actedBy?.fullName ?? "Unknown"} ·{" "}
                              {formatDate(plan.approval.latestDecision.actedAt)}
                            </p>
                          </div>
                        ) : null}
                        {plan.approval.history.length > 0 ? (
                          <div className="mt-3 border-t border-current/15 pt-3">
                            <p className="font-medium">Approval and revision history</p>
                            <ol className="mt-2 space-y-2">
                              {plan.approval.history.map((entry, index) => (
                                <li className="rounded-md bg-background/60 p-2" key={`${entry.approvalRequestId}-${entry.actedAt}-${index}`}>
                                  <p className="font-medium capitalize">
                                    {entry.type === "revision" ? "Returned for revision" : entry.type}
                                    {entry.decision && entry.type !== "revision" ? ` · ${entry.decision}` : ""}
                                  </p>
                                  <p className="mt-1">
                                    {entry.actedBy?.fullName ?? "Unknown"} · {formatDate(entry.actedAt)}
                                  </p>
                                  {entry.comment ? <p className="mt-1 whitespace-pre-wrap">{entry.comment}</p> : null}
                                </li>
                              ))}
                            </ol>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                    {plan.actions.length ? (
                      <div className="mt-4 space-y-2">
                        {plan.actions.map((action) => {
                          const overdue =
                            action.dueDate &&
                            !action.completedAt &&
                            new Date(action.dueDate) < new Date();
                          return (
                            <div
                              className="bg-neutral-soft rounded-lg p-3"
                              key={action.id}
                            >
                              <div className="flex flex-wrap justify-between gap-2">
                                <span className="font-medium">
                                  {action.title}
                                </span>
                                <span
                                  className={
                                    overdue
                                      ? "text-danger text-xs font-medium"
                                      : "text-muted text-xs"
                                  }
                                >
                                  {overdue ? "Overdue · " : ""}
                                  {action.progressPercent}% · {action.status}
                                </span>
                              </div>
                              <p className="text-muted mt-1 text-xs">
                                Due: {formatDate(action.dueDate)} · Assigned to:{" "}
                                {action.assignee?.fullName ?? "Unassigned"}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-muted mt-3 text-sm">
                        No treatment actions
                      </p>
                    )}
                  </article>
                  );
                })}
              </div>
            )}
          </section>
          {data.previousAssessment ? (
            <section className="border-border rounded-xl border p-4">
              <h3 className="font-semibold">Previous assessment</h3>
              <p className="mt-2 text-sm">
                {data.previousAssessment.riskCode} —{" "}
                {data.previousAssessment.title}
              </p>
              <p className="text-muted mt-1 text-sm">
                Score {data.previousAssessment.score} ·{" "}
                {data.previousAssessment.level} ·{" "}
                {formatDate(data.previousAssessment.assessedAt)}
              </p>
            </section>
          ) : null}
          <dl className="grid gap-4 sm:grid-cols-3">
            <Detail
              label="Created"
              value={formatDate(data.assessment.createdAt)}
            />
            <Detail
              label="Last updated"
              value={formatDate(data.assessment.updatedAt)}
            />
            <Detail
              label="Closed"
              value={formatDate(data.assessment.closedAt)}
            />
          </dl>
        </div>
      ) : null}
      <div className="mt-6 flex justify-end">
        <Button variant="secondary" onClick={() => ref.current?.close()}>
          Close
        </Button>
      </div>
      </Dialog>
      <SubmitTreatmentPlanDialog
        plan={submittingPlan}
        risk={data ? {
          riskCode: data.assessment.riskCode,
          title: data.assessment.title,
          updatedAt: data.assessment.updatedAt,
          score: data.inherentRisk.score,
          level: data.inherentRisk.level,
        } : null}
        onClose={() => setSubmittingPlan(null)}
      />
      <ApproveTreatmentPlanDialog
        plan={approvingPlan}
        risk={data ? {
          riskCode: data.assessment.riskCode,
          title: data.assessment.title,
          score: data.inherentRisk.score,
          level: data.inherentRisk.level,
          target: { code: data.target.code, name: data.target.name },
          threatCount: data.threats.length,
          vulnerabilityCount: data.vulnerabilities.length,
        } : null}
        onClose={() => setApprovingPlan(null)}
      />
      <ReturnTreatmentPlanForRevisionDialog
        plan={returningPlan}
        riskCode={data?.assessment.riskCode ?? "Risk assessment"}
        onClose={() => setReturningPlan(null)}
      />
    </>
  );
}

function LinkedItems({
  title,
  empty,
  items,
}: {
  title: string;
  empty: string;
  items: { key: string; heading: string; detail: string | null }[];
}) {
  return (
    <section>
      <h3 className="font-semibold">{title}</h3>
      {items.length ? (
        <ul className="mt-3 space-y-2">
          {items.map((item) => (
            <li className="border-border rounded-lg border p-3" key={item.key}>
              <p className="text-sm font-medium">{item.heading}</p>
              {item.detail ? (
                <p className="text-muted mt-1 text-xs leading-5">
                  {item.detail}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted mt-2 text-sm">{empty}</p>
      )}
    </section>
  );
}
