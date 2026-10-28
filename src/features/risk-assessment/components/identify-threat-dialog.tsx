"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  FileText,
  History,
  Info,
  Loader2,
  ShieldAlert,
  Swords,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/feedback/toast";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useIdentifyThreat } from "../hooks/use-identify-threat";
import { useRiskRecord } from "../hooks/use-risk-register";
import {
  identifyThreatSchema,
  type IdentifyThreatInput,
} from "../schemas/identify-threat-schema";
import { RiskContextHistoryList } from "./risk-context-history-list";

export function IdentifyThreatDialog({
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
  const [tab, setTab] = useState<"identify" | "history">("identify");
  const risk = useRiskRecord(riskId);
  const mutation = useIdentifyThreat(riskId);
  const toast = useToast();

  const blockedReason =
    risk.data?.vulnerabilityWorkflow?.blockedReason ??
    (risk.data && risk.data.vulnerabilityWorkflow?.canIdentify === false
      ? "Threat creation is unavailable. Open Risk Review for an Accepted Risk first. History remains available."
      : null);

  const cannotSave =
    mutation.isPending ||
    risk.isPending ||
    risk.isError ||
    !risk.data ||
    Boolean(blockedReason) ||
    risk.data.vulnerabilityWorkflow?.canIdentify === false;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<IdentifyThreatInput>({
    resolver: zodResolver(identifyThreatSchema),
    defaultValues: { name: "", description: "", vulnerabilityIds: [] },
  });

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (riskId && !dialog.open) dialog.showModal();
    if (!riskId && dialog.open) dialog.close();
  }, [riskId]);

  const close = () => {
    reset();
    setMessage(undefined);
    setTab("identify");
    onClose();
  };

  const submit = async (input: IdentifyThreatInput) => {
    if (cannotSave) return;
    try {
      const created = await mutation.mutateAsync(input);
      close();
      toast.success(
        "Threat identified",
        `${created.name} was linked to ${created.vulnerabilities.length} vulnerabilities.`,
      );
    } catch (error: unknown) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to identify the threat.",
      );
    }
  };

  return (
    <Dialog
      title="Identify Threat"
      dialogRef={ref}
      onClose={close}
      className="max-h-[calc(100dvh-2rem)] w-[min(44rem,calc(100%-2rem))] overflow-y-auto"
    >
      <div className="space-y-5">
        {/* Context bar */}
        <div className="border-border bg-neutral-soft/30 rounded-lg border p-3.5 text-xs">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <Swords
              aria-hidden="true"
              className="size-3.5 shrink-0 text-muted"
              strokeWidth={1.8}
            />
            <span className="text-foreground font-semibold break-words">
              {riskLabel}
            </span>
          </div>
          {blockedReason ? (
            <p className="text-warning mt-1.5 font-medium">{blockedReason}</p>
          ) : null}
        </div>

        {/* Tab switcher */}
        <div
          role="tablist"
          aria-label="Threat identification views"
          className="border-border bg-surface inline-flex w-full items-center gap-1 rounded-xl border p-1 shadow-xs sm:w-auto"
        >
          <button
            type="button"
            role="tab"
            id="threat-identify-tab"
            aria-selected={tab === "identify"}
            aria-controls="threat-identify-panel"
            tabIndex={tab === "identify" ? 0 : -1}
            className={cn(
              "focus-visible:outline-brand inline-flex min-w-0 flex-1 items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors focus-visible:outline-2 sm:flex-none",
              tab === "identify"
                ? "bg-brand text-brand-contrast font-semibold shadow-xs"
                : "text-muted hover:bg-neutral-soft hover:text-foreground",
            )}
            onClick={() => setTab("identify")}
            onKeyDown={(event) => {
              if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key))
                return;
              event.preventDefault();
              const next =
                event.key === "Home" || event.key === "ArrowLeft"
                  ? "identify"
                  : "history";
              setTab(next);
              event.currentTarget.parentElement
                ?.querySelector<HTMLButtonElement>(`#threat-${next}-tab`)
                ?.focus();
            }}
          >
            <Swords aria-hidden="true" className="size-4 shrink-0" strokeWidth={1.8} />
            Identify threat
          </button>
          <button
            type="button"
            role="tab"
            id="threat-history-tab"
            aria-selected={tab === "history"}
            aria-controls="threat-history-panel"
            tabIndex={tab === "history" ? 0 : -1}
            className={cn(
              "focus-visible:outline-brand inline-flex min-w-0 flex-1 items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors focus-visible:outline-2 sm:flex-none",
              tab === "history"
                ? "bg-brand text-brand-contrast font-semibold shadow-xs"
                : "text-muted hover:bg-neutral-soft hover:text-foreground",
            )}
            onClick={() => setTab("history")}
            onKeyDown={(event) => {
              if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key))
                return;
              event.preventDefault();
              const next =
                event.key === "End" || event.key === "ArrowRight"
                  ? "history"
                  : "identify";
              setTab(next);
              event.currentTarget.parentElement
                ?.querySelector<HTMLButtonElement>(`#threat-${next}-tab`)
                ?.focus();
            }}
          >
            <History
              aria-hidden="true"
              className="size-4 shrink-0"
              strokeWidth={2}
            />
            History ({risk.data?.contextHistory.length ?? 0})
          </button>
        </div>

        {/* History panel */}
        {tab === "history" ? (
          <section
            id="threat-history-panel"
            role="tabpanel"
            aria-labelledby="threat-history-tab"
            className="space-y-4"
          >
            <div className="flex items-start gap-2 border-b border-border pb-2">
              <History
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 text-brand"
                strokeWidth={2}
              />
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Context history
                </h3>
                <p className="text-xs text-muted">
                  Read-only Threat and Vulnerability history for this Risk.
                </p>
              </div>
            </div>
            {risk.data ? (
              <RiskContextHistoryList
                entries={risk.data.contextHistory}
                risk={risk.data}
              />
            ) : null}
            <div className="flex justify-end border-t border-border pt-4">
              <Button type="button" variant="secondary" onClick={close}>
                Close
              </Button>
            </div>
          </section>
        ) : (
          /* Identify panel */
          <form
            id="threat-identify-panel"
            role="tabpanel"
            aria-labelledby="threat-identify-tab"
            className="space-y-6"
            noValidate
            onSubmit={handleSubmit(submit)}
          >
            {/* Alerts */}
            {message ? (
              <Alert className="border-danger/25 bg-danger-soft text-danger">
                {message}
              </Alert>
            ) : null}
            {risk.isError ? (
              <Alert className="border-danger/25 bg-danger-soft text-danger">
                Unable to load this risk. Your input is retained.{" "}
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => void risk.refetch()}
                >
                  Try again
                </Button>
              </Alert>
            ) : null}

            {/* Section 1 — Threat name */}
            <div className="space-y-3">
              <div className="flex items-start gap-2 border-b border-border pb-2">
                <Swords
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0 text-brand"
                  strokeWidth={1.8}
                />
                <div>
                  <h3
                    id="threat-name-heading"
                    className="text-sm font-semibold text-foreground"
                  >
                    Threat name
                  </h3>
                  <p className="text-xs text-muted">
                    A short, descriptive identifier. Max 255 characters.
                  </p>
                </div>
              </div>
              <Input
                id="threatName"
                maxLength={255}
                autoFocus
                disabled={cannotSave}
                aria-labelledby="threat-name-heading"
                aria-invalid={Boolean(errors.name)}
                {...register("name")}
              />
              {errors.name ? (
                <p className="text-danger text-xs" role="alert">
                  {errors.name.message}
                </p>
              ) : null}
            </div>

            {/* Section 2 — Threat scenario */}
            <div className="space-y-3">
              <div className="flex items-start gap-2 border-b border-border pb-2">
                <FileText
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0 text-brand"
                  strokeWidth={1.8}
                />
                <div>
                  <h3
                    id="threat-desc-heading"
                    className="text-sm font-semibold text-foreground"
                  >
                    Threat scenario
                  </h3>
                  <p className="text-xs text-muted">
                    Describe how this threat could materialise and its potential
                    impact. Max 3,000 characters.
                  </p>
                </div>
              </div>
              <Textarea
                id="threatDescription"
                className={cn(
                  "disabled:cursor-not-allowed disabled:bg-neutral-soft disabled:text-muted disabled:opacity-60 disabled:resize-none",
                )}
                rows={4}
                maxLength={3000}
                disabled={cannotSave}
                aria-labelledby="threat-desc-heading"
                aria-invalid={Boolean(errors.description)}
                {...register("description")}
              />
              {errors.description ? (
                <p className="text-danger text-xs" role="alert">
                  {errors.description.message}
                </p>
              ) : null}
            </div>

            {/* Section 3 — Related vulnerabilities */}
            <section aria-labelledby="threat-vulns-heading" className="space-y-3">
              <div className="flex items-start gap-2 border-b border-border pb-2">
                <ShieldAlert
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0 text-brand"
                  strokeWidth={1.8}
                />
                <div>
                  <h3
                    id="threat-vulns-heading"
                    className="text-sm font-semibold text-foreground"
                  >
                    Related vulnerabilities
                    <span className="text-muted ml-1.5 text-xs font-normal">
                      (optional)
                    </span>
                  </h3>
                  <p className="text-xs text-muted">
                    Only vulnerabilities already documented for this risk are
                    available.
                  </p>
                </div>
              </div>
              <fieldset disabled={cannotSave} className="space-y-3">
                <legend className="sr-only">Related vulnerabilities</legend>
                <div className="border-border overflow-hidden rounded-xl border">
                  <div
                    aria-label="Vulnerability options"
                    className="max-h-52 overflow-y-auto p-1.5"
                  >
                    {risk.isPending ? (
                      <p className="text-muted px-3 py-4 text-sm">
                        Loading vulnerabilities…
                      </p>
                    ) : risk.data?.vulnerabilities.length ? (
                      risk.data.vulnerabilities.map((item) => (
                        <label
                          key={item.id}
                          className="flex min-h-11 cursor-pointer items-start gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-neutral-soft has-[:checked]:bg-brand/5 has-[:checked]:border has-[:checked]:border-brand"
                        >
                          <input
                            className="mt-0.5 size-4 accent-brand shrink-0"
                            type="checkbox"
                            value={item.id}
                            {...register("vulnerabilityIds")}
                          />
                          <span className="min-w-0">
                            <strong className="block font-medium break-words">
                              {item.name}
                            </strong>
                            {item.description ? (
                              <span className="text-muted line-clamp-2 text-xs">
                                {item.description}
                              </span>
                            ) : null}
                          </span>
                        </label>
                      ))
                    ) : (
                      <div className="px-3 py-5 text-center">
                        <ShieldAlert
                          aria-hidden="true"
                          className="text-muted mx-auto mb-2 size-6"
                          strokeWidth={1.5}
                        />
                        <p className="text-sm font-medium text-foreground">
                          No vulnerabilities documented
                        </p>
                        <p className="text-muted mt-0.5 text-xs">
                          Add a vulnerability before identifying a threat.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                {errors.vulnerabilityIds?.message ? (
                  <p className="text-danger text-xs" role="alert">
                    {errors.vulnerabilityIds.message}
                  </p>
                ) : null}
              </fieldset>
            </section>

            {/* Info hint */}
            <div className="border-border bg-neutral-soft/30 flex gap-2.5 rounded-xl border p-3.5">
              <Info
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 text-muted"
                strokeWidth={1.8}
              />
              <p className="text-xs text-muted">
                Identifying a threat updates the risk context. If an assessment
                already exists, you will be prompted to reassess inherent and
                residual risk before submitting acceptance.
              </p>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-border pt-4">
              <div />
              <div className="flex items-center gap-3">
                <Button type="button" variant="secondary" onClick={close}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={cannotSave}
                >
                  {mutation.isPending ? (
                    <>
                      <Loader2
                        aria-hidden="true"
                        className="size-4 animate-spin"
                      />
                      Saving…
                    </>
                  ) : (
                    <>
                      <Swords
                        aria-hidden="true"
                        className="size-4"
                        strokeWidth={1.8}
                      />
                      Identify threat
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        )}
      </div>
    </Dialog>
  );
}
