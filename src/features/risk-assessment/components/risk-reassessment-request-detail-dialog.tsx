"use client";

import { useEffect, useRef } from "react";
import { StatusBadge } from "@/components/data-display/static-product";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import type { RiskReassessmentReviewItem } from "../schemas/risk-reassessment-review-schema";

const statusPresentation = {
  pending: { label: "Pending", tone: "warning" },
  under_review: { label: "Under review", tone: "info" },
  completed: { label: "Completed", tone: "success" },
  rejected: { label: "Rejected", tone: "danger" },
} as const;

const formatDate = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat("en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "Not recorded";

const humanize = (value: string | null) =>
  value
    ? value.replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase())
    : "Not recorded";

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-border bg-background min-w-0 rounded-lg border p-3">
      <dt className="text-muted text-xs font-medium tracking-wide uppercase">
        {label}
      </dt>
      <dd className="mt-1 break-words">{value}</dd>
    </div>
  );
}

export function RiskReassessmentRequestDetailDialog({
  request,
  onClose,
}: {
  request: RiskReassessmentReviewItem | null;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (request && dialog && !dialog.open) dialog.showModal();
    if (!request && dialog?.open) dialog.close();
  }, [request]);

  const status = request ? statusPresentation[request.status] : null;

  return (
    <Dialog
      className="max-h-[calc(100dvh-2rem)] w-[min(56rem,calc(100%-2rem))] overflow-y-auto"
      dialogRef={dialogRef}
      onClose={onClose}
      title="Reassessment request details"
    >
      {request && status ? (
        <div className="space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold break-words">{request.risk.title}</p>
              <p className="text-muted mt-1 text-sm tabular-nums">
                {request.risk.riskCode} · {request.incident.incidentCode}
              </p>
            </div>
            <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
          </div>

          <section>
            <h3 className="text-sm font-semibold">Request</h3>
            <dl className="mt-3 grid gap-3 sm:grid-cols-2">
              <Fact label="Requested by" value={request.requestedBy.fullName} />
              <Fact
                label="Requested at"
                value={formatDate(request.requestedAt)}
              />
            </dl>
            <div className="border-border bg-background mt-3 rounded-lg border p-3">
              <p className="text-muted text-xs font-medium tracking-wide uppercase">
                Reason
              </p>
              <p className="mt-1 break-words whitespace-pre-wrap">
                {request.reason}
              </p>
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold">Risk and incident</h3>
            <dl className="mt-3 grid gap-3 sm:grid-cols-2">
              <Fact
                label="Risk"
                value={`${request.risk.riskCode} — ${request.risk.title}`}
              />
              <Fact label="Risk status" value={humanize(request.risk.status)} />
              <Fact
                label="Incident"
                value={`${request.incident.incidentCode} — ${request.incident.title}`}
              />
              <Fact
                label="Incident severity"
                value={humanize(request.incident.severity)}
              />
            </dl>
          </section>

          <section>
            <h3 className="text-sm font-semibold">Assessment context</h3>
            <dl className="mt-3 grid gap-3 sm:grid-cols-3">
              <Fact
                label="Inherent likelihood"
                value={String(
                  request.risk.latestInherentAssessment?.likelihood ??
                    "Not assessed",
                )}
              />
              <Fact
                label="Inherent impact"
                value={String(
                  request.risk.latestInherentAssessment?.impact ??
                    "Not assessed",
                )}
              />
              <Fact
                label="Inherent rating"
                value={humanize(
                  request.risk.latestInherentAssessment?.rating ?? null,
                )}
              />
            </dl>
            <div className="mt-3">
              <p className="text-muted text-xs font-medium tracking-wide uppercase">
                Treatment plans
              </p>
              {request.risk.treatmentPlans.length ? (
                <ul className="mt-2 space-y-2">
                  {request.risk.treatmentPlans.map((plan) => (
                    <li
                      className="border-border rounded-lg border p-3"
                      key={plan.id}
                    >
                      <p className="font-medium break-words">{plan.title}</p>
                      <p className="text-muted mt-1 text-sm">
                        {humanize(plan.strategy)} · {humanize(plan.status)} ·
                        target {formatDate(plan.targetDate)}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted mt-2 text-sm">
                  No treatment plan linked.
                </p>
              )}
            </div>
          </section>

          {request.controlWeakness ? (
            <section>
              <h3 className="text-sm font-semibold">Control weakness</h3>
              <div className="border-border mt-3 rounded-lg border p-3">
                <p className="font-medium">
                  {request.controlWeakness.control.controlCode} —{" "}
                  {request.controlWeakness.control.name}
                </p>
                <p className="text-muted mt-1 text-sm break-words whitespace-pre-wrap">
                  {request.controlWeakness.description}
                </p>
                <p className="text-muted mt-2 text-xs">
                  {humanize(request.controlWeakness.severity)} ·{" "}
                  {humanize(request.controlWeakness.status)}
                </p>
              </div>
            </section>
          ) : null}

          <section>
            <h3 className="text-sm font-semibold">Decision</h3>
            <dl className="mt-3 grid gap-3 sm:grid-cols-2">
              <Fact
                label="Reviewed by"
                value={request.reviewedBy?.fullName ?? "Not reviewed"}
              />
              <Fact
                label="Reviewed at"
                value={formatDate(request.reviewedAt)}
              />
            </dl>
            {request.reviewComment ? (
              <div className="border-border bg-background mt-3 rounded-lg border p-3">
                <p className="text-muted text-xs font-medium tracking-wide uppercase">
                  Review comment
                </p>
                <p className="mt-1 break-words whitespace-pre-wrap">
                  {request.reviewComment}
                </p>
              </div>
            ) : null}
          </section>

          <div className="flex justify-end">
            <Button type="button" variant="secondary" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      ) : null}
    </Dialog>
  );
}
