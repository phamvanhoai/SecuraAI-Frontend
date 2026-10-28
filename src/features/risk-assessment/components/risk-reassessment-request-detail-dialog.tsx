"use client";

import { useEffect, useRef } from "react";
import {
  AlertTriangle,
  Calendar,
  ClipboardList,
  Gauge,
  ShieldAlert,
  Siren,
  User,
} from "lucide-react";
import { StatusBadge } from "@/components/data-display/static-product";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { RiskReassessmentReviewItem } from "../schemas/risk-reassessment-review-schema";

// ─── Presentation maps ────────────────────────────────────────────────────────

const statusPresentation = {
  pending: { label: "Pending", tone: "warning" },
  under_review: { label: "Under review", tone: "info" },
  completed: { label: "Completed", tone: "success" },
  rejected: { label: "Rejected", tone: "danger" },
} as const;

const ratingTone = {
  low: "neutral",
  medium: "info",
  high: "warning",
  critical: "danger",
} as const;

const severityTone = {
  critical: "danger",
  high: "warning",
  medium: "info",
  low: "neutral",
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat("en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "Not recorded";

const humanize = (value: string | null) =>
  value
    ? value.replaceAll("_", " ").replace(/^./, (l) => l.toUpperCase())
    : "Not recorded";

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionHeading({
  id,
  icon: Icon,
  children,
}: {
  id: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <Icon aria-hidden="true" className="text-muted size-3.5" />
      <h4
        className="text-muted text-xs font-bold tracking-wider uppercase"
        id={id}
      >
        {children}
      </h4>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-muted text-xs font-medium tracking-wide uppercase">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium break-words">{value}</dd>
    </div>
  );
}

function InfoGrid({
  id,
  children,
  className,
}: {
  id?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      aria-labelledby={id}
      className={cn(
        "border-border bg-neutral-soft/30 grid gap-4 rounded-xl border p-4",
        className,
      )}
    >
      {children}
    </div>
  );
}

// ─── Main dialog ─────────────────────────────────────────────────────────────

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
  const inherent = request?.risk.latestInherentAssessment ?? null;

  const ratingKey = inherent?.rating?.toLowerCase() as
    keyof typeof ratingTone | undefined;
  const inherentTone =
    ratingKey && ratingKey in ratingTone ? ratingTone[ratingKey] : "neutral";

  const severityKey = request?.incident.severity?.toLowerCase() as
    keyof typeof severityTone | undefined;
  const incidentSeverityTone =
    severityKey && severityKey in severityTone
      ? severityTone[severityKey]
      : "neutral";

  return (
    <Dialog
      className="max-h-[calc(100dvh-2rem)] w-[min(56rem,calc(100%-2rem))] overflow-y-auto"
      dialogRef={dialogRef}
      onClose={onClose}
      title="Reassessment Request Details"
    >
      {request && status ? (
        <div className="space-y-6">
          {/* ── Header ──────────────────────────────────────────────────── */}
          <div className="border-border flex flex-col gap-3 border-b pb-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h3 className="text-foreground text-xl font-semibold break-words">
                {request.risk.title}
              </h3>
              <p className="text-muted mt-1 font-mono text-xs tabular-nums">
                {request.risk.riskCode}&nbsp;·&nbsp;
                {request.incident.incidentCode}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
            </div>
          </div>

          {/* ── Request info ─────────────────────────────────────────────── */}
          <section aria-labelledby="section-request">
            <SectionHeading id="section-request" icon={ClipboardList}>
              Request
            </SectionHeading>
            <InfoGrid id="section-request" className="sm:grid-cols-2">
              <Detail
                label="Requested by"
                value={request.requestedBy.fullName}
              />
              <Detail
                label="Requested at"
                value={formatDate(request.requestedAt)}
              />
              <div className="sm:col-span-2">
                <dt className="text-muted text-xs font-medium tracking-wide uppercase">
                  Reason
                </dt>
                <dd className="bg-surface border-border mt-1 rounded-lg border p-3 text-sm leading-6 break-words whitespace-pre-wrap">
                  {request.reason}
                </dd>
              </div>
            </InfoGrid>
          </section>

          {/* ── Risk & incident ──────────────────────────────────────────── */}
          <section aria-labelledby="section-risk">
            <SectionHeading id="section-risk" icon={ShieldAlert}>
              Risk &amp; Incident
            </SectionHeading>
            <InfoGrid id="section-risk" className="sm:grid-cols-2">
              <Detail
                label="Risk"
                value={`${request.risk.riskCode} — ${request.risk.title}`}
              />
              <Detail
                label="Risk status"
                value={
                  <StatusBadge tone="neutral">
                    {humanize(request.risk.status)}
                  </StatusBadge>
                }
              />
              <Detail
                label="Incident"
                value={`${request.incident.incidentCode} — ${request.incident.title}`}
              />
              <Detail
                label="Incident severity"
                value={
                  request.incident.severity ? (
                    <StatusBadge tone={incidentSeverityTone}>
                      {humanize(request.incident.severity)}
                    </StatusBadge>
                  ) : (
                    <span className="text-muted text-sm">Not recorded</span>
                  )
                }
              />
            </InfoGrid>
          </section>

          {/* ── Assessment context ───────────────────────────────────────── */}
          <section aria-labelledby="section-assessment">
            <SectionHeading id="section-assessment" icon={Gauge}>
              Assessment Context
            </SectionHeading>
            <InfoGrid id="section-assessment" className="sm:grid-cols-3">
              <Detail
                label="Inherent likelihood"
                value={
                  inherent?.likelihood !== undefined &&
                  inherent.likelihood !== null
                    ? String(inherent.likelihood)
                    : "Not assessed"
                }
              />
              <Detail
                label="Inherent impact"
                value={
                  inherent?.impact !== undefined && inherent.impact !== null
                    ? String(inherent.impact)
                    : "Not assessed"
                }
              />
              <Detail
                label="Inherent rating"
                value={
                  inherent?.rating ? (
                    <StatusBadge tone={inherentTone}>
                      {humanize(inherent.rating)}
                    </StatusBadge>
                  ) : (
                    <span className="text-muted text-sm">Not assessed</span>
                  )
                }
              />
              {/* Treatment plans */}
              <div className="sm:col-span-3">
                <dt className="text-muted text-xs font-medium tracking-wide uppercase">
                  Treatment plans
                </dt>
                {request.risk.treatmentPlans.length ? (
                  <dd className="mt-2 space-y-2">
                    {request.risk.treatmentPlans.map((plan) => (
                      <div
                        className="bg-surface border-border flex flex-col gap-1 rounded-xl border p-3.5 sm:flex-row sm:items-center sm:justify-between"
                        key={plan.id}
                      >
                        <div className="min-w-0">
                          <p className="font-medium break-words">
                            {plan.title}
                          </p>
                          <p className="text-muted mt-0.5 text-xs">
                            {humanize(plan.strategy)} · {humanize(plan.status)}
                          </p>
                        </div>
                        <div className="text-muted flex items-center gap-1 text-xs sm:shrink-0">
                          <Calendar
                            aria-hidden="true"
                            className="size-3"
                            strokeWidth={1.8}
                          />
                          <span>Target: {formatDate(plan.targetDate)}</span>
                        </div>
                      </div>
                    ))}
                  </dd>
                ) : (
                  <dd className="text-muted mt-2 text-sm">
                    No treatment plan linked.
                  </dd>
                )}
              </div>
            </InfoGrid>
          </section>

          {/* ── Control weakness ─────────────────────────────────────────── */}
          {request.controlWeakness ? (
            <section aria-labelledby="section-weakness">
              <SectionHeading id="section-weakness" icon={AlertTriangle}>
                Control Weakness
              </SectionHeading>
              <div className="border-border bg-neutral-soft/30 rounded-xl border p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="font-medium">
                    {request.controlWeakness.control.controlCode} —{" "}
                    {request.controlWeakness.control.name}
                  </p>
                  <div className="flex gap-2">
                    {request.controlWeakness.severity ? (
                      <StatusBadge
                        tone={
                          severityTone[
                            request.controlWeakness.severity.toLowerCase() as keyof typeof severityTone
                          ] ?? "neutral"
                        }
                      >
                        {humanize(request.controlWeakness.severity)}
                      </StatusBadge>
                    ) : null}
                    <StatusBadge tone="neutral">
                      {humanize(request.controlWeakness.status)}
                    </StatusBadge>
                  </div>
                </div>
                <p className="text-muted mt-2 text-sm leading-6 break-words whitespace-pre-wrap">
                  {request.controlWeakness.description}
                </p>
              </div>
            </section>
          ) : null}

          {/* ── Decision ─────────────────────────────────────────────────── */}
          <section aria-labelledby="section-decision">
            <SectionHeading id="section-decision" icon={Siren}>
              Decision
            </SectionHeading>
            <InfoGrid id="section-decision" className="sm:grid-cols-2">
              <Detail
                label="Reviewed by"
                value={request.reviewedBy?.fullName ?? "Not reviewed"}
              />
              <Detail
                label="Reviewed at"
                value={formatDate(request.reviewedAt)}
              />
              {request.reviewComment ? (
                <div className="sm:col-span-2">
                  <dt className="text-muted text-xs font-medium tracking-wide uppercase">
                    Review comment
                  </dt>
                  <dd className="bg-surface border-border mt-1 rounded-lg border p-3 text-sm leading-6 break-words whitespace-pre-wrap">
                    {request.reviewComment}
                  </dd>
                </div>
              ) : null}
            </InfoGrid>
          </section>

          {/* ── Audit footer ─────────────────────────────────────────────── */}
          <div className="border-border bg-neutral-soft/20 text-muted flex flex-wrap items-center gap-3 rounded-xl border p-3 text-xs">
            <div className="flex items-center gap-1.5">
              <User aria-hidden="true" className="size-3.5" />
              <span>
                Requested by:{" "}
                <strong className="text-foreground font-medium">
                  {request.requestedBy.fullName}
                </strong>
              </span>
            </div>
            <span className="ml-auto tabular-nums">
              {formatDate(request.requestedAt)}
            </span>
          </div>

          {/* ── Footer actions ───────────────────────────────────────────── */}
          <div className="flex justify-end pt-1">
            <Button type="button" variant="secondary" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      ) : null}
    </Dialog>
  );
}
