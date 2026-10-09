"use client";

import { useEffect, useRef, useState } from "react";
import { ClipboardCheck, Pencil, Send, X } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useRiskRecord } from "../hooks/use-risk-register";
import type { RiskRegisterDetail } from "../schemas/risk-register-schema";
import { UpdateRiskTreatmentPlanDialog } from "./update-risk-treatment-plan-dialog";
import { useSessionUser } from "@/features/authentication-account";
import {
  DecideRiskAcceptanceDialog,
  SubmitRiskAcceptanceDialog,
} from "./risk-acceptance-dialogs";

const format = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(new Date(value))
    : "Not set";
const title = (value: string) =>
  value.replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase());

export function RiskAssessmentDetailDialog({
  id,
  onClose,
}: {
  id: string | null;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const detail = useRiskRecord(id);
  const session = useSessionUser();
  const [accepting, setAccepting] = useState(false);
  const [decidingAcceptance, setDecidingAcceptance] = useState<string | null>(
    null,
  );
  const [editingPlan, setEditingPlan] = useState<
    RiskRegisterDetail["treatmentPlans"][number] | null
  >(null);
  useEffect(() => {
    const dialog = ref.current;
    if (id && dialog && !dialog.open) dialog.showModal();
    if (!id && dialog?.open) dialog.close();
  }, [id]);
  const risk = detail.data;
  const isOwner = Boolean(
    risk && session.data && risk.owner?.id === session.data.id,
  );
  const isOfficer =
    session.data?.roles.some((role) => role.code === "SECURITY_OFFICER") ??
    false;
  const terminalRisk = risk?.status === "closed" || risk?.status === "archived";
  const eligiblePlans =
    risk?.treatmentPlans.filter((plan) =>
      ["draft", "active", "completed"].includes(plan.status),
    ) ?? [];
  const acceptanceBlocked = terminalRisk
    ? "Closed or archived risks cannot submit acceptance."
    : risk?.status === "accepted"
      ? "This risk is accepted. Review is required before a new acceptance request."
      : risk?.vulnerabilityWorkflow?.assessmentReviewRequired
        ? "New vulnerabilities require an up-to-date inherent and residual assessment before submitting acceptance."
        : !risk?.latestAssessment?.residualRating
          ? "Assess residual risk before submitting acceptance."
          : !eligiblePlans.length
            ? "Create an eligible treatment plan before submitting acceptance."
            : null;
  const userLabel = (userId: string | null) => {
    if (!userId) return "Not recorded";
    const known = [
      risk?.owner,
      risk?.createdBy,
      risk?.latestAssessment?.assessedBy,
      ...(risk?.treatmentPlans.map((plan) => plan.owner) ?? []),
    ].find((person) => person?.id === userId);
    return known?.fullName ?? `User ID: ${userId}`;
  };
  return (
    <Dialog
      dialogRef={ref}
      title={risk ? `${risk.riskCode} — ${risk.title}` : "Risk details"}
      className="max-h-[calc(100dvh-2rem)] w-[min(70rem,calc(100%-2rem))] overflow-y-auto"
      onClose={onClose}
    >
      {detail.isPending ? (
        <p className="text-muted py-12 text-center">Loading risk details…</p>
      ) : detail.isError ? (
        <Alert className="border-danger/25 bg-danger-soft text-danger">
          Unable to load this risk record.
          <Button
            variant="secondary"
            className="mt-3"
            onClick={() => void detail.refetch()}
          >
            Try again
          </Button>
        </Alert>
      ) : risk ? (
        <div className="space-y-6">
          <p className="text-muted text-sm leading-6">
            {risk.description ?? "No description provided."}
          </p>
          <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Fact label="Status" value={title(risk.status)} />
            <Fact
              label="Risk scope"
              value={
                risk.scope?.type === "business_service"
                  ? `Business service — ${risk.scope.businessService.name} (${title(risk.scope.businessService.status)})`
                  : risk.scope?.type === "asset"
                    ? "Asset"
                    : "Not recorded for this legacy risk"
              }
            />
            <Fact
              label="Risk owner"
              value={risk.owner?.fullName ?? "Unassigned"}
            />
            <Fact label="Review date" value={format(risk.reviewDate)} />
            <Fact label="Last updated" value={format(risk.updatedAt)} />
            <Fact label="Created at" value={format(risk.createdAt)} />
            <Fact
              label="Created by"
              value={risk.createdBy?.fullName ?? "Not recorded"}
            />
          </dl>
          {risk.status === "under_treatment" &&
          (!risk.latestAssessment ||
            !risk.treatmentPlans.some((plan) => plan.status === "active")) ? (
            <Alert>
              Risk status is Under treatment, but its assessment or active
              treatment plan is missing. Review the source record; no status has
              been changed automatically.
            </Alert>
          ) : null}
          <section>
            <h3 className="font-semibold">Latest assessment</h3>
            {risk.vulnerabilityWorkflow?.assessmentReviewRequired ? (
              <Alert className="mt-3">
                Risk context changed or has not been assessed. Existing ratings
                are historical and may not reflect the latest vulnerabilities.
                Review inherent and residual risk before submitting acceptance.
              </Alert>
            ) : null}
            {risk.latestAssessment ? (
              <dl className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Fact
                  label="Inherent rating"
                  value={
                    risk.latestAssessment.inherentRating
                      ? title(risk.latestAssessment.inherentRating)
                      : "Not rated"
                  }
                />
                <Fact
                  label="Residual rating"
                  value={
                    risk.latestAssessment.residualRating
                      ? title(risk.latestAssessment.residualRating)
                      : "Not rated"
                  }
                />
                <Fact
                  label="Target risk"
                  value={
                    risk.latestAssessment.targetRisk
                      ? title(risk.latestAssessment.targetRisk)
                      : "Not defined"
                  }
                />
                <Fact
                  label="Control effectiveness"
                  value={
                    risk.latestAssessment.controlEffectiveness === null
                      ? "Not measured"
                      : `${risk.latestAssessment.controlEffectiveness}%`
                  }
                />
                <Fact
                  label="Assessed by"
                  value={
                    risk.latestAssessment.assessedBy?.fullName ?? "Unknown"
                  }
                />
                <Fact
                  label="Inherent likelihood / impact"
                  value={`${risk.latestAssessment.inherentLikelihood ?? "—"} / ${risk.latestAssessment.inherentImpact ?? "—"}`}
                />
                <Fact
                  label="Residual likelihood / impact"
                  value={`${risk.latestAssessment.residualLikelihood ?? "—"} / ${risk.latestAssessment.residualImpact ?? "—"}`}
                />
                <Fact
                  label="Assessed at"
                  value={format(risk.latestAssessment.assessedAt)}
                />
                <Fact
                  label="Assessment type"
                  value={title(risk.latestAssessment.type)}
                />
                <Fact
                  label="Risk appetite"
                  value={
                    risk.latestAssessment.riskAppetite
                      ? title(risk.latestAssessment.riskAppetite)
                      : "Not defined"
                  }
                />
                <Fact
                  label="Risk tolerance"
                  value={
                    risk.latestAssessment.riskTolerance
                      ? title(risk.latestAssessment.riskTolerance)
                      : "Not defined"
                  }
                />
                <Fact
                  label="Assessment basis"
                  value={risk.latestAssessment.reason ?? "Not recorded"}
                />
              </dl>
            ) : (
              <p className="text-muted mt-2 text-sm">
                No assessment has been recorded.
              </p>
            )}
          </section>
          {risk.assessments.length > 1 ? (
            <Collection
              heading="Assessment history"
              empty="No previous assessments."
              items={risk.assessments.slice(1).map((item) => ({
                key: item.id,
                heading: `${title(item.type)} — ${format(item.assessedAt)}`,
                detail: `Inherent: ${item.inherentRating ? title(item.inherentRating) : "not rated"} · Residual: ${item.residualRating ? title(item.residualRating) : "not rated"} · Target: ${item.targetRisk ? title(item.targetRisk) : "not defined"}`,
              }))}
            />
          ) : null}
          {risk.scope?.type === "business_service" ? (
            <p className="text-muted text-sm">
              Linked assets are the recorded risk scope, not the service&apos;s
              current asset list. Service membership changes require a scope
              review; they do not automatically change this risk.
            </p>
          ) : null}
          <Collection
            heading="Related assets"
            empty="No assets linked."
            items={risk.assets.map((item) => ({
              key: item.id,
              heading: `${item.code} — ${item.name}`,
              detail: `${title(item.status)} · Criticality: ${item.criticality ? title(item.criticality) : "Not classified"}`,
            }))}
          />
          <div className="grid gap-6 lg:grid-cols-2">
            <Collection
              heading="Controls"
              empty="No controls linked."
              items={risk.controls.map((item) => ({
                key: item.id,
                heading: `${item.code} — ${item.name}`,
                detail: `${title(item.applicability)} · ${title(item.implementationStatus)}\nEffectiveness: ${item.latestEffectiveness === null ? "Not measured" : `${item.latestEffectiveness}%`} · Result: ${item.latestResult ? title(item.latestResult) : "Not assessed"}`,
              }))}
            />
            <section>
              <h3 className="font-semibold">Treatment plans</h3>
              {!risk.treatmentPlans.length ? (
                <p className="text-muted mt-2 text-sm">
                  No treatment plans linked.
                </p>
              ) : (
                risk.treatmentPlans.map((plan) => (
                  <article
                    key={plan.id}
                    className="border-border mt-3 min-w-0 space-y-3 rounded-lg border p-3"
                  >
                    <h4 className="text-sm font-semibold break-words">
                      {plan.title}
                    </h4>
                    <p className="text-muted text-sm">
                      {title(plan.strategy)} · {title(plan.status)} ·{" "}
                      {plan.progress}% complete · Due{" "}
                      {format(plan.targetCompletionDate)}
                    </p>
                    <p className="text-sm">
                      Responsible owner: {plan.owner?.fullName ?? "Unassigned"}
                    </p>
                    <details>
                      <summary className="cursor-pointer text-sm font-medium">
                        Treatment actions ({plan.actionCount})
                      </summary>
                      {!plan.actions.length ? (
                        <p className="text-muted mt-2 text-sm">
                          No actions recorded.
                        </p>
                      ) : (
                        <ul className="mt-2 space-y-3">
                          {plan.actions.map((action) => (
                            <li
                              key={action.id}
                              className="border-border border-t pt-2 text-sm"
                            >
                              <p className="font-medium break-words">
                                {action.title}
                              </p>
                              <p className="text-muted break-words">
                                {title(action.status)} · Due{" "}
                                {format(action.dueDate)} · Assigned to:{" "}
                                {userLabel(action.assignedToUserId)}
                              </p>
                            </li>
                          ))}
                        </ul>
                      )}
                    </details>
                    {["draft", "active"].includes(plan.status) &&
                    (isOfficer || isOwner) &&
                    !terminalRisk ? (
                      <Button
                        variant="secondary"
                        onClick={() => setEditingPlan(plan)}
                      >
                        <Pencil aria-hidden="true" className="size-4" />
                        Update {plan.title}
                      </Button>
                    ) : (
                      <p className="text-muted text-xs">Read-only</p>
                    )}
                  </article>
                ))
              )}
            </section>
          </div>
          <Collection
            heading="Linked incidents"
            empty="No incidents linked."
            items={risk.incidents.map((item) => ({
              key: item.id,
              heading: `${item.code} — ${item.title}`,
              detail: `${title(item.severity)} · ${title(item.status)} · ${format(item.createdAt)}`,
            }))}
          />
          <section>
            <h3 className="font-semibold">Risk acceptance</h3>
            {!risk.acceptances.length ? (
              <p className="text-muted mt-2 text-sm">
                No risk acceptance requests recorded.
              </p>
            ) : null}
            <div className="mt-3 space-y-2">
              {risk.acceptances.map((item) => (
                <div
                  key={item.id}
                  className="border-border flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
                >
                  <div>
                    <strong className="capitalize">{item.decision}</strong>
                    <p className="text-muted text-sm">
                      Requested {format(item.requestedAt)} · valid until{" "}
                      {format(item.validUntil)}
                    </p>
                    <p className="text-sm break-words whitespace-pre-wrap">
                      Recorded reason: {item.reason ?? "Not recorded"}
                    </p>
                    <p className="text-muted text-xs break-words">
                      Requested by: {userLabel(item.requestedBy)} · Decided by:{" "}
                      {userLabel(item.decidedBy)} · Decided at:{" "}
                      {format(item.decidedAt)}
                    </p>
                  </div>
                  {item.decision === "pending" &&
                  item.requestedBy !== session.data?.id &&
                  !terminalRisk &&
                  session.data?.roles.some((role) =>
                    ["SECURITY_OFFICER", "EXECUTIVE"].includes(role.code),
                  ) ? (
                    <Button onClick={() => setDecidingAcceptance(item.id)}>
                      <ClipboardCheck aria-hidden="true" className="size-4" />
                      Review decision
                    </Button>
                  ) : null}
                </div>
              ))}
            </div>
            {isOwner &&
            !risk.acceptances.some((item) => item.decision === "pending") ? (
              <div>
                {acceptanceBlocked ? (
                  <p className="text-muted mt-3 text-sm">{acceptanceBlocked}</p>
                ) : null}
                <Button
                  className="mt-3"
                  onClick={() => setAccepting(true)}
                  disabled={Boolean(acceptanceBlocked)}
                >
                  <Send aria-hidden="true" className="size-4" />
                  Review and submit acceptance
                </Button>
              </div>
            ) : null}
          </section>
          <div className="grid gap-6 lg:grid-cols-2">
            <Collection
              heading="Threats"
              empty="No threats recorded."
              items={risk.threats.map((item) => ({
                key: item.id,
                heading: item.name,
                detail: `${item.description ?? "No description recorded."}\nRelated vulnerabilities: ${item.vulnerabilities.map((vulnerability) => vulnerability.name).join(", ") || "None linked"}`,
              }))}
            />
            <Collection
              heading="Vulnerabilities"
              empty="No vulnerabilities recorded."
              items={risk.vulnerabilities.map((item) => ({
                key: item.id,
                heading: item.name,
                detail: `${item.description ?? "No description recorded."}\nRelated controls: ${item.controls.map((control) => `${control.code} — ${control.name}`).join(", ") || "None linked"}`,
              }))}
            />
          </div>
        </div>
      ) : null}
      <div className="mt-6 flex justify-end">
        <Button variant="secondary" onClick={() => ref.current?.close()}>
          <X aria-hidden="true" className="size-4" />
          Close
        </Button>
      </div>
      {editingPlan ? (
        <UpdateRiskTreatmentPlanDialog
          key={editingPlan.id}
          plan={editingPlan}
          onClose={() => setEditingPlan(null)}
        />
      ) : null}
      {accepting && risk ? (
        <SubmitRiskAcceptanceDialog
          risk={risk}
          onClose={() => setAccepting(false)}
        />
      ) : null}
      {decidingAcceptance ? (
        <DecideRiskAcceptanceDialog
          acceptanceId={decidingAcceptance}
          onClose={() => setDecidingAcceptance(null)}
        />
      ) : null}
    </Dialog>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-border rounded-lg border p-3">
      <dt className="text-muted text-xs font-medium tracking-wide uppercase">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium break-words whitespace-pre-wrap">
        {value}
      </dd>
    </div>
  );
}
function Collection({
  heading,
  empty,
  items,
}: {
  heading: string;
  empty: string;
  items: { key: string; heading: string; detail: string | null }[];
}) {
  return (
    <section>
      <h3 className="font-semibold">{heading}</h3>
      {items.length ? (
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {items.map((item) => (
            <li className="border-border rounded-lg border p-3" key={item.key}>
              <p className="text-sm font-medium">{item.heading}</p>
              {item.detail ? (
                <p className="text-muted mt-1 text-xs leading-5 break-words whitespace-pre-wrap">
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
