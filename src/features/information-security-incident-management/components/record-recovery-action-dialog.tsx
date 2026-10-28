"use client";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/data-display/pagination";
import { useToast } from "@/components/feedback/toast";
import { cn } from "@/lib/utils";
import {
  Clock,
  FileText,
  HeartPulse,
  History,
  Info,
  Loader2,
  RotateCcw,
} from "lucide-react";
import type { Incident } from "../schemas/report-incident-schema";
import { canRecordIncidentAction } from "../schemas/incident-workflow";
import {
  recoveryFormSchema,
  type RecoveryForm,
} from "../schemas/recovery-action-schema";
import {
  useRecoveryHistory,
  useRecordRecoveryAction,
} from "../hooks/use-recovery-actions";

export function RecordRecoveryActionDialog({
  incident,
  onClose,
}: {
  incident: Incident | undefined;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [tab, setTab] = useState<"record" | "history">("record");
  const [page, setPage] = useState(1);
  const form = useForm<RecoveryForm>({
    resolver: zodResolver(recoveryFormSchema),
    defaultValues: { description: "", performedAt: "" },
  });
  const mutation = useRecordRecoveryAction();
  const history = useRecoveryHistory(incident?.id, page);
  const toast = useToast();
  const resetForm = form.reset;
  const resetMutation = mutation.reset;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (incident && !dialog.open) {
      resetForm({ description: "", performedAt: "" });
      resetMutation();
      setPage(1);
      setTab(
        canRecordIncidentAction(incident.status, "recovery")
          ? "record"
          : "history",
      );
      dialog.showModal();
    }
    if (!incident && dialog.open) dialog.close();
  }, [incident, resetForm, resetMutation]);

  const submit = async (values: RecoveryForm) => {
    if (!incident || !canRecordIncidentAction(incident.status, "recovery"))
      return;
    try {
      await mutation.mutateAsync({ id: incident.id, values });
      form.reset();
      setPage(1);
      setTab("history");
      toast.success(
        "Recovery action recorded",
        "The action is saved in incident response history. The handling phase is unchanged.",
      );
    } catch {
      /* The persistent error below keeps the entered values available. */
    }
  };

  const canRecord = incident
    ? canRecordIncidentAction(incident.status, "recovery")
    : false;

  return (
    <Dialog
      dialogRef={dialogRef}
      title="Record recovery action"
      onClose={onClose}
      onCancel={(event) => {
        if (mutation.isPending) event.preventDefault();
      }}
      className="max-h-[calc(100dvh-2rem)] w-[min(46rem,calc(100vw-2rem))] max-w-none overflow-y-auto"
    >
      {incident ? (
        <div className="space-y-5">
          {/* Phase-not-started warning */}
          {!canRecord && incident.status !== "closed" ? (
            <Alert className="border-warning/25 bg-warning-soft text-warning">
              Recovery has not started. Use Actions → Update handling phase
              before recording recovery actions.
            </Alert>
          ) : null}

          {/* Context bar */}
          <div className="border-border bg-neutral-soft/30 rounded-lg border p-3.5 text-xs">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="font-mono font-semibold text-muted">
                {incident.incidentCode}
              </span>
              <span className="text-foreground font-semibold break-words">
                {incident.title}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium",
                  "bg-success/10 text-success",
                )}
              >
                <HeartPulse
                  aria-hidden="true"
                  className="size-3"
                  strokeWidth={2}
                />
                Recovery phase
              </span>
            </div>
          </div>

          {/* Tab switcher */}
          <div
            role="tablist"
            aria-label="Recovery action views"
            className="border-border bg-surface inline-flex w-full items-center gap-1 rounded-xl border p-1 shadow-xs sm:w-auto"
          >
            <button
              id="recovery-record-tab"
              type="button"
              role="tab"
              aria-selected={tab === "record"}
              aria-controls="recovery-record-panel"
              tabIndex={tab === "record" ? 0 : -1}
              disabled={!canRecord}
              className={cn(
                "focus-visible:outline-brand inline-flex min-w-0 flex-1 items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors focus-visible:outline-2 sm:flex-none disabled:cursor-not-allowed disabled:opacity-50",
                tab === "record"
                  ? "bg-brand text-brand-contrast font-semibold shadow-xs"
                  : "text-muted hover:bg-neutral-soft hover:text-foreground",
              )}
              onClick={() => setTab("record")}
              onKeyDown={(event) => {
                if (
                  !canRecord ||
                  !["ArrowLeft", "ArrowRight", "Home", "End"].includes(
                    event.key,
                  )
                )
                  return;
                event.preventDefault();
                const next =
                  event.key === "Home" || event.key === "ArrowLeft"
                    ? "record"
                    : "history";
                setTab(next);
                event.currentTarget.parentElement
                  ?.querySelector<HTMLButtonElement>(`#recovery-${next}-tab`)
                  ?.focus();
              }}
            >
              <RotateCcw
                aria-hidden="true"
                className="size-4 shrink-0"
                strokeWidth={1.8}
              />
              Record action
            </button>
            <button
              id="recovery-history-tab"
              type="button"
              role="tab"
              aria-selected={tab === "history"}
              aria-controls="recovery-history-panel"
              tabIndex={tab === "history" ? 0 : -1}
              className={cn(
                "focus-visible:outline-brand inline-flex min-w-0 flex-1 items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors focus-visible:outline-2 sm:flex-none disabled:cursor-not-allowed disabled:opacity-50",
                tab === "history"
                  ? "bg-brand text-brand-contrast font-semibold shadow-xs"
                  : "text-muted hover:bg-neutral-soft hover:text-foreground",
              )}
              onClick={() => setTab("history")}
              onKeyDown={(event) => {
                if (
                  !["ArrowLeft", "ArrowRight", "Home", "End"].includes(
                    event.key,
                  )
                )
                  return;
                event.preventDefault();
                const next =
                  event.key === "End" || event.key === "ArrowRight"
                    ? "history"
                    : "record";
                setTab(next);
                event.currentTarget.parentElement
                  ?.querySelector<HTMLButtonElement>(`#recovery-${next}-tab`)
                  ?.focus();
              }}
            >
              <History
                aria-hidden="true"
                className="size-4 shrink-0"
                strokeWidth={2}
              />
              History
            </button>
          </div>

          {/* Record panel */}
          <form
            id="recovery-record-panel"
            role="tabpanel"
            aria-labelledby="recovery-record-tab"
            hidden={tab !== "record"}
            className="space-y-6"
            noValidate
            onSubmit={form.handleSubmit(submit)}
          >
            {/* Mutation error */}
            {mutation.isError ? (
              <Alert
                className="border-danger/25 bg-danger-soft text-danger"
                role="alert"
              >
                {mutation.error.message}
              </Alert>
            ) : null}

            {/* Section 1 — Action description */}
            <div className="space-y-3">
              <div className="flex items-start gap-2 border-b border-border pb-2">
                <FileText
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0 text-brand"
                  strokeWidth={1.8}
                />
                <div>
                  <h3
                    id="recovery-desc-heading"
                    className="text-sm font-semibold text-foreground"
                  >
                    Recovery action
                  </h3>
                  <p className="text-xs text-muted">
                    Describe the restored system or service, recovery steps,
                    validation results, and any remaining restrictions. Max
                    4,000 characters.
                  </p>
                </div>
              </div>
              <Textarea
                id="recovery-description"
                rows={5}
                maxLength={4000}
                disabled={mutation.isPending}
                aria-labelledby="recovery-desc-heading"
                aria-invalid={Boolean(form.formState.errors.description)}
                placeholder="e.g. Restored payment-service from clean backup snapshot v2.4.1; validated transaction processing on staging; enabled production traffic at 14:35."
                {...form.register("description")}
              />
              {form.formState.errors.description ? (
                <p className="text-danger text-xs" role="alert">
                  {form.formState.errors.description.message}
                </p>
              ) : null}
            </div>

            {/* Section 2 — Performed at */}
            <div className="space-y-3">
              <div className="flex items-start gap-2 border-b border-border pb-2">
                <Clock
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0 text-brand"
                  strokeWidth={1.8}
                />
                <div>
                  <h3
                    id="recovery-time-heading"
                    className="text-sm font-semibold text-foreground"
                  >
                    Performed at
                  </h3>
                  <p className="text-xs text-muted">
                    When this recovery step was carried out (your local time).
                  </p>
                </div>
              </div>
              <Input
                id="recovery-time"
                type="datetime-local"
                disabled={mutation.isPending}
                aria-labelledby="recovery-time-heading"
                aria-invalid={Boolean(form.formState.errors.performedAt)}
                {...form.register("performedAt")}
              />
              {form.formState.errors.performedAt ? (
                <p className="text-danger text-xs" role="alert">
                  {form.formState.errors.performedAt.message}
                </p>
              ) : null}
              <div className="border-border bg-neutral-soft/30 flex gap-2.5 rounded-xl border p-3.5">
                <Info
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0 text-muted"
                  strokeWidth={1.8}
                />
                <p className="text-xs text-muted">
                  The signed-in Security Officer is recorded as the performer.
                  Recording an action does not change the handling phase — use
                  Actions → Update handling phase to confirm verified recovery
                  and start Lessons learned.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-border pt-4">
              <div />
              <div className="flex items-center gap-3">
                <Button
                  variant="secondary"
                  disabled={mutation.isPending}
                  onClick={onClose}
                  type="button"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={mutation.isPending}>
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
                      <RotateCcw
                        aria-hidden="true"
                        className="size-4"
                        strokeWidth={1.8}
                      />
                      Record action
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>

          {/* History panel */}
          <div
            id="recovery-history-panel"
            role="tabpanel"
            aria-labelledby="recovery-history-tab"
            hidden={tab !== "history"}
            className="space-y-5"
          >
            {/* Section heading */}
            <div className="flex items-start gap-2 border-b border-border pb-2">
              <History
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 text-brand"
                strokeWidth={2}
              />
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Recovery history
                </h3>
                <p className="text-xs text-muted">
                  All recorded recovery actions for this incident.
                </p>
              </div>
            </div>

            {history.isPending ? (
              <div role="status" aria-busy="true" className="space-y-3">
                <span className="sr-only">Loading recovery history</span>
                <Skeleton className="h-24 rounded-xl" />
                <Skeleton className="h-24 rounded-xl" />
              </div>
            ) : history.isError ? (
              <Alert
                className="border-danger/25 bg-danger-soft text-danger"
                role="alert"
              >
                Unable to load recovery history.{" "}
                <Button
                  variant="secondary"
                  onClick={() => void history.refetch()}
                  type="button"
                >
                  Try again
                </Button>
              </Alert>
            ) : history.data?.items.length ? (
              <>
                <ol className="space-y-3">
                  {history.data.items.map((action) => (
                    <li
                      key={action.id}
                      className="border-border bg-surface rounded-xl border p-4"
                    >
                      <p className="text-sm [overflow-wrap:anywhere] whitespace-pre-wrap">
                        {action.description}
                      </p>
                      <p className="text-muted mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs [overflow-wrap:anywhere]">
                        <span className="font-medium text-foreground">
                          {action.performedBy.name}
                        </span>
                        <span aria-hidden="true">·</span>
                        <time dateTime={action.performedAt}>
                          {new Date(action.performedAt).toLocaleString()}
                        </time>
                      </p>
                    </li>
                  ))}
                </ol>
                <Pagination
                  page={page}
                  pageCount={history.data.pagination.totalPages}
                  onPageChange={setPage}
                />
              </>
            ) : (
              <div className="border-border bg-neutral-soft/30 rounded-xl border p-6 text-center">
                <HeartPulse
                  aria-hidden="true"
                  className="text-muted mx-auto mb-2 size-8"
                  strokeWidth={1.5}
                />
                <p className="text-sm font-medium text-foreground">
                  No recovery actions yet
                </p>
                <p className="text-muted mt-1 text-xs">
                  Actions recorded during this phase will appear here.
                </p>
              </div>
            )}

            <div className="flex justify-end border-t border-border pt-4">
              <Button
                variant="secondary"
                disabled={mutation.isPending}
                onClick={onClose}
                type="button"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </Dialog>
  );
}
