"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { GaugeCircle, History } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pagination } from "@/components/data-display/pagination";
import { StatusBadge } from "@/components/data-display/static-product";
import { useForm, useWatch } from "react-hook-form";
import { FormField } from "@/components/forms/form-field";
import { useToast } from "@/components/feedback/toast";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAssessResidualRisk } from "../hooks/use-assess-residual-risk";
import { useRiskRecord } from "../hooks/use-risk-register";
import {
  assessResidualRiskSchema,
  type AssessResidualRiskInput,
} from "../schemas/assess-residual-risk-schema";
const levels = ["low", "medium", "high", "critical"] as const;
const rating = (score: number) =>
  score <= 4
    ? "Low"
    : score <= 9
      ? "Medium"
      : score <= 16
        ? "High"
        : "Critical";
export function AssessResidualRiskDialog({
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
  const mutation = useAssessResidualRisk(riskId);
  const toast = useToast();
  const history = useMemo(
    () =>
      (risk.data?.assessments ?? [])
        .filter(
          (item) =>
            item.residualLikelihood !== null &&
            item.residualImpact !== null &&
            item.residualRating !== null,
        )
        .toSorted(
          (a, b) => Date.parse(b.assessedAt) - Date.parse(a.assessedAt),
        ),
    [risk.data?.assessments],
  );
  const pageCount = Math.max(1, Math.ceil(history.length / 5));
  const currentPage = Math.min(historyPage, pageCount);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors },
  } = useForm<AssessResidualRiskInput>({
    resolver: zodResolver(assessResidualRiskSchema),
    defaultValues: {
      likelihood: 2,
      impact: 3,
      targetRisk: "low",
      riskAppetite: "medium",
      riskTolerance: "medium",
      assessmentReason: "",
    },
  });
  const [likelihood, impact] = useWatch({
    control,
    name: ["likelihood", "impact"],
  });
  const score = Number(likelihood) * Number(impact);
  const established = risk.data?.assessments.find(
    (item) => item.riskAppetite !== null && item.riskTolerance !== null,
  );
  useEffect(() => {
    if (established?.riskAppetite)
      setValue("riskAppetite", established.riskAppetite);
    if (established?.riskTolerance)
      setValue("riskTolerance", established.riskTolerance);
  }, [established?.riskAppetite, established?.riskTolerance, setValue]);
  const blocked = Boolean(
    risk.data &&
    (!["open", "under_treatment"].includes(risk.data.status) ||
      risk.data.acceptances.some((item) => item.decision === "pending")),
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
  const submit = async (input: AssessResidualRiskInput) => {
    try {
      const result = await mutation.mutateAsync(input);
      close();
      toast.success(
        "Residual risk assessed",
        `${result.riskCode}: ${result.score} (${result.rating}); ${result.withinTolerance ? "within" : "outside"} tolerance.`,
      );
    } catch (error: unknown) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to assess residual risk.",
      );
    }
  };
  const ready = Boolean(
    !blocked &&
    risk.data?.latestAssessment?.inherentRating &&
    risk.data.controls.length &&
    risk.data.controls.every((item) => item.latestEffectiveness !== null),
  );
  return (
    <Dialog
      title="Assess Residual Risk"
      dialogRef={ref}
      onClose={close}
      className="max-h-[calc(100dvh-2rem)] w-[min(46rem,calc(100%-2rem))] overflow-y-auto"
    >
      <div
        role="tablist"
        aria-label="Residual risk assessment views"
        className="border-border bg-surface mb-4 inline-flex w-full gap-1 rounded-xl border p-1 shadow-xs sm:w-auto"
        onKeyDown={(event) => {
          if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key))
            return;
          event.preventDefault();
          const next =
            event.key === "Home"
              ? "assess"
              : event.key === "End"
                ? "history"
                : tab === "assess"
                  ? "history"
                  : "assess";
          setTab(next);
          ref.current
            ?.querySelector<HTMLButtonElement>(`#residual-${next}-tab`)
            ?.focus();
        }}
      >
        {(["assess", "history"] as const).map((view) => (
          <button
            key={view}
            id={`residual-${view}-tab`}
            type="button"
            role="tab"
            aria-selected={tab === view}
            aria-controls={`residual-${view}-panel`}
            tabIndex={tab === view ? 0 : -1}
            className={`focus-visible:outline-brand inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors focus-visible:outline-2 sm:flex-none ${tab === view ? "bg-brand text-brand-contrast font-semibold shadow-xs" : "text-muted hover:bg-neutral-soft hover:text-foreground"}`}
            onClick={() => setTab(view)}
          >
            {view === "history" ? (
              <History className="size-4" aria-hidden="true" />
            ) : null}
            {view === "assess"
              ? "Assess residual risk"
              : `History (${history.length})`}
          </button>
        ))}
      </div>
      {tab === "history" ? (
        <section
          id="residual-history-panel"
          role="tabpanel"
          aria-labelledby="residual-history-tab"
          className="space-y-3"
        >
          <p className="text-muted text-sm">
            Read-only records containing residual risk values, including values
            carried forward by other Risk actions. Each record shows the values
            recorded at that time.
          </p>
          {risk.isPending ? (
            <p role="status" className="text-muted text-sm">
              Loading assessment history...
            </p>
          ) : risk.isError ? (
            <Alert>
              Unable to load assessment history.{" "}
              <Button
                type="button"
                variant="secondary"
                onClick={() => void risk.refetch()}
              >
                Try again
              </Button>
            </Alert>
          ) : history.length ? (
            history
              .slice((currentPage - 1) * 5, currentPage * 5)
              .map((item) => (
                <article
                  key={item.id}
                  className="border-border rounded-lg border p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold tabular-nums">
                        {item.residualLikelihood} × {item.residualImpact} ={" "}
                        {(item.residualLikelihood ?? 0) *
                          (item.residualImpact ?? 0)}
                      </p>
                      <p className="text-muted text-sm">
                        {new Intl.DateTimeFormat("en-GB", {
                          timeZone: "Asia/Bangkok",
                          dateStyle: "medium",
                          timeStyle: "short",
                        }).format(new Date(item.assessedAt))}{" "}
                        (UTC+7)
                      </p>
                    </div>
                    <StatusBadge
                      tone={
                        item.residualRating === "low"
                          ? "success"
                          : item.residualRating === "medium"
                            ? "info"
                            : item.residualRating === "high"
                              ? "warning"
                              : "danger"
                      }
                    >
                      {item.residualRating}
                    </StatusBadge>
                  </div>
                  <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                    {[
                      [
                        "Assessed by",
                        item.assessedBy?.fullName ?? "Unknown assessor",
                      ],
                      ["Assessment type", item.type.replaceAll("_", " ")],
                      [
                        "Control effectiveness recorded",
                        item.controlEffectiveness === null
                          ? "Not recorded"
                          : `${item.controlEffectiveness}%`,
                      ],
                      ["Target risk", item.targetRisk ?? "Not recorded"],
                      ["Risk appetite", item.riskAppetite ?? "Not recorded"],
                      ["Risk tolerance", item.riskTolerance ?? "Not recorded"],
                      ["Methodology", item.methodologyVersion],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <dt className="text-muted">{label}</dt>
                        <dd className="break-words">{value}</dd>
                      </div>
                    ))}
                  </dl>
                  <p className="text-muted mt-3 text-sm">Assessment basis</p>
                  <p className="text-sm break-words whitespace-pre-wrap">
                    {item.reason ?? "No basis recorded."}
                  </p>
                </article>
              ))
          ) : (
            <div className="border-border rounded-lg border border-dashed p-6 text-center">
              <p className="font-medium">No residual risk history</p>
              <p className="text-muted mt-1 text-sm">
                Saved residual risk records will appear here.
              </p>
            </div>
          )}
          {!risk.isPending && !risk.isError && history.length ? (
            <Pagination
              page={currentPage}
              pageCount={pageCount}
              onPageChange={setHistoryPage}
            />
          ) : null}
          <div className="border-border flex justify-end border-t pt-4">
            <Button type="button" variant="secondary" onClick={close}>
              Close
            </Button>
          </div>
        </section>
      ) : (
        <form
          id="residual-assess-panel"
          role="tabpanel"
          aria-labelledby="residual-assess-tab"
          className="space-y-5"
          noValidate
          onSubmit={handleSubmit(submit)}
        >
          <p className="text-muted text-sm">
            Assess remaining exposure for{" "}
            <strong className="text-foreground">{riskLabel}</strong> after
            considering implemented controls.
          </p>
          {message ? (
            <Alert className="border-danger/25 bg-danger-soft text-danger">
              {message}
            </Alert>
          ) : null}
          {blocked ? (
            <Alert>
              This Risk cannot receive a residual assessment in its current
              state or while acceptance is pending. Existing assessments remain
              available in Risk details.
            </Alert>
          ) : null}
          {risk.isError ? (
            <Alert>
              Unable to load the Risk. Close and reopen this dialog to try
              again.
            </Alert>
          ) : null}
          <p className="text-muted text-sm">
            The Risk Owner determines likelihood and impact using Control
            results and evidence. Control effectiveness is a reference summary;
            it does not automatically determine the residual rating.
          </p>
          {risk.data ? (
            <section className="border-border rounded-lg border p-4">
              <p className="text-sm font-medium">
                Related control effectiveness
              </p>
              <ul className="mt-2 space-y-1 text-sm">
                {risk.data.controls.map((item) => (
                  <li key={item.id} className="flex justify-between gap-3">
                    <span>
                      {item.code} — {item.name}
                    </span>
                    <span className="tabular-nums">
                      {item.latestEffectiveness === null
                        ? "Not assessed"
                        : `${item.latestEffectiveness}%`}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          {risk.data && !ready ? (
            <Alert>
              Inherent risk and every related control effectiveness assessment
              are required first.
            </Alert>
          ) : null}
          <fieldset
            className="space-y-4"
            disabled={!ready || mutation.isPending}
          >
            <div className="grid gap-4 sm:grid-cols-3">
              <FormField id="residualLikelihood" label="Likelihood (1–5)">
                <Select
                  id="residualLikelihood"
                  {...register("likelihood", { valueAsNumber: true })}
                >
                  {[1, 2, 3, 4, 5].map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField id="residualImpact" label="Impact (1–5)">
                <Select
                  id="residualImpact"
                  {...register("impact", { valueAsNumber: true })}
                >
                  {[1, 2, 3, 4, 5].map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </Select>
              </FormField>
              <div className="bg-neutral-soft rounded-lg p-3">
                <p className="text-muted text-xs uppercase">Residual rating</p>
                <p className="mt-1 text-lg font-semibold">
                  {score} — {rating(score)}
                </p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {(["targetRisk", "riskAppetite", "riskTolerance"] as const).map(
                (name) => (
                  <FormField
                    key={name}
                    id={name}
                    label={
                      name === "targetRisk"
                        ? "Target risk"
                        : name === "riskAppetite"
                          ? "Risk appetite"
                          : "Risk tolerance"
                    }
                    error={errors[name]?.message}
                  >
                    <Select
                      id={name}
                      {...register(name)}
                      disabled={Boolean(established && name !== "targetRisk")}
                    >
                      {levels.map((level) => (
                        <option key={level} value={level}>
                          {level}
                        </option>
                      ))}
                    </Select>
                  </FormField>
                ),
              )}
            </div>
            <p className="text-muted text-xs">
              Appetite and tolerance are the thresholds applicable to this Risk.
              Once recorded, they are reused in subsequent assessments.
            </p>
            <FormField
              id="residualReason"
              label="Assessment basis"
              error={errors.assessmentReason?.message}
            >
              <Textarea
                id="residualReason"
                rows={4}
                {...register("assessmentReason")}
              />
            </FormField>
          </fieldset>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={close}>
              Cancel
            </Button>
            <Button type="submit" disabled={!ready || mutation.isPending}>
              <GaugeCircle className="size-4" aria-hidden="true" />
              {mutation.isPending ? "Saving…" : "Save residual assessment"}
            </Button>
          </div>
        </form>
      )}
    </Dialog>
  );
}
