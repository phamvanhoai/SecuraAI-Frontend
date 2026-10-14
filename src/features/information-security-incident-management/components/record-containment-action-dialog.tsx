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
  containmentFormSchema,
  type ContainmentForm,
} from "../schemas/containment-action-schema";
import {
  useContainmentHistory,
  useRecordContainmentAction,
} from "../hooks/use-containment-actions";

export function RecordContainmentActionDialog({
  incident,
  onClose,
}: {
  incident: Incident | undefined;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [tab, setTab] = useState<"record" | "history">("record");
  const [page, setPage] = useState(1);
  const form = useForm<ContainmentForm>({
    resolver: zodResolver(containmentFormSchema),
    defaultValues: { description: "", performedAt: "" },
  });
  const mutation = useRecordContainmentAction();
  const history = useContainmentHistory(incident?.id, page);
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
        canRecordIncidentAction(incident.status, "containment")
          ? "record"
          : "history",
      );
      dialog.showModal();
    }
    if (!incident && dialog.open) dialog.close();
  }, [incident, resetForm, resetMutation]);
  const submit = async (values: ContainmentForm) => {
    if (!incident || !canRecordIncidentAction(incident.status, "containment"))
      return;
    try {
      await mutation.mutateAsync({ id: incident.id, values });
      form.reset();
      setPage(1);
      setTab("history");
      toast.success(
        "Containment action recorded",
        "The action is saved in incident response history.",
      );
    } catch {
      /* The persistent error below keeps the entered values available. */
    }
  };
  return (
    <Dialog
      dialogRef={dialogRef}
      title="Record containment action"
      onClose={onClose}
      onCancel={(event) => {
        if (mutation.isPending) event.preventDefault();
      }}
      className="max-h-[calc(100dvh-2rem)] w-[min(46rem,calc(100vw-2rem))] max-w-none overflow-y-auto"
    >
      {incident ? (
        <div className="space-y-5">
          {!canRecordIncidentAction(incident.status, "containment") &&
          incident.status !== "closed" ? (
            <Alert>
              Containment has not started. Use Actions → Update handling phase
              before recording containment actions.
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
            aria-label="Containment action views"
            className="border-border bg-surface inline-flex w-fit max-w-full items-center gap-1 rounded-xl border p-1"
          >
            {(["record", "history"] as const).map((view) => (
              <button
                key={view}
                id={`containment-${view}-tab`}
                type="button"
                role="tab"
                aria-selected={tab === view}
                aria-controls={`containment-${view}-panel`}
                tabIndex={tab === view ? 0 : -1}
                disabled={
                  view === "record" &&
                  !canRecordIncidentAction(incident.status, "containment")
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
                    !canRecordIncidentAction(incident.status, "containment") ||
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
                      `#containment-${next}-tab`,
                    )
                    ?.focus();
                }}
              >
                {view === "record" ? "Record action" : "History"}
              </button>
            ))}
          </div>
          <form
            id="containment-record-panel"
            role="tabpanel"
            aria-labelledby="containment-record-tab"
            hidden={tab !== "record"}
            className="space-y-4"
            noValidate
            onSubmit={form.handleSubmit(submit)}
          >
            {mutation.isError ? (
              <Alert role="alert">{mutation.error.message}</Alert>
            ) : null}
            <FormField
              id="containment-description"
              label="Containment action"
              error={form.formState.errors.description?.message}
            >
              <Textarea
                id="containment-description"
                rows={5}
                maxLength={4000}
                disabled={mutation.isPending}
                aria-invalid={Boolean(form.formState.errors.description)}
                aria-describedby={
                  form.formState.errors.description
                    ? "containment-description-error"
                    : "containment-description-help"
                }
                {...form.register("description")}
              />
              <p
                id="containment-description-help"
                className="text-muted text-xs"
              >
                Describe the steps taken, affected asset or service, and
                observed result to limit spread or impact.
              </p>
            </FormField>
            <FormField
              id="containment-time"
              label="Performed at"
              error={form.formState.errors.performedAt?.message}
            >
              <Input
                id="containment-time"
                type="datetime-local"
                disabled={mutation.isPending}
                aria-invalid={Boolean(form.formState.errors.performedAt)}
                aria-describedby={
                  form.formState.errors.performedAt
                    ? "containment-time-error"
                    : "containment-time-help"
                }
                {...form.register("performedAt")}
              />
              <p id="containment-time-help" className="text-muted text-xs">
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
            id="containment-history-panel"
            role="tabpanel"
            aria-labelledby="containment-history-tab"
            hidden={tab !== "history"}
            className="space-y-4"
          >
            {history.isPending ? (
              <div role="status" aria-busy="true">
                <span className="sr-only">Loading containment history</span>
                <Skeleton className="h-28" />
              </div>
            ) : history.isError ? (
              <Alert role="alert">
                Unable to load containment history.{" "}
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
              <Alert>No containment actions recorded for this incident.</Alert>
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
