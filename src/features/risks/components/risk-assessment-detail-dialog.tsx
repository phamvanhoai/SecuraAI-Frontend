"use client";
import { useEffect, useRef } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useRiskAssessmentDetail } from "../hooks/use-risk-assessment-detail";

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

export function RiskAssessmentDetailDialog({
  id,
  onClose,
}: {
  id: string | null;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const detail = useRiskAssessmentDetail(id);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (id && !dialog.open) dialog.showModal();
    if (!id && dialog.open) dialog.close();
  }, [id]);
  const data = detail.data;
  return (
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
                {data.treatmentPlans.map((plan) => (
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
                    <p className="text-muted mt-2 text-sm">
                      Owner: {plan.owner?.fullName ?? "Unassigned"}
                    </p>
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
                ))}
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
