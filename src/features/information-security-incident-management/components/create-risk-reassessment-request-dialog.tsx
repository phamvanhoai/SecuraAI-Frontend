"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  FileText,
  History,
  Info,
  Link2,
  Loader2,
  RotateCcw,
  ShieldAlert,
  ShieldX,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useToast } from "@/components/feedback/toast";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  useCreateRiskReassessmentRequest,
  useRiskReassessmentRequestOptions,
} from "../hooks/use-incidents";
import {
  createRiskReassessmentRequestFormSchema,
  type CreateRiskReassessmentRequestForm,
} from "../schemas/risk-reassessment-request-schema";
import type { Incident } from "../schemas/report-incident-schema";
import { RiskReassessmentRequestHistoryPanel } from "./risk-reassessment-request-history-panel";

const titleCase = (value: string) =>
  value.replaceAll("_", " ").replace(/\b\w/g, (l) => l.toUpperCase());

type Tab = "create" | "history";

export function CreateRiskReassessmentRequestDialog({
  incident,
  onClose,
}: {
  incident: Incident | undefined;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [tab, setTab] = useState<Tab>("create");
  const options = useRiskReassessmentRequestOptions(incident?.id);
  const mutation = useCreateRiskReassessmentRequest();
  const toast = useToast();
  const form = useForm<CreateRiskReassessmentRequestForm>({
    resolver: zodResolver(createRiskReassessmentRequestFormSchema),
    defaultValues: { riskId: "", controlFindingId: "", reason: "" },
  });

  const selectedRiskId = form.watch("riskId");
  const selectedFindingId = form.watch("controlFindingId");

  const availableRisks = useMemo(
    () => options.data?.risks.filter((risk) => !risk.hasActiveRequest) ?? [],
    [options.data],
  );

  const tabs: { id: Tab; label: string; icon: typeof RotateCcw }[] = [
    { id: "create", label: "Create request", icon: RotateCcw },
    { id: "history", label: "Request history", icon: History },
  ];

  const visibleTabs =
    incident?.status === "closed"
      ? tabs.filter((t) => t.id === "history")
      : tabs;

  useEffect(() => {
    if (incident) {
      setTab(incident.status === "closed" ? "history" : "create");
      form.reset({ riskId: "", controlFindingId: "", reason: "" });
      ref.current?.showModal();
    } else {
      ref.current?.close();
    }
  }, [form, incident]);

  const submit = async (values: CreateRiskReassessmentRequestForm) => {
    if (!incident) return;
    try {
      const request = await mutation.mutateAsync({ id: incident.id, values });
      toast.success(
        "Reassessment requested",
        `${request.risk.riskCode} is pending review; its current rating was not changed.`,
      );
      form.reset({ riskId: "", controlFindingId: "", reason: "" });
      setTab("history");
    } catch {
      /* The normalized API error remains visible in the dialog. */
    }
  };

  const close = () => {
    setTab("create");
    onClose();
  };

  const switchTab = (next: Tab) => setTab(next);

  return (
    <Dialog
      dialogRef={ref}
      title="Request risk reassessment"
      className="max-h-[calc(100dvh-2rem)] w-[min(52rem,calc(100%-2rem))] overflow-y-auto"
      onClose={close}
    >
      {incident ? (
        <div className="space-y-5">
          {/* Context bar */}
          <div className="border-border bg-neutral-soft/30 rounded-lg border p-3.5 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-muted font-mono font-semibold">
                {incident.incidentCode}
              </span>
              <span className="text-foreground font-semibold break-words">
                {incident.title}
              </span>
            </div>
          </div>

          {/* Tab switcher */}
          <div
            role="tablist"
            aria-label="Risk reassessment request views"
            className="border-border bg-surface inline-flex w-full items-center gap-1 rounded-xl border p-1 shadow-xs sm:w-auto"
          >
            {visibleTabs.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = tab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  id={`rrr-${item.id}-tab`}
                  aria-selected={isSelected}
                  aria-controls={`rrr-${item.id}-panel`}
                  tabIndex={isSelected ? 0 : -1}
                  className={cn(
                    "focus-visible:outline-brand inline-flex min-w-0 flex-1 items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors focus-visible:outline-2 sm:flex-none",
                    isSelected
                      ? "bg-brand text-brand-contrast font-semibold shadow-xs"
                      : "text-muted hover:bg-neutral-soft hover:text-foreground",
                  )}
                  onClick={() => switchTab(item.id)}
                  onKeyDown={(event) => {
                    if (
                      !["ArrowLeft", "ArrowRight", "Home", "End"].includes(
                        event.key,
                      )
                    )
                      return;
                    event.preventDefault();
                    const ids = visibleTabs.map((t) => t.id);
                    let next: Tab;
                    if (event.key === "Home") next = ids[0] ?? item.id;
                    else if (event.key === "End")
                      next = ids[ids.length - 1] ?? item.id;
                    else {
                      const cur = ids.indexOf(item.id);
                      next =
                        ids[
                          (cur +
                            (event.key === "ArrowRight" ? 1 : -1) +
                            ids.length) %
                            ids.length
                        ] ?? item.id;
                    }
                    switchTab(next);
                    event.currentTarget.parentElement
                      ?.querySelector<HTMLButtonElement>(`#rrr-${next}-tab`)
                      ?.focus();
                  }}
                >
                  <Icon
                    aria-hidden="true"
                    className="size-4"
                    strokeWidth={idx === 0 ? 1.8 : 2}
                  />
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* Create tab panel */}
          <div
            id="rrr-create-panel"
            role="tabpanel"
            aria-labelledby="rrr-create-tab"
            hidden={tab !== "create"}
            className="space-y-6"
          >
            <form
              className="space-y-6"
              noValidate
              onSubmit={form.handleSubmit(submit)}
            >
              {/* Error alerts */}
              {options.isError ? (
                <Alert className="border-danger/25 bg-danger-soft text-danger">
                  Unable to load linked risks. Link a risk to this incident
                  first.
                </Alert>
              ) : null}
              {mutation.isError ? (
                <Alert className="border-danger/25 bg-danger-soft text-danger">
                  {mutation.error instanceof Error
                    ? mutation.error.message
                    : "Unable to create this reassessment request."}
                </Alert>
              ) : null}

              {/* Section 1 — Risk selection */}
              <section aria-labelledby="rrr-risk-heading" className="space-y-4">
                <div className="border-border flex items-start gap-2 border-b pb-2">
                  <ShieldAlert
                    aria-hidden="true"
                    className="text-brand mt-0.5 size-4 shrink-0"
                    strokeWidth={1.8}
                  />
                  <div>
                    <h3
                      id="rrr-risk-heading"
                      className="text-foreground text-sm font-semibold"
                    >
                      Select a linked risk
                    </h3>
                    <p className="text-muted text-xs">
                      Only risks already linked to this incident without an
                      active pending request are shown.
                    </p>
                  </div>
                </div>

                {options.isPending ? (
                  <div className="border-border bg-neutral-soft/20 rounded-xl border p-8 text-center">
                    <p className="text-muted text-sm">Loading linked risks…</p>
                  </div>
                ) : availableRisks.length === 0 ? (
                  <div className="border-border bg-neutral-soft/20 rounded-xl border p-8 text-center">
                    <ShieldAlert
                      aria-hidden="true"
                      className="text-muted mx-auto size-8 stroke-1"
                    />
                    <p className="text-muted mt-2 text-sm">
                      No linked risk is available, or every linked risk already
                      has an active request.
                    </p>
                    <p className="text-muted mt-1 text-xs">
                      Link a risk first via the &ldquo;Link risk&rdquo; action,
                      or wait for the active request to be reviewed.
                    </p>
                  </div>
                ) : (
                  <ul
                    className="space-y-2"
                    role="radiogroup"
                    aria-labelledby="rrr-risk-heading"
                  >
                    {availableRisks.map((risk) => {
                      const isSelected = selectedRiskId === risk.id;
                      return (
                        <li key={risk.id}>
                          <button
                            type="button"
                            role="radio"
                            aria-checked={isSelected}
                            onClick={() =>
                              form.setValue("riskId", risk.id, {
                                shouldValidate: true,
                              })
                            }
                            className={cn(
                              "border-border focus-visible:outline-brand w-full rounded-xl border p-3.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2",
                              isSelected
                                ? "border-brand bg-brand/5 shadow-xs"
                                : "bg-surface hover:bg-neutral-soft/60",
                            )}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <p className="font-medium break-words">
                                  {risk.title}
                                </p>
                                <p className="text-muted mt-0.5 text-xs">
                                  {risk.riskCode} · {titleCase(risk.status)}
                                </p>
                              </div>
                              <span
                                className={cn(
                                  "grid size-4 shrink-0 place-items-center rounded-full border-2 transition-colors",
                                  isSelected
                                    ? "border-brand bg-brand"
                                    : "border-border bg-surface",
                                )}
                              >
                                {isSelected ? (
                                  <span className="size-1.5 rounded-full bg-white" />
                                ) : null}
                              </span>
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}

                {form.formState.errors.riskId ? (
                  <p className="text-danger text-sm">
                    {form.formState.errors.riskId.message}
                  </p>
                ) : null}
              </section>

              {/* Section 2 — Optional control weakness link */}
              <section
                aria-labelledby="rrr-weakness-heading"
                className="space-y-4"
              >
                <div className="border-border flex items-start gap-2 border-b pb-2">
                  <Link2
                    aria-hidden="true"
                    className="text-brand mt-0.5 size-4 shrink-0"
                    strokeWidth={1.8}
                  />
                  <div>
                    <h3
                      id="rrr-weakness-heading"
                      className="text-foreground text-sm font-semibold"
                    >
                      Related control weakness{" "}
                      <span className="text-muted font-normal">(optional)</span>
                    </h3>
                    <p className="text-muted text-xs">
                      Select a recorded control weakness from this incident if
                      it is a contributing factor to the reassessment.
                    </p>
                  </div>
                </div>

                {options.isPending ? (
                  <div className="border-border bg-neutral-soft/20 rounded-xl border p-6 text-center">
                    <p className="text-muted text-sm">
                      Loading control weaknesses…
                    </p>
                  </div>
                ) : (
                  <ul
                    className="space-y-2"
                    role="radiogroup"
                    aria-labelledby="rrr-weakness-heading"
                  >
                    {/* None option */}
                    <li>
                      <button
                        type="button"
                        role="radio"
                        aria-checked={selectedFindingId === ""}
                        onClick={() =>
                          form.setValue("controlFindingId", "", {
                            shouldValidate: true,
                          })
                        }
                        className={cn(
                          "border-border focus-visible:outline-brand w-full rounded-xl border p-3.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2",
                          selectedFindingId === ""
                            ? "border-brand bg-brand/5 shadow-xs"
                            : "bg-surface hover:bg-neutral-soft/60",
                        )}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-medium">
                              No specific control weakness
                            </p>
                            <p className="text-muted mt-0.5 text-xs">
                              The reassessment is based on the incident impact
                              only.
                            </p>
                          </div>
                          <span
                            className={cn(
                              "grid size-4 shrink-0 place-items-center rounded-full border-2 transition-colors",
                              selectedFindingId === ""
                                ? "border-brand bg-brand"
                                : "border-border bg-surface",
                            )}
                          >
                            {selectedFindingId === "" ? (
                              <span className="size-1.5 rounded-full bg-white" />
                            ) : null}
                          </span>
                        </div>
                      </button>
                    </li>

                    {/* Control weakness options */}
                    {(options.data?.controlWeaknesses ?? []).map((finding) => {
                      const isSelected = selectedFindingId === finding.id;
                      return (
                        <li key={finding.id}>
                          <button
                            type="button"
                            role="radio"
                            aria-checked={isSelected}
                            onClick={() =>
                              form.setValue("controlFindingId", finding.id, {
                                shouldValidate: true,
                              })
                            }
                            className={cn(
                              "border-border focus-visible:outline-brand w-full rounded-xl border p-3.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2",
                              isSelected
                                ? "border-brand bg-brand/5 shadow-xs"
                                : "bg-surface hover:bg-neutral-soft/60",
                            )}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <p className="font-medium break-words">
                                  {finding.control.name}
                                </p>
                                <p className="text-muted mt-0.5 text-xs">
                                  {finding.control.controlCode}
                                  {finding.severity
                                    ? ` · ${titleCase(finding.severity)} severity`
                                    : ""}
                                  {" · "}
                                  {titleCase(finding.status)}
                                </p>
                              </div>
                              <span
                                className={cn(
                                  "grid size-4 shrink-0 place-items-center rounded-full border-2 transition-colors",
                                  isSelected
                                    ? "border-brand bg-brand"
                                    : "border-border bg-surface",
                                )}
                              >
                                {isSelected ? (
                                  <span className="size-1.5 rounded-full bg-white" />
                                ) : null}
                              </span>
                            </div>
                          </button>
                        </li>
                      );
                    })}

                    {!options.isPending &&
                    (options.data?.controlWeaknesses ?? []).length === 0 ? (
                      <li>
                        <div className="border-border bg-neutral-soft/20 rounded-xl border p-5 text-center">
                          <ShieldX
                            aria-hidden="true"
                            className="text-muted mx-auto size-6 stroke-1"
                          />
                          <p className="text-muted mt-2 text-xs">
                            No control weaknesses recorded for this incident
                            yet.
                          </p>
                        </div>
                      </li>
                    ) : null}
                  </ul>
                )}

                {form.formState.errors.controlFindingId ? (
                  <p className="text-danger text-sm">
                    {form.formState.errors.controlFindingId.message}
                  </p>
                ) : null}
              </section>

              {/* Section 3 — Reason */}
              <section
                aria-labelledby="rrr-reason-heading"
                className="space-y-4"
              >
                <div className="border-border flex items-start gap-2 border-b pb-2">
                  <FileText
                    aria-hidden="true"
                    className="text-brand mt-0.5 size-4 shrink-0"
                    strokeWidth={1.8}
                  />
                  <div>
                    <h3
                      id="rrr-reason-heading"
                      className="text-foreground text-sm font-semibold"
                    >
                      Reason for reassessment
                    </h3>
                    <p className="text-muted text-xs">
                      Minimum 20 characters. Max 5,000.
                    </p>
                  </div>
                </div>

                <Textarea
                  id="reassessment-reason"
                  aria-labelledby="rrr-reason-heading"
                  className="min-h-32"
                  maxLength={5000}
                  placeholder="Explain how the incident or control weakness may change the risk likelihood, impact, or treatment assumptions."
                  aria-invalid={Boolean(form.formState.errors.reason)}
                  {...form.register("reason")}
                />
                {form.formState.errors.reason ? (
                  <p className="text-danger text-sm">
                    {form.formState.errors.reason.message}
                  </p>
                ) : null}

                {/* Hint banner */}
                <div className="border-border bg-neutral-soft/30 flex gap-2.5 rounded-xl border p-3.5">
                  <Info
                    aria-hidden="true"
                    className="text-muted mt-0.5 size-4 shrink-0"
                    strokeWidth={1.8}
                  />
                  <p className="text-muted text-xs">
                    This creates a review request only. The current risk rating
                    is not changed until a Security Officer completes the
                    reassessment in the Risk Register.
                  </p>
                </div>
              </section>

              {/* Footer */}
              <div className="border-border flex items-center justify-between border-t pt-4">
                <div />
                <div className="flex items-center gap-3">
                  <Button variant="secondary" onClick={close} type="button">
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={mutation.isPending || availableRisks.length === 0}
                  >
                    {mutation.isPending ? (
                      <>
                        <Loader2
                          aria-hidden="true"
                          className="size-4 animate-spin"
                        />
                        Requesting…
                      </>
                    ) : (
                      <>
                        <RotateCcw
                          aria-hidden="true"
                          className="size-4"
                          strokeWidth={1.8}
                        />
                        Create request
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </div>

          {/* History tab panel */}
          <div
            id="rrr-history-panel"
            role="tabpanel"
            aria-labelledby="rrr-history-tab"
            hidden={tab !== "history"}
            className="space-y-5"
          >
            <RiskReassessmentRequestHistoryPanel incidentId={incident.id} />
            <div className="border-border flex justify-end border-t pt-4">
              <Button variant="secondary" onClick={close} type="button">
                Close
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </Dialog>
  );
}
