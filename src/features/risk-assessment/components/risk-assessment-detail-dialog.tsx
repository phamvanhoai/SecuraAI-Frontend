"use client";

import { useEffect, useRef, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useRiskRecord } from "../hooks/use-risk-register";
import type { RiskRegisterDetail } from "../schemas/risk-register-schema";
import { UpdateRiskTreatmentPlanDialog } from "./update-risk-treatment-plan-dialog";
import { useSessionUser } from "@/features/authentication-account";
import { DecideRiskAcceptanceDialog, SubmitRiskAcceptanceDialog } from "./risk-acceptance-dialogs";

const format = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(
        new Date(value),
      )
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
  const [decidingAcceptance, setDecidingAcceptance] = useState<string | null>(null);
  const [editingPlan, setEditingPlan] = useState<
    RiskRegisterDetail["treatmentPlans"][number] | null
  >(null);
  useEffect(() => {
    const dialog = ref.current;
    if (id && dialog && !dialog.open) dialog.showModal();
    if (!id && dialog?.open) dialog.close();
  }, [id]);
  const risk = detail.data;
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
        </Alert>
      ) : risk ? (
        <div className="space-y-6">
          <p className="text-muted text-sm leading-6">
            {risk.description ?? "No description provided."}
          </p>
          <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Fact label="Status" value={title(risk.status)} />
            <Fact label="Owner" value={risk.owner?.fullName ?? "Unassigned"} />
            <Fact label="Review date" value={format(risk.reviewDate)} />
            <Fact label="Last updated" value={format(risk.updatedAt)} />
          </dl>
          <section>
            <h3 className="font-semibold">Latest assessment</h3>
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
                  value={`${risk.latestAssessment.inherentLikelihood ?? "â€”"} / ${risk.latestAssessment.inherentImpact ?? "â€”"}`}
                />
                <Fact
                  label="Residual likelihood / impact"
                  value={`${risk.latestAssessment.residualLikelihood ?? "â€”"} / ${risk.latestAssessment.residualImpact ?? "â€”"}`}
                />
                <Fact
                  label="Assessed at"
                  value={format(risk.latestAssessment.assessedAt)}
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
                heading: `${title(item.type)} â€” ${format(item.assessedAt)}`,
                detail: `Inherent: ${item.inherentRating ? title(item.inherentRating) : "not rated"} Â· Residual: ${item.residualRating ? title(item.residualRating) : "not rated"} Â· Target: ${item.targetRisk ? title(item.targetRisk) : "not defined"}`,
              }))}
            />
          ) : null}
          <Collection
            heading="Related assets"
            empty="No assets linked."
            items={risk.assets.map((item) => ({
              key: item.id,
              heading: `${item.code} — ${item.name}`,
              detail: title(item.status),
            }))}
          />
          <div className="grid gap-6 lg:grid-cols-2">
            <Collection
              heading="Controls"
              empty="No controls linked."
              items={risk.controls.map((item) => ({
                key: item.id,
                heading: `${item.code} — ${item.name}`,
                detail: `${title(item.applicability)} · ${title(item.implementationStatus)}`,
              }))}
            />
            <Collection
              heading="Treatment plans"
              empty="No treatment plans linked."
              items={risk.treatmentPlans.map((item) => ({
                key: item.id,
                heading: item.title,
                detail: `${title(item.strategy)} · ${title(item.status)} · ${item.actionCount} actions · due ${format(item.targetCompletionDate)}`,
              }))}
            />
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
          {risk.treatmentPlans.length ? (
            <section>
              <h3 className="font-semibold">Update treatment plans</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {risk.treatmentPlans.map((plan) => (
                  <Button
                    key={plan.id}
                    variant="secondary"
                    onClick={() => setEditingPlan(plan)}
                  >
                    Update {plan.title}
                  </Button>
                ))}
              </div>
            </section>
          ) : null}
          <section><h3 className="font-semibold">Risk acceptance</h3><div className="mt-3 space-y-2">{risk.acceptances.map((item) => <div key={item.id} className="border-border flex items-center justify-between rounded-lg border p-3"><div><strong className="capitalize">{item.decision}</strong><p className="text-muted text-sm">Requested {format(item.requestedAt)} · valid until {format(item.validUntil)}</p></div>{item.decision === "pending" && session.data?.roles.some((role) => ["SECURITY_OFFICER", "EXECUTIVE"].includes(role.code)) ? <Button variant="secondary" onClick={() => setDecidingAcceptance(item.id)}>Review decision</Button> : null}</div>)}</div>{risk.owner?.id === session.data?.id && !risk.acceptances.some((item) => item.decision === "pending") ? <Button className="mt-3" variant="secondary" onClick={() => setAccepting(true)} disabled={!risk.treatmentPlans.length}>Review and submit acceptance</Button> : null}</section>
          <div className="grid gap-6 lg:grid-cols-2">
            <Collection
              heading="Threats"
              empty="No threats recorded."
              items={risk.threats.map((item) => ({
                key: item.id,
                heading: item.name,
                detail: item.description,
              }))}
            />
            <Collection
              heading="Vulnerabilities"
              empty="No vulnerabilities recorded."
              items={risk.vulnerabilities.map((item) => ({
                key: item.id,
                heading: item.name,
                detail: item.description,
              }))}
            />
          </div>
        </div>
      ) : null}
      <div className="mt-6 flex justify-end">
        <Button variant="secondary" onClick={() => ref.current?.close()}>
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
      {accepting && risk ? <SubmitRiskAcceptanceDialog risk={risk} onClose={() => setAccepting(false)} /> : null}
      {decidingAcceptance ? <DecideRiskAcceptanceDialog acceptanceId={decidingAcceptance} onClose={() => setDecidingAcceptance(null)} /> : null}
    </Dialog>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-border rounded-lg border p-3">
      <dt className="text-muted text-xs font-medium tracking-wide uppercase">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium">{value}</dd>
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
