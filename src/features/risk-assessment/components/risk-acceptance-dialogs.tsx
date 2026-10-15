"use client";
import { useEffect, useRef, useState } from "react";
import { useToast } from "@/components/feedback/toast";
import { ApiError } from "@/lib/api/api-error";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { RiskRegisterDetail } from "../schemas/risk-register-schema";
import {
  decideRiskAcceptanceSchema,
  submitRiskAcceptanceSchema,
  openRiskReviewSchema,
} from "../schemas/risk-acceptance-schema";
import {
  useDecideRiskAcceptance,
  useSubmitRiskAcceptance,
  useOpenRiskAcceptanceReview,
} from "../hooks/use-risk-acceptance";
type Risk = RiskRegisterDetail;
const acceptanceExpired = (value: string) =>
  new Date(`${value}T23:59:59.999Z`).getTime() <= Date.now();
export function SubmitRiskAcceptanceDialog({
  risk,
  onClose,
}: {
  risk: Risk;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const toast = useToast();
  const mutation = useSubmitRiskAcceptance(risk.id);
  const residual = risk.assessments.find(
    (item) => item.type !== "target_definition" && item.residualRating,
  );
  const target = risk.assessments.find((item) => item.targetRisk)?.targetRisk;
  const eligiblePlans = risk.treatmentPlans.filter((plan) =>
    ["draft", "active", "completed"].includes(plan.status),
  );
  const preferredPlan =
    eligiblePlans.find(
      (plan) => plan.status === "active" || plan.status === "draft",
    ) ?? eligiblePlans[0];
  const [likelihood, setLikelihood] = useState(
    String(residual?.residualLikelihood ?? ""),
  );
  const [impact, setImpact] = useState(String(residual?.residualImpact ?? ""));
  const [assessmentReason, setAssessmentReason] = useState("");
  const [planId, setPlanId] = useState(preferredPlan?.id ?? "");
  const selectedPlan = eligiblePlans.find((plan) => plan.id === planId);
  const [validUntil, setValidUntil] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  useEffect(() => ref.current?.showModal(), []);
  const submit = async () => {
    if (
      ["accepted", "closed", "archived"].includes(risk.status) ||
      risk.vulnerabilityWorkflow?.assessmentReviewRequired ||
      risk.acceptances.some((item) => item.decision === "pending") ||
      !residual?.residualRating ||
      !risk.acceptanceWorkflow?.canSubmit ||
      !selectedPlan
    )
      return setError(
        "Refresh the risk and complete the residual assessment and eligible plan before submitting.",
      );
    if (acceptanceExpired(validUntil))
      return setError("Acceptance validity must be in the future.");
    const parsed = submitRiskAcceptanceSchema.safeParse({
      residualLikelihood: likelihood,
      residualImpact: impact,
      assessmentReason,
      treatmentPlanId: planId,
      validUntil,
      acceptanceReason: reason,
    });
    if (!parsed.success)
      return setError(parsed.error.issues[0]?.message ?? "Check the request.");
    try {
      await mutation.mutateAsync(parsed.data);
      toast.success(
        "Acceptance submitted",
        "An authorized approver can now review the decision.",
      );
      onClose();
    } catch (e) {
      if (e instanceof ApiError && [403, 409].includes(e.status)) {
        toast.warning(
          "Risk changed or access denied",
          "The risk was refreshed. Reopen the request after reviewing the latest state.",
        );
        onClose();
        return;
      }
      setError(e instanceof Error ? e.message : "Unable to submit acceptance.");
    }
  };
  const score = Number(likelihood) * Number(impact);
  const validScore =
    Number(likelihood) >= 1 &&
    Number(likelihood) <= 5 &&
    Number(impact) >= 1 &&
    Number(impact) <= 5;
  const rating =
    score <= 4
      ? "low"
      : score <= 9
        ? "medium"
        : score <= 16
          ? "high"
          : "critical";
  const ranks = { low: 1, medium: 2, high: 3, critical: 4 } as const;
  const outsideThreshold =
    validScore &&
    Boolean(
      (residual?.riskTolerance &&
        ranks[rating] > ranks[residual.riskTolerance]) ||
      (residual?.riskAppetite && ranks[rating] > ranks[residual.riskAppetite]),
    );
  return (
    <Dialog
      title="Review, Reassess and Accept Risk"
      dialogRef={ref}
      onClose={onClose}
      className="max-h-[calc(100dvh-2rem)] w-[min(46rem,calc(100%-2rem))] overflow-y-auto"
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        {error ? <Alert className="text-danger">{error}</Alert> : null}
        <p className="text-muted text-sm">
          Submitting creates a pending request, not an approval. The requester
          cannot approve their own request.
        </p>
        <p className="text-sm">
          Current residual: {residual?.residualRating ?? "Not assessed"} ·
          Target: {target ?? "Not defined"} · Appetite:{" "}
          {residual?.riskAppetite ?? "Not defined"} · Tolerance:{" "}
          {residual?.riskTolerance ?? "Not defined"}
        </p>
        {!risk.acceptanceWorkflow?.canSubmit ? (
          <Alert>
            {risk.acceptanceWorkflow?.blockedReason ??
              "Refresh the Risk to check acceptance eligibility."}
          </Alert>
        ) : null}
        {validScore ? (
          <p className="text-sm">
            Proposed residual: {score} — {rating}
          </p>
        ) : null}
        {outsideThreshold ? (
          <Alert className="border-warning/30 bg-warning-soft text-warning">
            The proposed residual exceeds appetite or tolerance. Explain the
            exception in your justification; an authorized approver must review
            it.
          </Alert>
        ) : null}
        {!residual?.riskAppetite || !residual?.riskTolerance ? (
          <p className="text-muted text-sm">
            One or more thresholds are not defined; compliance with
            appetite/tolerance cannot be confirmed.
          </p>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium">
            Residual likelihood (1–5)
            <Input
              className="mt-1"
              type="number"
              min="1"
              max="5"
              value={likelihood}
              onChange={(e) => setLikelihood(e.target.value)}
            />
          </label>
          <label className="text-sm font-medium">
            Residual impact (1–5)
            <Input
              className="mt-1"
              type="number"
              min="1"
              max="5"
              value={impact}
              onChange={(e) => setImpact(e.target.value)}
            />
          </label>
        </div>
        <label className="block text-sm font-medium">
          Reassessment rationale
          <Textarea
            className="mt-1"
            value={assessmentReason}
            onChange={(e) => setAssessmentReason(e.target.value)}
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium">
            Treatment plan
            <Select
              className="mt-1"
              value={planId}
              onChange={(e) => setPlanId(e.target.value)}
            >
              <option value="">Select plan</option>
              {eligiblePlans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} — {p.status}
                </option>
              ))}
            </Select>
          </label>
          <div className="text-sm">
            <p className="font-medium">Plan status</p>
            <p className="mt-1 capitalize">
              {selectedPlan?.status ?? "Select a plan"}
            </p>
            <p className="text-muted mt-1">
              Read-only here. Update the treatment plan separately.
            </p>
          </div>
          <label className="text-sm font-medium">
            Acceptance valid until (UTC date)
            <Input
              className="mt-1"
              type="date"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
            />
          </label>
        </div>
        <label className="block text-sm font-medium">
          Acceptance justification
          <Textarea
            className="mt-1"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </label>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={
              mutation.isPending ||
              !risk.acceptanceWorkflow?.canSubmit ||
              risk.vulnerabilityWorkflow?.assessmentReviewRequired ||
              ["accepted", "closed", "archived"].includes(risk.status)
            }
          >
            Submit for approval
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
export function DecideRiskAcceptanceDialog({
  acceptanceId,
  onClose,
  expired = false,
  approvalBlockedReason = null,
}: {
  acceptanceId: string;
  onClose: () => void;
  expired?: boolean;
  approvalBlockedReason?: string | null;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const toast = useToast();
  const mutation = useDecideRiskAcceptance(acceptanceId);
  const approvalBlocked = expired || Boolean(approvalBlockedReason);
  const [decision, setDecision] = useState(
    approvalBlocked ? "rejected" : "approved",
  );
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  useEffect(() => ref.current?.showModal(), []);
  const submit = async () => {
    const parsed = decideRiskAcceptanceSchema.safeParse({ decision, reason });
    if (!parsed.success)
      return setError(
        parsed.error.issues[0]?.message ?? "Enter a decision rationale.",
      );
    try {
      await mutation.mutateAsync(parsed.data);
      toast.success(
        "Acceptance decision recorded",
        decision === "approved"
          ? "The risk is now accepted."
          : "The request was returned to the Risk Owner.",
      );
      onClose();
    } catch (e) {
      if (e instanceof ApiError && [403, 409].includes(e.status)) {
        toast.warning(
          "Decision is no longer available",
          "The risk was refreshed. Review the latest request state.",
        );
        onClose();
        return;
      }
      setError(e instanceof Error ? e.message : "Unable to record decision.");
    }
  };
  return (
    <Dialog title="Risk Acceptance Decision" dialogRef={ref} onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        {error ? <Alert className="text-danger">{error}</Alert> : null}
        {approvalBlocked ? (
          <Alert>
            {approvalBlockedReason ??
              "This request has expired. Approval is unavailable; reject it so the Owner can reassess and submit a new request."}
          </Alert>
        ) : null}
        <label className="block text-sm font-medium">
          Decision
          <Select
            className="mt-1"
            value={decision}
            onChange={(e) => setDecision(e.target.value)}
          >
            <option value="approved" disabled={approvalBlocked}>
              Approve
            </option>
            <option value="rejected">Reject</option>
          </Select>
        </label>
        <label className="block text-sm font-medium">
          Decision rationale
          <Textarea
            className="mt-1"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </label>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={
              mutation.isPending || (approvalBlocked && decision === "approved")
            }
          >
            Record decision
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

export function OpenRiskReviewDialog({
  risk,
  onClose,
}: {
  risk: Risk;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const mutation = useOpenRiskAcceptanceReview(risk.id);
  const toast = useToast();
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  useEffect(() => ref.current?.showModal(), []);
  const submit = async () => {
    const parsed = openRiskReviewSchema.safeParse({
      reason,
      expectedUpdatedAt: risk.updatedAt,
    });
    if (!parsed.success) {
      setError(
        parsed.error.issues[0]?.message ?? "Explain why review is needed.",
      );
      return;
    }
    try {
      await mutation.mutateAsync(parsed.data);
      toast.success(
        "Risk review opened",
        "Reassess residual risk before submitting a new acceptance. Previous decisions remain in history.",
      );
      onClose();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to open review. Refresh the Risk and try again.",
      );
    }
  };
  return (
    <Dialog title="Open Risk Review" dialogRef={ref} onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <p className="text-muted text-sm">
          This reopens the same Risk for assessment. It does not extend or
          delete previous acceptance decisions.
        </p>
        {error ? <Alert className="text-danger">{error}</Alert> : null}
        <label className="block text-sm font-medium">
          Review rationale
          <Textarea
            className="mt-1"
            value={reason}
            maxLength={2000}
            onChange={(event) => setReason(event.target.value)}
          />
        </label>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={
              mutation.isPending || !risk.acceptanceWorkflow?.canOpenReview
            }
          >
            {mutation.isPending ? "Opening…" : "Open review"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
