"use client";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormField } from "@/components/forms/form-field";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/data-display/pagination";
import { useToast } from "@/components/feedback/toast";
import { cn } from "@/lib/utils";
import type { Incident } from "../schemas/report-incident-schema";
import { canRecordIncidentAction } from "../schemas/incident-workflow";
import {
  eradicationFormSchema,
  type EradicationForm,
} from "../schemas/eradication-action-schema";
import {
  useEradicationHistory,
  useRecordEradicationAction,
} from "../hooks/use-eradication-actions";

export function RecordEradicationActionDialog({
  incident,
  onClose,
}: {
  incident: Incident | undefined;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [tab, setTab] = useState<"record" | "history">("record");
  const [page, setPage] = useState(1);
  const form = useForm<EradicationForm>({
    resolver: zodResolver(eradicationFormSchema),
    defaultValues: { description: "", performedAt: "" },
  });
  const mutation = useRecordEradicationAction();
  const history = useEradicationHistory(incident?.id, page);
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
        canRecordIncidentAction(incident.status, "eradication")
          ? "record"
          : "history",
      );
      dialog.showModal();
    }
    if (!incident && dialog.open) dialog.close();
  }, [incident, resetForm, resetMutation]);
  const submit = async (values: EradicationForm) => {
    if (!incident || !canRecordIncidentAction(incident.status, "eradication"))
      return;
    try {
      await mutation.mutateAsync({ id: incident.id, values });
      form.reset();
      setPage(1);
      setTab("history");
      toast.success(
        "Eradication action recorded",
        "The action is saved in incident response history.",
      );
    } catch {
      /* The persistent error below keeps the entered values available. */
    }
  };
  return (
    <Dialog
      dialogRef={dialogRef}
      title="Record eradication action"
      onClose={onClose}
      onCancel={(event) => {
        if (mutation.isPending) event.preventDefault();
      }}
      className="max-h-[calc(100dvh-2rem)] w-[min(46rem,calc(100vw-2rem))] max-w-none overflow-y-auto"
    >
      {incident ? (
        <div className="space-y-5">
          {!canRecordIncidentAction(incident.status, "eradication") &&
          incident.status !== "closed" ? (
            <Alert>
              Eradication has not started. Use Actions → Update handling phase
              before recording eradication actions.
            </Alert>
          ) : null}
          <div className="border-border bg-neutral-soft rounded-lg border p-4">
            <p className="text-muted text-xs font-medium">
              {incident.incidentCode}
            </p>
            <p className="mt-1 font-semibold [overflow-wrap:anywhere]">
              {incident.title}
            </p>
          </div>
          <div
            role="tablist"
            aria-label="Eradication action views"
            className="border-border bg-surface inline-flex w-fit max-w-full items-center gap-1 rounded-xl border p-1"
          >
            {(["record", "history"] as const).map((view) => (
              <button
                key={view}
                id={`eradication-${view}-tab`}
                type="button"
                role="tab"
                aria-selected={tab === view}
                aria-controls={`eradication-${view}-panel`}
                tabIndex={tab === view ? 0 : -1}
                disabled={
                  view === "record" &&
                  !canRecordIncidentAction(incident.status, "eradication")
                }
                className={cn(
                  "focus-visible:outline-brand inline-flex min-h-11 flex-none items-center justify-center rounded-lg px-3.5 py-2 text-sm font-medium focus-visible:outline-2 disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-10",
                  tab === view
                    ? "bg-brand text-brand-contrast font-semibold"
                    : "text-muted hover:bg-neutral-soft",
                )}
                onClick={() => setTab(view)}
                onKeyDown={(event) => {
                  if (
                    !canRecordIncidentAction(incident.status, "eradication") ||
                    !["ArrowLeft", "ArrowRight", "Home", "End"].includes(
                      event.key,
                    )
                  )
                    return;
                  event.preventDefault();
                  const next =
                    event.key === "Home"
                      ? "record"
                      : event.key === "End"
                        ? "history"
                        : view === "record"
                          ? "history"
                          : "record";
                  setTab(next);
                  event.currentTarget.parentElement
                    ?.querySelector<HTMLButtonElement>(
                      `#eradication-${next}-tab`,
                    )
                    ?.focus();
                }}
              >
                {view === "record" ? "Record action" : "History"}
              </button>
            ))}
          </div>
          <form
            id="eradication-record-panel"
            role="tabpanel"
            aria-labelledby="eradication-record-tab"
            hidden={tab !== "record"}
            className="space-y-4"
            noValidate
            onSubmit={form.handleSubmit(submit)}
          >
            {mutation.isError ? (
              <Alert role="alert">{mutation.error.message}</Alert>
            ) : null}
            <FormField
              id="eradication-description"
              label="Eradication action"
              error={form.formState.errors.description?.message}
            >
              <Textarea
                id="eradication-description"
                rows={5}
                maxLength={4000}
                disabled={mutation.isPending}
                aria-invalid={Boolean(form.formState.errors.description)}
                aria-describedby={
                  form.formState.errors.description
                    ? "eradication-description-error"
                    : "eradication-description-help"
                }
                {...form.register("description")}
              />
              <p
                id="eradication-description-help"
                className="text-muted text-xs"
              >
                Describe what root cause, malicious component, or threat was
                removed, the affected asset or account, and verification
                results.
              </p>
            </FormField>
            <FormField
              id="eradication-time"
              label="Performed at"
              error={form.formState.errors.performedAt?.message}
            >
              <Input
                id="eradication-time"
                type="datetime-local"
                disabled={mutation.isPending}
                aria-invalid={Boolean(form.formState.errors.performedAt)}
                aria-describedby={
                  form.formState.errors.performedAt
                    ? "eradication-time-error"
                    : "eradication-time-help"
                }
                {...form.register("performedAt")}
              />
              <p id="eradication-time-help" className="text-muted text-xs">
                Your local time. The signed-in Security Officer is recorded as
                the performer.
              </p>
            </FormField>
            <Alert>
              Saving an action does not change the handling phase. Use Actions →
              Update handling phase after completing this phase.
            </Alert>
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                disabled={mutation.isPending}
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Saving…" : "Record action"}
              </Button>
            </div>
          </form>
          <div
            id="eradication-history-panel"
            role="tabpanel"
            aria-labelledby="eradication-history-tab"
            hidden={tab !== "history"}
            className="space-y-4"
          >
            {history.isPending ? (
              <div role="status" aria-busy="true">
                <span className="sr-only">Loading eradication history</span>
                <Skeleton className="h-28" />
              </div>
            ) : history.isError ? (
              <Alert role="alert">
                Unable to load eradication history.{" "}
                <Button
                  variant="secondary"
                  onClick={() => void history.refetch()}
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
                      className="border-border rounded-lg border p-4"
                    >
                      <p className="text-sm [overflow-wrap:anywhere] whitespace-pre-wrap">
                        {action.description}
                      </p>
                      <p className="text-muted mt-2 text-xs [overflow-wrap:anywhere]">
                        {action.performedBy.name} ·{" "}
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
              <Alert>No eradication actions recorded for this incident.</Alert>
            )}
            <div className="flex justify-end">
              <Button
                variant="secondary"
                disabled={mutation.isPending}
                onClick={onClose}
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
