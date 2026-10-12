"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Gauge, History } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Pagination } from "@/components/data-display/pagination";
import { StatusBadge } from "@/components/data-display/static-product";
import { FormField } from "@/components/forms/form-field";
import { useToast } from "@/components/feedback/toast";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAssessInherentRisk } from "../hooks/use-assess-inherent-risk";
import { useRiskRecord } from "../hooks/use-risk-register";
import {
  assessInherentRiskSchema,
  type AssessInherentRiskInput,
} from "../schemas/assess-inherent-risk-schema";

const rating = (score: number) =>
  score <= 4
    ? "Low"
    : score <= 9
      ? "Medium"
      : score <= 16
        ? "High"
        : "Critical";
export function AssessInherentRiskDialog({
  riskId,
  riskLabel,
  onClose,
}: {
  riskId: string | null;
  riskLabel: string;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [message, setMessage] = useState<string>();
  const [tab, setTab] = useState<"assess" | "history">("assess");
  const [historyPage, setHistoryPage] = useState(1);
  const risk = useRiskRecord(riskId);
  const mutation = useAssessInherentRisk(riskId);
  const toast = useToast();
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<AssessInherentRiskInput>({
    resolver: zodResolver(assessInherentRiskSchema),
    defaultValues: { likelihood: 3, impact: 3, assessmentReason: "" },
  });
  const [likelihood, impact] = useWatch({
    control,
    name: ["likelihood", "impact"],
  });
  const score = Number(likelihood) * Number(impact);
  const historyPageSize = 5;
  const inherentHistory = useMemo(
    () =>
      (risk.data?.assessments ?? []).filter(
        (assessment) =>
          assessment.inherentLikelihood !== null &&
          assessment.inherentImpact !== null &&
          assessment.inherentRating !== null &&
          assessment.residualLikelihood === null &&
          assessment.residualImpact === null &&
          assessment.residualRating === null,
      ),
    [risk.data?.assessments],
  );
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (riskId && !dialog.open) dialog.showModal();
    if (!riskId && dialog.open) dialog.close();
  }, [riskId]);
  const close = () => {
    reset();
    setMessage(undefined);
    setTab("assess");
    setHistoryPage(1);
    onClose();
  };
  const submit = async (input: AssessInherentRiskInput) => {
    try {
      const result = await mutation.mutateAsync(input);
      close();
      toast.success(
        "Inherent risk assessed",
        `${result.riskCode}: ${result.score} (${result.rating}).`,
      );
    } catch (error: unknown) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to assess inherent risk.",
      );
    }
  };
  const contextComplete = Boolean(
    risk.data?.assets.length &&
    risk.data.threats.length &&
    risk.data.vulnerabilities.length,
  );
  return (
    <Dialog
      title="Assess Inherent Risk"
      dialogRef={ref}
      onClose={close}
      className="max-h-[calc(100dvh-2rem)] w-[min(44rem,calc(100%-2rem))] overflow-y-auto"
    >
      <div
        className="border-border bg-surface mb-4 inline-flex w-full gap-1 rounded-xl border p-1 shadow-xs sm:w-auto"
        role="tablist"
        aria-label="Inherent risk assessment views"
      >
        <button
          id="inherent-assess-tab"
          type="button"
          role="tab"
          aria-selected={tab === "assess"}
          aria-controls="inherent-assess-panel"
          tabIndex={tab === "assess" ? 0 : -1}
          className={`min-h-10 flex-1 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors sm:flex-none ${tab === "assess" ? "bg-brand text-brand-contrast font-semibold shadow-xs" : "text-muted hover:bg-neutral-soft hover:text-foreground"}`}
          onClick={() => setTab("assess")}
        >
          Assess inherent risk
        </button>
        <button
          id="inherent-history-tab"
          type="button"
          role="tab"
          aria-selected={tab === "history"}
          aria-controls="inherent-history-panel"
          tabIndex={tab === "history" ? 0 : -1}
          className={`inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors sm:flex-none ${tab === "history" ? "bg-brand text-brand-contrast font-semibold shadow-xs" : "text-muted hover:bg-neutral-soft hover:text-foreground"}`}
          onClick={() => setTab("history")}
        >
          <History className="size-4" aria-hidden="true" />
          History ({inherentHistory.length})
        </button>
      </div>
      {tab === "history" ? (
        <section
          id="inherent-history-panel"
          role="tabpanel"
          aria-labelledby="inherent-history-tab"
          className="space-y-3"
        >
          <p className="text-muted text-sm">
            Previous inherent-risk assessments are read-only. Saving a new
            assessment creates a new history record.
          </p>
          {inherentHistory.length ? (
            inherentHistory
              .slice(
                (historyPage - 1) * historyPageSize,
                historyPage * historyPageSize,
              )
              .map((assessment) => (
                <article
                  key={assessment.id}
                  className="border-border rounded-lg border p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">
                        {assessment.inherentLikelihood} ×{" "}
                        {assessment.inherentImpact} ={" "}
                        {(assessment.inherentLikelihood ?? 0) *
                          (assessment.inherentImpact ?? 0)}
                      </p>
                      <p className="text-muted text-sm">
                        {new Intl.DateTimeFormat("en-GB", {
                          timeZone: "Asia/Bangkok",
                          dateStyle: "medium",
                          timeStyle: "short",
                        }).format(new Date(assessment.assessedAt))} {" "}
                        (UTC+7)
                      </p>
                    </div>
                    <StatusBadge
                      tone={
                        assessment.inherentRating === "low"
                          ? "success"
                          : assessment.inherentRating === "medium"
                            ? "info"
                            : assessment.inherentRating === "high"
                              ? "warning"
                              : "danger"
                      }
                    >
                      {assessment.inherentRating?.replace(/^./, (letter) =>
                        letter.toUpperCase(),
                      )}
                    </StatusBadge>
                  </div>
                  <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-muted">Assessed by</dt>
                      <dd>
                        {assessment.assessedBy?.fullName ?? "Unknown assessor"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted">Assessment type</dt>
                      <dd>{assessment.type.replaceAll("_", " ")}</dd>
                    </div>
                  </dl>
                  <div className="mt-3 text-sm">
                    <p className="text-muted">Assessment basis</p>
                    <p className="whitespace-pre-wrap">
                      {assessment.reason ?? "No basis recorded."}
                    </p>
                  </div>
                </article>
              ))
          ) : (
            <div className="border-border rounded-lg border border-dashed p-6 text-center">
              <p className="font-medium">No inherent risk history</p>
              <p className="text-muted mt-1 text-sm">
                The first saved inherent assessment will appear here.
              </p>
            </div>
          )}
          {inherentHistory.length ? (
            <Pagination
              page={historyPage}
              pageCount={Math.ceil(inherentHistory.length / historyPageSize)}
              onPageChange={setHistoryPage}
            />
          ) : null}
          <div className="flex justify-end border-t border-border pt-4">
            <Button type="button" variant="secondary" onClick={close}>
              Close
            </Button>
          </div>
        </section>
      ) : (
      <form id="inherent-assess-panel" role="tabpanel" aria-labelledby="inherent-assess-tab" className="space-y-5" noValidate onSubmit={handleSubmit(submit)}>
        <p className="text-muted text-sm">
          Assess exposure before considering existing security-control
          effectiveness for{" "}
          <strong className="text-foreground">{riskLabel}</strong>.
        </p>
        {message ? (
          <Alert className="border-danger/25 bg-danger-soft text-danger">
            {message}
          </Alert>
        ) : null}
        {risk.isError ? <Alert>Unable to load the risk context.</Alert> : null}
        {risk.data ? (
          <section className="border-border grid gap-3 rounded-lg border p-4 sm:grid-cols-3">
            <div>
              <p className="text-muted text-xs font-medium uppercase">
                Assets / criticality
              </p>
              <p className="mt-1 text-sm">
                {risk.data.assets
                  .map((item) => `${item.name} (${item.criticality ?? "—"})`)
                  .join(", ") || "None"}
              </p>
            </div>
            <div>
              <p className="text-muted text-xs font-medium uppercase">
                Threats
              </p>
              <p className="mt-1 text-sm">
                {risk.data.threats.map((item) => item.name).join(", ") ||
                  "None"}
              </p>
            </div>
            <div>
              <p className="text-muted text-xs font-medium uppercase">
                Vulnerabilities
              </p>
              <p className="mt-1 text-sm">
                {risk.data.vulnerabilities
                  .map((item) => item.name)
                  .join(", ") || "None"}
              </p>
            </div>
          </section>
        ) : null}
        {risk.data && !contextComplete ? (
          <Alert>
            Document at least one asset, threat, and vulnerability before
            assessing inherent risk.
          </Alert>
        ) : null}
        <fieldset
          className="space-y-4"
          disabled={mutation.isPending || !contextComplete}
        >
          <legend className="sr-only">Inherent risk values</legend>
          <div className="grid gap-4 sm:grid-cols-[1fr_1fr_12rem]">
            <FormField id="inherentLikelihood" label="Likelihood (1–5)">
              <Select id="inherentLikelihood" {...register("likelihood", { valueAsNumber: true })}>
                {[1, 2, 3, 4, 5].map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField id="inherentImpact" label="Potential impact (1–5)">
              <Select id="inherentImpact" {...register("impact", { valueAsNumber: true })}>
                {[1, 2, 3, 4, 5].map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </Select>
            </FormField>
            <div className="bg-neutral-soft rounded-lg p-3">
              <p className="text-muted text-xs font-medium uppercase">
                Calculated rating
              </p>
              <p className="mt-1 text-lg font-semibold tabular-nums">
                {score} — {rating(score)}
              </p>
            </div>
          </div>
          <FormField
            id="inherentReason"
            label="Assessment basis"
            error={errors.assessmentReason?.message}
          >
            <Textarea
              id="inherentReason"
              rows={4}
              maxLength={3000}
              {...register("assessmentReason")}
            />
          </FormField>
        </fieldset>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={close}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={mutation.isPending || risk.isPending || !contextComplete}
          >
            <Gauge className="size-4" aria-hidden="true" />
            {mutation.isPending ? "Saving…" : "Save assessment"}
          </Button>
        </div>
      </form>
      )}
    </Dialog>
  );
}
