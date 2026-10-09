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
} from "../schemas/risk-acceptance-schema";
import {
  useDecideRiskAcceptance,
  useSubmitRiskAcceptance,
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
  const eligiblePlans = risk.treatmentPlans.filter((plan) =>
    ["draft", "active", "completed"].includes(plan.status),
  );
  const preferredPlan =
    eligiblePlans.find(
      (plan) => plan.status === "active" || plan.status === "draft",
    ) ?? eligiblePlans[0];
  const [likelihood, setLikelihood] = useState(
    String(risk.latestAssessment?.residualLikelihood ?? ""),
  );
  const [impact, setImpact] = useState(
    String(risk.latestAssessment?.residualImpact ?? ""),
  );
  const [assessmentReason, setAssessmentReason] = useState("");
  const [planId, setPlanId] = useState(preferredPlan?.id ?? "");
  const selectedPlan = eligiblePlans.find((plan) => plan.id === planId);
  const planStatus = selectedPlan?.status ?? "";
  const [validUntil, setValidUntil] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  useEffect(() => ref.current?.showModal(), []);
  const submit = async () => {
    if (
      ["accepted", "closed", "archived"].includes(risk.status) ||
      risk.vulnerabilityWorkflow?.assessmentReviewRequired ||
      risk.acceptances.some((item) => item.decision === "pending") ||
      !risk.latestAssessment?.residualRating ||
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
      treatmentPlanStatus: planStatus,
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
          Current residual:{" "}
          {risk.latestAssessment?.residualRating ?? "Not assessed"} · Target:{" "}
          {risk.latestAssessment?.targetRisk ?? "Not defined"} · Appetite:{" "}
          {risk.latestAssessment?.riskAppetite ?? "Not defined"} · Tolerance:{" "}
          {risk.latestAssessment?.riskTolerance ?? "Not defined"}
        </p>
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
            Acceptance valid until
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
}: {
  acceptanceId: string;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const toast = useToast();
  const mutation = useDecideRiskAcceptance(acceptanceId);
  const [decision, setDecision] = useState("approved");
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
        <label className="block text-sm font-medium">
          Decision
          <Select
            className="mt-1"
            value={decision}
            onChange={(e) => setDecision(e.target.value)}
          >
            <option value="approved">Approve</option>
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
          <Button type="submit" disabled={mutation.isPending}>
            Record decision
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
