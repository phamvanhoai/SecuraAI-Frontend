"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertTriangle,
  FileText,
  History,
  Info,
  Loader2,
  ShieldCheck,
  ShieldX,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/feedback/toast";
import { cn } from "@/lib/utils";
import {
  useControlWeaknessOptions,
  useRecordControlWeakness,
} from "../hooks/use-incidents";
import {
  recordControlWeaknessFormSchema,
  type RecordControlWeaknessForm,
} from "../schemas/control-weakness-schema";
import type { Incident } from "../schemas/report-incident-schema";
import { ControlWeaknessHistoryPanel } from "./control-weakness-history-dialog";

const titleCase = (value: string) =>
  value.replaceAll("_", " ").replace(/\b\w/g, (l) => l.toUpperCase());

const SEVERITY_OPTIONS = [
  {
    value: "low" as const,
    label: "Low",
    description: "Minor gap, minimal operational impact.",
    tone: "text-success",
    border: "border-success",
    bg: "bg-success/5",
  },
  {
    value: "medium" as const,
    label: "Medium",
    description: "Notable gap requiring scheduled remediation.",
    tone: "text-warning",
    border: "border-warning",
    bg: "bg-warning/5",
  },
  {
    value: "high" as const,
    label: "High",
    description: "Significant exposure, prioritize promptly.",
    tone: "text-danger",
    border: "border-danger",
    bg: "bg-danger/5",
  },
  {
    value: "critical" as const,
    label: "Critical",
    description: "Severe gap, immediate action required.",
    tone: "text-danger",
    border: "border-danger",
    bg: "bg-danger/10",
  },
] as const;

type Tab = "record" | "history";

