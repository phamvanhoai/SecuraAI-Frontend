"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  CheckCircle2,
  Link2,
  Loader2,
  Search,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Pagination } from "@/components/data-display/pagination";
import { useToast } from "@/components/feedback/toast";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  useIncidentControlOptions,
  useLinkIncidentToControl,
  useUnlinkIncidentFromControl,
} from "../hooks/use-incidents";
import {
  linkIncidentControlFormSchema,
  type LinkIncidentControlForm,
} from "../schemas/incident-control-schema";
import type { Incident } from "../schemas/report-incident-schema";

const title = (value: string) =>
  value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

export function LinkIncidentControlDialog({
  incident,
  onClose,
}: {
  incident: Incident | undefined;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [availableDraft, setAvailableDraft] = useState("");
  const [availableSearch, setAvailableSearch] = useState("");
  const [availablePage, setAvailablePage] = useState(1);
  const [linkedDraft, setLinkedDraft] = useState("");
  const [linkedSearch, setLinkedSearch] = useState("");
  const [linkedPage, setLinkedPage] = useState(1);
  const [unlinkTargetId, setUnlinkTargetId] = useState<string>();
  const availableOptions = useIncidentControlOptions(incident?.id, {
    q: availableSearch,
    scope: "unlinked",
    page: availablePage,
    limit: 10,
  });
  const linkedOptions = useIncidentControlOptions(incident?.id, {
    q: linkedSearch,
    scope: "linked",
    page: linkedPage,
    limit: 5,
  });
  const mutation = useLinkIncidentToControl();
  const unlinkMutation = useUnlinkIncidentFromControl();
  const toast = useToast();
  const form = useForm<LinkIncidentControlForm>({
    resolver: zodResolver(linkIncidentControlFormSchema),
    defaultValues: { controlId: "" },
  });
  const selectedControlId = form.watch("controlId");
  const availableControls = availableOptions.data?.controls ?? [];
  const linkedControls = linkedOptions.data?.controls ?? [];
  const hasLinkedControls = incident
    ? incident.relatedCounts.controls > 0
    : false;

  useEffect(() => {
    if (incident) {
      form.reset({ controlId: "" });
      ref.current?.showModal();
    } else ref.current?.close();
  }, [form, incident]);

  const close = () => {
    setUnlinkTargetId(undefined);
    setAvailableDraft("");
    setAvailableSearch("");
    setAvailablePage(1);
    setLinkedDraft("");
    setLinkedSearch("");
    setLinkedPage(1);
    onClose();
  };
  const searchAvailableControls = () => {
    setAvailableSearch(availableDraft.trim());
    setAvailablePage(1);
    form.reset({ controlId: "" });
  };
  const searchLinkedControls = () => {
    setLinkedSearch(linkedDraft.trim());
    setLinkedPage(1);
  };
  const submit = async (values: LinkIncidentControlForm) => {
    if (!incident) return;
    try {
      const linked = await mutation.mutateAsync({ id: incident.id, values });
      toast.success(
        "Control linked",
        `${linked.control.controlCode} is now linked to ${linked.incident.incidentCode}.`,
      );
      close();
    } catch {
      /* The normalized API error remains visible. */
    }
  };
  const unlink = async (controlId: string) => {
    if (!incident) return;
    const control = linkedControls.find((item) => item.id === controlId);
    try {
      await unlinkMutation.mutateAsync({ incidentId: incident.id, controlId });
      toast.success(
        "Control unlinked",
        `${control?.controlCode ?? "The control"} is no longer linked to ${incident.incidentCode}.`,
      );
      setUnlinkTargetId(undefined);
    } catch {
      /* The normalized API error remains visible. */
    }
  };

  return (
    <Dialog
      dialogRef={ref}
      title={
        hasLinkedControls ? "Link another control" : "Link incident to control"
      }
      className="max-h-[calc(100dvh-2rem)] w-[min(42rem,calc(100%-2rem))] overflow-y-auto"
      onClose={close}
    >
      {incident ? (
        <form
          className="space-y-5"
          noValidate
          onSubmit={form.handleSubmit(submit)}
        >
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

          {/* Alerts */}
          {availableOptions.isError || linkedOptions.isError ? (
            <Alert className="border-danger/25 bg-danger-soft text-danger">
              Unable to load security controls. Check your session and backend
              connection.
            </Alert>
          ) : null}
          {mutation.isError ? (
            <Alert className="border-danger/25 bg-danger-soft text-danger">
              {mutation.error instanceof Error
                ? mutation.error.message
                : "Unable to link this control."}
            </Alert>
          ) : null}
          {unlinkMutation.isError ? (
            <Alert className="border-danger/25 bg-danger-soft text-danger">
              {unlinkMutation.error instanceof Error
                ? unlinkMutation.error.message
                : "Unable to unlink this control."}
            </Alert>
          ) : null}

          {/* Linked controls section */}
          {hasLinkedControls ? (
            <section
              aria-labelledby="linked-controls-heading"
              className="border-border bg-neutral-soft/30 rounded-xl border"
            >
              <div className="border-border border-b p-4">
                <div className="border-border flex items-center gap-2 border-b pb-2">
                  <CheckCircle2
                    aria-hidden="true"
                    className="text-brand size-4"
                  />
                  <div>
                    <h3
                      id="linked-controls-heading"
                      className="text-foreground text-sm font-semibold"
                    >
                      Linked controls
                    </h3>
                    <p className="text-muted text-xs">
                      These controls already provide context for this incident.
                    </p>
                  </div>
                </div>
                {/* Linked search row */}
                <div className="mt-3 flex gap-2">
                  <label className="relative min-w-0 flex-1">
                    <span className="sr-only">Search linked controls</span>
                    <Search
                      aria-hidden="true"
                      className="text-muted absolute top-1/2 left-3 size-4 -translate-y-1/2"
                      strokeWidth={1.8}
                    />
                    <Input
                      className="min-h-10 pl-9"
                      maxLength={100}
                      onChange={(event) => setLinkedDraft(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          searchLinkedControls();
                        }
                      }}
                      placeholder="Search linked controls"
                      value={linkedDraft}
                    />
                  </label>
                  <Button
                    aria-label="Search linked controls"
                    className="min-h-10 px-3"
                    onClick={searchLinkedControls}
                    type="button"
                    variant="secondary"
                  >
                    Search
                  </Button>
                </div>
              </div>
              {linkedOptions.isPending ? (
                <p className="text-muted px-4 py-6 text-center text-sm">
                  Loading linked controls…
                </p>
              ) : linkedControls.length === 0 ? (
                <p className="text-muted px-4 py-6 text-center text-sm">
                  No linked controls match this search.
                </p>
              ) : (
                <ul className="space-y-2.5 p-4">
                  {linkedControls.map((control) => (
                    <li
                      key={control.id}
                      className="border-border bg-surface flex flex-col gap-2 rounded-xl border p-3.5 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="font-medium break-words">
                          {control.name}
                        </p>
                        <p className="text-muted mt-0.5 text-xs">
                          {control.controlCode} ·{" "}
                          {title(control.implementationStatus)}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {unlinkTargetId !== control.id ? (
                          <button
                            className="text-danger hover:bg-danger-soft focus-visible:outline-danger min-h-8 rounded-md px-2 text-xs font-semibold focus-visible:outline-2"
                            disabled={unlinkMutation.isPending}
                            onClick={() => setUnlinkTargetId(control.id)}
                            type="button"
                          >
                            Unlink
                          </button>
                        ) : null}
                      </div>
                      {unlinkTargetId === control.id ? (
                        <div className="border-danger/20 bg-danger-soft mt-3 rounded-xl border p-3">
                          <p className="text-sm font-semibold">
                            Remove this control link?
                          </p>
                          <p className="text-muted mt-1 text-xs">
                            The control and incident records will not be
                            deleted.
                          </p>
                          <div className="mt-3 flex justify-end gap-2">
                            <Button
                              className="min-h-9 px-3 text-xs"
                              disabled={unlinkMutation.isPending}
                              onClick={() => setUnlinkTargetId(undefined)}
                              type="button"
                              variant="secondary"
                            >
                              Cancel
                            </Button>
                            <Button
                              className="min-h-9 px-3 text-xs"
                              disabled={unlinkMutation.isPending}
                              onClick={() => void unlink(control.id)}
                              type="button"
                              variant="danger"
                            >
                              {unlinkMutation.isPending
                                ? "Unlinking…"
                                : "Remove link"}
                            </Button>
                          </div>
                        </div>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
              {linkedOptions.data &&
              linkedOptions.data.pagination.totalPages > 1 ? (
                <div className="border-border border-t px-4 py-3">
                  <Pagination
                    onPageChange={setLinkedPage}
                    page={linkedOptions.data.pagination.page}
                    pageCount={linkedOptions.data.pagination.totalPages}
                  />
                </div>
              ) : null}
            </section>
          ) : null}

          {/* Available controls — radio card list */}
          <section
            aria-labelledby="available-controls-heading"
            className="space-y-4"
          >
            <div className="border-border flex items-center gap-2 border-b pb-2">
              <ShieldCheck
                aria-hidden="true"
                className="text-brand size-4"
                strokeWidth={1.8}
              />
              <div>
                <h3
                  id="available-controls-heading"
                  className="text-foreground text-sm font-semibold"
                >
                  {hasLinkedControls
                    ? "Link another control"
                    : "Select a control to link"}
                </h3>
                <p className="text-muted text-xs">
                  Link the control involved in the incident. A control weakness
                  is assessed separately in the next workflow step.
                </p>
              </div>
            </div>

            {/* Search row */}
            <div className="flex gap-2">
              <div className="relative min-w-0 flex-1">
                <Search
                  aria-hidden="true"
                  className="text-muted absolute top-1/2 left-3 size-4 -translate-y-1/2"
                  strokeWidth={1.8}
                />
                <Input
                  className="pl-9"
                  id="control-search"
                  maxLength={100}
                  onChange={(event) => setAvailableDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      searchAvailableControls();
                    }
                  }}
                  placeholder="Search by control code or name"
                  value={availableDraft}
                />
              </div>
              <Button
                aria-label="Search available controls"
                onClick={searchAvailableControls}
                type="button"
                variant="secondary"
              >
                Search
              </Button>
            </div>

            {/* Radio card list */}
            {availableOptions.isPending ? (
              <div className="border-border bg-neutral-soft/20 rounded-xl border p-8 text-center">
                <p className="text-muted text-sm">Loading security controls…</p>
              </div>
            ) : availableControls.length === 0 ? (
              <div className="border-border bg-neutral-soft/20 rounded-xl border p-8 text-center">
                <ShieldCheck
                  aria-hidden="true"
                  className="text-muted mx-auto size-8 stroke-1"
                />
                <p className="text-muted mt-2 text-sm">
                  {availableSearch
                    ? "No controls match this search."
                    : "All available controls are already linked to this incident."}
                </p>
              </div>
            ) : (
              <ul
                className="space-y-2"
                role="radiogroup"
                aria-labelledby="available-controls-heading"
              >
                {availableControls.map((control) => {
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
                              {title(control.implementationStatus)}
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

            {/* Validation error */}
            {form.formState.errors.controlId ? (
              <p className="text-danger text-sm">
                {form.formState.errors.controlId.message}
              </p>
            ) : null}

            {/* Pagination */}
            {availableOptions.data &&
            availableOptions.data.pagination.totalPages > 1 ? (
              <Pagination
                onPageChange={(page) => {
                  setAvailablePage(page);
                  form.reset({ controlId: "" });
                }}
                page={availableOptions.data.pagination.page}
                pageCount={availableOptions.data.pagination.totalPages}
              />
            ) : null}
          </section>

          {/* Footer actions */}
          <div className="border-border flex items-center justify-between border-t pt-4">
            <div />
            <div className="flex items-center gap-3">
              <Button variant="secondary" onClick={close} type="button">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={mutation.isPending || !selectedControlId}
              >
                {mutation.isPending ? (
                  <>
                    <Loader2
                      aria-hidden="true"
                      className="size-4 animate-spin"
                    />
                    Linking…
                  </>
                ) : (
                  <>
                    <Link2
                      aria-hidden="true"
                      className="size-4"
                      strokeWidth={1.8}
                    />
                    {hasLinkedControls
                      ? "Link another control"
                      : "Link control"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      ) : null}
    </Dialog>
  );
}
