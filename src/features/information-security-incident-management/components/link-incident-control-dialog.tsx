"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Pagination } from "@/components/data-display/pagination";
import { FormField } from "@/components/forms/form-field";
import { useToast } from "@/components/feedback/toast";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
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
          <div className="border-border bg-neutral-soft rounded-lg border p-4">
            <p className="text-muted text-xs font-medium tracking-wide uppercase">
              {incident.incidentCode}
            </p>
            <p className="mt-1 font-semibold break-words">{incident.title}</p>
          </div>
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
          {hasLinkedControls ? (
            <section
              aria-labelledby="linked-controls-heading"
              className="border-border rounded-lg border"
            >
              <div className="border-border border-b px-4 py-3">
                <h3
                  id="linked-controls-heading"
                  className="text-sm font-semibold"
                >
                  Already linked controls
                </h3>
                <p className="text-muted mt-0.5 text-xs">
                  These controls already provide context for this incident.
                </p>
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
                <ul className="divide-border divide-y">
                  {linkedControls.map((control) => (
                    <li className="px-4 py-3 text-sm" key={control.id}>
                      <div className="flex items-start justify-between gap-3">
                        <span className="min-w-0">
                          <span className="block font-medium">
                            {control.name}
                          </span>
                          <span className="text-muted block text-xs">
                            {control.controlCode} ·{" "}
                            {title(control.implementationStatus)}
                          </span>
                        </span>
                        {unlinkTargetId !== control.id ? (
                          <button
                            className="text-danger hover:bg-danger-soft focus-visible:outline-danger min-h-8 shrink-0 rounded-md px-2 text-xs font-semibold focus-visible:outline-2"
                            disabled={unlinkMutation.isPending}
                            onClick={() => setUnlinkTargetId(control.id)}
                            type="button"
                          >
                            Unlink
                          </button>
                        ) : null}
                      </div>
                      {unlinkTargetId === control.id ? (
                        <div className="border-danger/20 bg-danger-soft mt-3 rounded-md border p-3">
                          <p className="text-sm font-medium">
                            Remove this control link?
                          </p>
                          <p className="text-muted mt-1 text-xs">
                            The control and incident records will not be
                            deleted.
                          </p>
                          <div className="mt-3 flex justify-end gap-2">
                            <Button
                              className="min-h-9 px-3 py-1.5 text-xs"
                              disabled={unlinkMutation.isPending}
                              onClick={() => setUnlinkTargetId(undefined)}
                              variant="secondary"
                            >
                              Cancel
                            </Button>
                            <Button
                              className="min-h-9 px-3 py-1.5 text-xs"
                              disabled={unlinkMutation.isPending}
                              onClick={() => void unlink(control.id)}
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
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="control-search">
              Search available controls
            </label>
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
          </div>
          <FormField
            id="incident-control"
            label={
              hasLinkedControls ? "Additional control" : "Security control"
            }
            error={form.formState.errors.controlId?.message}
          >
            <Select
              id="incident-control"
              autoFocus
              disabled={
                availableOptions.isPending ||
                availableOptions.isError ||
                availableControls.length === 0
              }
              aria-invalid={Boolean(form.formState.errors.controlId)}
              {...form.register("controlId")}
            >
              <option value="">
                {availableOptions.isPending
                  ? "Loading security controls…"
                  : "Select a security control"}
              </option>
              {availableControls.map((control) => (
                <option key={control.id} value={control.id}>
                  {control.controlCode} — {control.name} (
                  {title(control.implementationStatus)})
                </option>
              ))}
            </Select>
            {!availableOptions.isPending &&
            !availableOptions.isError &&
            availableControls.length === 0 ? (
              <p className="text-muted text-xs">
                {availableSearch
                  ? "No available controls match this search."
                  : "All available controls are already linked to this incident."}
              </p>
            ) : (
              <p className="text-muted text-xs">
                Link the control involved in the incident. A control weakness is
                assessed separately in the next workflow step.
              </p>
            )}
          </FormField>
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
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={close}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending || availableControls.length === 0}
            >
              {mutation.isPending
                ? "Linking…"
                : hasLinkedControls
                  ? "Link another control"
                  : "Link control"}
            </Button>
          </div>
        </form>
      ) : null}
    </Dialog>
  );
}