export function RecordControlWeaknessDialog({
  incident,
  onClose,
}: {
  incident: Incident | undefined;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [tab, setTab] = useState<Tab>("record");
  const options = useControlWeaknessOptions(incident?.id);
  const mutation = useRecordControlWeakness();
  const toast = useToast();
  const form = useForm<RecordControlWeaknessForm>({
    resolver: zodResolver(recordControlWeaknessFormSchema),
    defaultValues: { controlId: "", severity: "medium", description: "" },
  });

  const selectedControlId = form.watch("controlId");
  const selectedSeverity = form.watch("severity");

  const available = useMemo(
    () =>
      options.data?.controls.filter((control) => !control.hasOpenWeakness) ??
      [],
    [options.data],
  );

  const tabs: { id: Tab; label: string; icon: typeof ShieldX }[] = [
    { id: "record", label: "Record weakness", icon: ShieldX },
    { id: "history", label: "Weakness history", icon: History },
  ];

  const visibleTabs =
    incident?.status === "closed"
      ? tabs.filter((t) => t.id === "history")
      : tabs;

  useEffect(() => {
    if (incident) {
      setTab(incident.status === "closed" ? "history" : "record");
      form.reset({ controlId: "", severity: "medium", description: "" });
      ref.current?.showModal();
    } else {
      ref.current?.close();
    }
  }, [form, incident]);

  const submit = async (values: RecordControlWeaknessForm) => {
    if (!incident) return;
    try {
      const finding = await mutation.mutateAsync({ id: incident.id, values });
      toast.success(
        "Control weakness recorded",
        `${finding.control.controlCode} now has an open weakness from ${finding.incident.incidentCode}.`,
      );
      form.reset({ controlId: "", severity: "medium", description: "" });
      setTab("history");
    } catch {
      /* The normalized API error remains visible. */
    }
  };

  const close = () => {
    setTab("record");
    onClose();
  };

  const switchTab = (next: Tab) => {
    setTab(next);
  };

  return (
    <Dialog
      dialogRef={ref}
      title="Record control weakness"
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
            aria-label="Control weakness views"
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
                  id={`cw-${item.id}-tab`}
                  aria-selected={isSelected}
                  aria-controls={`cw-${item.id}-panel`}
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
                      ?.querySelector<HTMLButtonElement>(`#cw-${next}-tab`)
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

          {/* Record tab panel */}
          <div
            id="cw-record-panel"
            role="tabpanel"
            aria-labelledby="cw-record-tab"
            hidden={tab !== "record"}
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
                  Unable to load linked controls. Link a control to this
                  incident first.
                </Alert>
              ) : null}
              {mutation.isError ? (
                <Alert className="border-danger/25 bg-danger-soft text-danger">
                  {mutation.error instanceof Error
                    ? mutation.error.message
                    : "Unable to record this weakness."}
                </Alert>
              ) : null}

              {/* Section 1 — Control selection */}
              <section
                aria-labelledby="cw-control-heading"
                className="space-y-4"
              >
                <div className="border-border flex items-start gap-2 border-b pb-2">
                  <ShieldCheck
                    aria-hidden="true"
                    className="text-brand mt-0.5 size-4 shrink-0"
                    strokeWidth={1.8}
                  />
                  <div>
                    <h3
                      id="cw-control-heading"
                      className="text-foreground text-sm font-semibold"
                    >
                      Select a linked control
                    </h3>
                    <p className="text-muted text-xs">
                      Only controls already linked to this incident and without
                      an open weakness are shown.
                    </p>
                  </div>
                </div>

                {options.isPending ? (
                  <div className="border-border bg-neutral-soft/20 rounded-xl border p-8 text-center">
                    <p className="text-muted text-sm">
                      Loading linked controls…
                    </p>
                  </div>
                ) : available.length === 0 ? (
                  <div className="border-border bg-neutral-soft/20 rounded-xl border p-8 text-center">
                    <ShieldX
                      aria-hidden="true"
                      className="text-muted mx-auto size-8 stroke-1"
                    />
                    <p className="text-muted mt-2 text-sm">
                      No linked control is available, or each linked control
                      already has an open weakness.
                    </p>
                    <p className="text-muted mt-1 text-xs">
                      Link a control first via the &ldquo;Link control&rdquo;
                      action.
                    </p>
                  </div>
                ) : (
                  <ul
                    className="space-y-2"
                    role="radiogroup"
                    aria-labelledby="cw-control-heading"
                  >
                    {available.map((control) => {
                      const isSelected = selectedControlId === control.id;
                      return (
                        <li key={control.id}>
                          <button
                            type="button"
                            role="radio"
                            aria-checked={isSelected}
                            onClick={() =>
                              form.setValue("controlId", control.id, {
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
                                  {control.name}
                                </p>
                                <p className="text-muted mt-0.5 text-xs">
                                  {control.controlCode} ·{" "}
                                  {titleCase(control.implementationStatus)}
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

                {form.formState.errors.controlId ? (
                  <p className="text-danger text-sm">
                    {form.formState.errors.controlId.message}
                  </p>
                ) : null}
              </section>

              {/* Section 2 — Severity */}
              <section
                aria-labelledby="cw-severity-heading"
                className="space-y-4"
              >
                <div className="border-border flex items-start gap-2 border-b pb-2">
                  <AlertTriangle
                    aria-hidden="true"
                    className="text-brand mt-0.5 size-4 shrink-0"
                    strokeWidth={1.8}
                  />
                  <div>
                    <h3
                      id="cw-severity-heading"
                      className="text-foreground text-sm font-semibold"
                    >
                      Weakness severity
                    </h3>
                    <p className="text-muted text-xs">
                      Rate the observed impact on security posture from this
                      control gap.
                    </p>
                  </div>
                </div>

                <div
                  className="grid grid-cols-2 gap-2 sm:grid-cols-4"
                  role="radiogroup"
                  aria-labelledby="cw-severity-heading"
                >
                  {SEVERITY_OPTIONS.map((opt) => {
                    const isSelected = selectedSeverity === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        onClick={() =>
                          form.setValue("severity", opt.value, {
                            shouldValidate: true,
                          })
                        }
                        className={cn(
                          "focus-visible:outline-brand rounded-xl border p-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2",
                          isSelected
                            ? cn(opt.border, opt.bg, "shadow-xs")
                            : "border-border bg-surface hover:bg-neutral-soft/60",
                        )}
                      >
                        <span
                          className={cn(
                            "block text-sm font-semibold",
                            isSelected ? opt.tone : "text-foreground",
                          )}
                        >
                          {opt.label}
                        </span>
                        <span className="text-muted mt-1 block text-xs leading-snug">
                          {opt.description}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {form.formState.errors.severity ? (
                  <p className="text-danger text-sm">
                    {form.formState.errors.severity.message}
                  </p>
                ) : null}
              </section>

              {/* Section 3 — Description */}
              <section aria-labelledby="cw-desc-heading" className="space-y-4">
                <div className="border-border flex items-start gap-2 border-b pb-2">
                  <FileText
                    aria-hidden="true"
                    className="text-brand mt-0.5 size-4 shrink-0"
                    strokeWidth={1.8}
                  />
                  <div>
                    <h3
                      id="cw-desc-heading"
                      className="text-foreground text-sm font-semibold"
                    >
                      Weakness description
                    </h3>
                    <p className="text-muted text-xs">
                      Minimum 20 characters. Max 5,000.
                    </p>
                  </div>
                </div>

                <Textarea
                  id="weakness-description"
                  aria-labelledby="cw-desc-heading"
                  className="min-h-32"
                  maxLength={5000}
                  placeholder="Explain how the control failed or was not applied during this incident."
                  aria-invalid={Boolean(form.formState.errors.description)}
                  {...form.register("description")}
                />
                {form.formState.errors.description ? (
                  <p className="text-danger text-sm">
                    {form.formState.errors.description.message}
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
                    Record observable facts only. Risk reassessment from this
                    weakness is a separate reviewed step initiated through the
                    risk register.
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
                    disabled={mutation.isPending || available.length === 0}
                  >
                    {mutation.isPending ? (
                      <>
                        <Loader2
                          aria-hidden="true"
                          className="size-4 animate-spin"
                        />
                        Recording…
                      </>
                    ) : (
                      <>
                        <ShieldX
                          aria-hidden="true"
                          className="size-4"
                          strokeWidth={1.8}
                        />
                        Record weakness
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </div>

          {/* History tab panel */}
          <div
            id="cw-history-panel"
            role="tabpanel"
            aria-labelledby="cw-history-tab"
            hidden={tab !== "history"}
            className="space-y-5"
          >
            <ControlWeaknessHistoryPanel incidentId={incident.id} />
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
