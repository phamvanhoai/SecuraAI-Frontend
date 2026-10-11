"use client";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormField } from "@/components/forms/form-field";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/data-display/pagination";
import { useToast } from "@/components/feedback/toast";
import { cn } from "@/lib/utils";
import type { Incident } from "../schemas/report-incident-schema";
import {
  analysisFormSchema,
  type AnalysisForm,
} from "../schemas/incident-analysis-schema";
import {
  useIncidentAnalysis,
  useAnalysisHistory,
  useSaveIncidentAnalysis,
} from "../hooks/use-incident-analysis";

const empty: AnalysisForm = {
  rootCause: "",
  lessonsLearned: "",
  improvementActions: "",
};
const fields = [
  {
    key: "rootCause",
    label: "Identified root cause",
    help: "Explain the verified underlying cause, contributing factors, and supporting investigation references.",
  },
  {
    key: "lessonsLearned",
    label: "Lessons learned",
    help: "Describe what worked, what failed, and what should change in future responses.",
  },
  {
    key: "improvementActions",
    label: "Recommended improvements",
    help: "Document preventive controls or process improvements, responsible teams, and suggested target dates.",
  },
] as const;

export function RootCauseAnalysisDialog({
  incident,
  onClose,
}: {
  incident: Incident | undefined;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const hydratedId = useRef<string | undefined>(undefined);
  const [tab, setTab] = useState<"findings" | "history">("findings");
  const [page, setPage] = useState(1);
  const [expectedUpdatedAt, setExpectedUpdatedAt] = useState<string | null>(
    null,
  );
  const form = useForm<AnalysisForm>({
    resolver: zodResolver(analysisFormSchema),
    defaultValues: empty,
  });
  const current = useIncidentAnalysis(incident?.id);
  const history = useAnalysisHistory(incident?.id, page);
  const mutation = useSaveIncidentAnalysis();
  const toast = useToast();
  const canEdit =
    incident?.status !== "closed" && current.data?.canEdit === true;
  const reset = form.reset;
  const isDirty = form.formState.isDirty;
  const resetMutation = mutation.reset;
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (incident && !dialog.open) {
      hydratedId.current = undefined;
      reset(empty);
      resetMutation();
      setPage(1);
      setTab("findings");
      setExpectedUpdatedAt(null);
      dialog.showModal();
    }
    if (!incident && dialog.open) {
      hydratedId.current = undefined;
      dialog.close();
    }
  }, [incident, reset, resetMutation]);
  useEffect(() => {
    if (
      !incident ||
      !current.data ||
      (hydratedId.current === incident.id && canEdit)
    )
      return;
    const analysis = current.data.analysis;
    reset({
      rootCause: analysis?.rootCause ?? "",
      lessonsLearned: analysis?.lessonsLearned ?? "",
      improvementActions: analysis?.improvementActions ?? "",
    });
    setExpectedUpdatedAt(analysis?.updatedAt ?? null);
    hydratedId.current = incident.id;
  }, [incident, current.data, canEdit, reset]);
  const close = () => {
    if (mutation.isPending) return;
    if (isDirty && !window.confirm("Discard unsaved findings?")) return;
    onClose();
  };
  const reload = async () => {
    if (
      isDirty &&
      !window.confirm(
        "Replace your unsaved findings with the latest saved findings?",
      )
    )
      return;
    const result = await current.refetch();
    if (!result.data || result.isError) return;
    const analysis = result.data.analysis;
    reset({
      rootCause: analysis?.rootCause ?? "",
      lessonsLearned: analysis?.lessonsLearned ?? "",
      improvementActions: analysis?.improvementActions ?? "",
    });
    setExpectedUpdatedAt(analysis?.updatedAt ?? null);
    resetMutation();
  };
  const submit = async (values: AnalysisForm) => {
    if (!incident || !canEdit) return;
    try {
      const analysis = await mutation.mutateAsync({
        id: incident.id,
        values,
        expectedUpdatedAt,
      });
      reset(values);
      setExpectedUpdatedAt(analysis.updatedAt);
      setPage(1);
      setTab("history");
      toast.success(
        "Findings saved",
        "Root cause, lessons learned and recommendations are recorded.",
      );
    } catch {
      /* Keep entered findings and show the persistent error. */
    }
  };
  return (
    <Dialog
      dialogRef={dialogRef}
      title="Root cause analysis & lessons learned"
      onClose={onClose}
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      className="max-h-[calc(100dvh-2rem)] w-[min(46rem,calc(100vw-2rem))] max-w-none overflow-y-auto"
    >
      {incident ? (
        <div className="space-y-5">
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
            aria-label="Root cause analysis views"
            className="border-border bg-surface inline-flex w-fit max-w-full items-center gap-1 rounded-xl border p-1"
          >
            {(["findings", "history"] as const).map((view) => (
              <button
                key={view}
                type="button"
                role="tab"
                id={`rca-${view}-tab`}
                aria-selected={tab === view}
                aria-controls={`rca-${view}-panel`}
                tabIndex={tab === view ? 0 : -1}
                className={cn(
                  "focus-visible:outline-brand inline-flex min-h-11 flex-none items-center justify-center rounded-lg px-3.5 py-2 text-sm font-medium focus-visible:outline-2 sm:min-h-10",
                  tab === view
                    ? "bg-brand text-brand-contrast font-semibold"
                    : "text-muted hover:bg-neutral-soft",
                )}
                onClick={() => setTab(view)}
                onKeyDown={(event) => {
                  if (
                    !["ArrowLeft", "ArrowRight", "Home", "End"].includes(
                      event.key,
                    )
                  )
                    return;
                  event.preventDefault();
                  const next =
                    event.key === "Home"
                      ? "findings"
                      : event.key === "End"
                        ? "history"
                        : view === "findings"
                          ? "history"
                          : "findings";
                  setTab(next);
                  event.currentTarget.parentElement
                    ?.querySelector<HTMLButtonElement>(`#rca-${next}-tab`)
                    ?.focus();
                }}
              >
                {view === "findings" ? "Findings" : "History"}
              </button>
            ))}
          </div>
          <div
            role="tabpanel"
            id="rca-findings-panel"
            aria-labelledby="rca-findings-tab"
            hidden={tab !== "findings"}
            className="space-y-4"
          >
            {current.isPending ? (
              <div role="status" aria-busy="true">
                <span className="sr-only">Loading findings</span>
                <Skeleton className="h-48" />
              </div>
            ) : current.isError ? (
              <Alert role="alert">
                Unable to load findings.{" "}
                <Button
                  variant="secondary"
                  onClick={() => void current.refetch()}
                >
                  Try again
                </Button>
              </Alert>
            ) : current.data ? (
              <form
                className="space-y-4"
                noValidate
                onSubmit={form.handleSubmit(submit)}
              >
                {mutation.isError ? (
                  <Alert role="alert">
                    {mutation.error.message}{" "}
                    <Button variant="secondary" onClick={() => void reload()}>
                      Reload latest findings
                    </Button>
                  </Alert>
                ) : null}
                {!canEdit ? (
                  <Alert>
                    {incident.status === "closed"
                      ? "This incident is closed. Findings and history are read-only."
                      : current.data.editRestriction}
                  </Alert>
                ) : (
                  <Alert>
                    Document verified findings after response is complete.
                    Saving does not close the incident or complete improvement
                    work.
                  </Alert>
                )}
                {fields.map((field) => (
                  <FormField
                    key={field.key}
                    id={`rca-${field.key}`}
                    label={field.label}
                    error={form.formState.errors[field.key]?.message}
                  >
                    <Textarea
                      id={`rca-${field.key}`}
                      rows={4}
                      maxLength={4000}
                      readOnly={!canEdit}
                      disabled={mutation.isPending}
                      aria-invalid={Boolean(form.formState.errors[field.key])}
                      aria-describedby={
                        form.formState.errors[field.key]
                          ? `rca-${field.key}-error`
                          : `rca-${field.key}-help`
                      }
                      {...form.register(field.key)}
                    />
                    <p
                      id={`rca-${field.key}-help`}
                      className="text-muted text-xs"
                    >
                      {field.help}
                    </p>
                  </FormField>
                ))}
                {current.data.analysis ? (
                  <p className="text-muted text-xs">
                    Last saved by {current.data.analysis.analyzedBy.name} ·{" "}
                    <time dateTime={current.data.analysis.analyzedAt}>
                      {new Date(
                        current.data.analysis.analyzedAt,
                      ).toLocaleString()}
                    </time>
                  </p>
                ) : null}
                <div className="flex justify-end gap-2">
                  <Button
                    variant="secondary"
                    onClick={close}
                    disabled={mutation.isPending}
                  >
                    Close
                  </Button>
                  {canEdit ? (
                    <Button type="submit" disabled={mutation.isPending}>
                      {mutation.isPending ? "Saving…" : "Save findings"}
                    </Button>
                  ) : null}
                </div>
              </form>
            ) : null}
          </div>
          <div
            role="tabpanel"
            id="rca-history-panel"
            aria-labelledby="rca-history-tab"
            hidden={tab !== "history"}
            className="space-y-4"
          >
            {history.isPending ? (
              <div role="status" aria-busy="true">
                <span className="sr-only">Loading analysis history</span>
                <Skeleton className="h-48" />
              </div>
            ) : history.isError ? (
              <Alert role="alert">
                Unable to load analysis history.{" "}
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
                  {history.data.items.map((entry) => (
                    <li
                      key={entry.id}
                      className="border-border rounded-lg border p-4"
                    >
                      <p className="text-muted text-xs">
                        {entry.savedBy?.name ?? "Unknown officer"} ·{" "}
                        <time dateTime={entry.savedAt}>
                          {new Date(entry.savedAt).toLocaleString()}
                        </time>
                      </p>
                      {entry.findings ? (
                        <dl className="mt-3 space-y-3">
                          {fields.map((field) => (
                            <div key={field.key}>
                              <dt className="text-sm font-semibold">
                                {field.label}
                              </dt>
                              <dd className="mt-1 text-sm [overflow-wrap:anywhere] whitespace-pre-wrap">
                                {entry.findings?.[field.key] ?? "Not recorded"}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      ) : (
                        <Alert>
                          Findings for this historical record are unavailable.
                        </Alert>
                      )}
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
              <Alert>No analysis history recorded for this incident.</Alert>
            )}
            <div className="flex justify-end">
              <Button
                variant="secondary"
                onClick={close}
                disabled={mutation.isPending}
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
