"use client";
import { useEffect, useRef, useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/feedback/toast";
import { useCompleteRiskReview } from "../hooks/use-complete-risk-review";
import { completeRiskReviewSchema } from "../schemas/complete-risk-review-schema";
import type { RiskRegisterDetail } from "../schemas/risk-register-schema";
import { recommendedReviewDate } from "../lib/review-cycle";
import { riskToday, nextRiskReviewDate, reviewDatePreview } from "../schemas/risk-review-date";

export function CompleteRiskReviewDialog({ risk: initialRisk, onClose }: { risk: RiskRegisterDetail; onClose: () => void }) {
  const [risk] = useState(initialRisk);
  const ref = useRef<HTMLDialogElement>(null);
  const mutation = useCompleteRiskReview(risk.id);
  const toast = useToast();
  const latest = risk.assessments.find((item) => item.type !== "target_definition");
  const maximum = latest?.residualRating ? recommendedReviewDate(riskToday(), latest.residualRating) : null;
  const [date, setDate] = useState(maximum ?? "");
  const [conclusion, setConclusion] = useState("");
  const [error, setError] = useState("");
  useEffect(() => { ref.current?.showModal(); }, []);
  const fresh = Boolean(latest?.residualRating && risk.currentReview && new Date(latest.assessedAt) > new Date(risk.currentReview.openedAt));
  const submit = async () => {
    const parsed = completeRiskReviewSchema.safeParse({ conclusion, nextReviewDate: date, expectedUpdatedAt: risk.updatedAt,
      expectedOpenedAt: risk.currentReview?.openedAt, assessmentId: latest?.id });
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "Check review details."); return; }
    if (!maximum || date <= riskToday() || date > maximum) { setError("Select a future date no later than the recommended review date."); return; }
    try {
      await mutation.mutateAsync(parsed.data);
      toast.success("Risk review completed", `Next review: ${reviewDatePreview(date)}. Risk status is unchanged.`);
      onClose();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to complete review. Refresh and try again."); }
  };
  return <Dialog title="Complete Risk Review" dialogRef={ref} onClose={onClose}>
    <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); void submit(); }}>
      <p className="text-muted text-sm">Complete the review using a current residual assessment. This does not approve risk acceptance.</p>
      {!fresh ? <Alert>Assess residual risk after opening this review before completing it.</Alert> : null}
      {error ? <Alert className="text-danger">{error}</Alert> : null}
      <label className="block text-sm font-medium">Review conclusion<Textarea className="mt-1" value={conclusion} maxLength={2000} onChange={(event) => setConclusion(event.target.value)} /></label>
      <label className="block text-sm font-medium">Next review date<Input className="mt-1" type="date" value={date} min={nextRiskReviewDate()} max={maximum ?? undefined} onChange={(event) => setDate(event.target.value)} /></label>
      <p className="text-muted text-sm">Internal review cycle: Critical 1 month, High 3 months, Medium 6 months, Low 12 months. Vietnam time (UTC+7). {maximum ? `Recommended deadline: ${reviewDatePreview(maximum)}. Earlier dates are allowed.` : "Save a residual assessment first."}</p>
      <div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" disabled={!fresh || !risk.canCompleteReview || mutation.isPending}>{mutation.isPending ? "Completing…" : "Complete review"}</Button></div>
    </form>
  </Dialog>;
}
