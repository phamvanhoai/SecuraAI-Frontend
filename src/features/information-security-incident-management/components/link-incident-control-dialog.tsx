"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { FormField } from "@/components/forms/form-field";
import { useToast } from "@/components/feedback/toast";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import {
  useIncidentControlOptions,
  useLinkIncidentToControl,
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
  const options = useIncidentControlOptions(incident?.id);
  const mutation = useLinkIncidentToControl();
  const toast = useToast();
  const form = useForm<LinkIncidentControlForm>({
    resolver: zodResolver(linkIncidentControlFormSchema),
    defaultValues: { controlId: "" },
  });
  const availableControls = useMemo(
    () => options.data?.controls.filter((control) => !control.linked) ?? [],
    [options.data],
  );

  useEffect(() => {
    if (incident) {
      form.reset({ controlId: "" });
      ref.current?.showModal();
    } else ref.current?.close();
  }, [form, incident]);

  const submit = async (values: LinkIncidentControlForm) => {
    if (!incident) return;
    try {
      const linked = await mutation.mutateAsync({ id: incident.id, values });
      toast.success(
        "Control linked",
        `${linked.control.controlCode} is now linked to ${linked.incident.incidentCode}.`,
      );
      onClose();
    } catch {
      // The normalized API error remains visible in the dialog.
    }
  };

  return (
    <Dialog
      dialogRef={ref}
      title="Link incident to control"
      className="max-h-[calc(100dvh-2rem)] w-[min(38rem,calc(100%-2rem))] overflow-y-auto"
      onClose={onClose}
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
          {options.isError ? (
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
          <FormField
            id="incident-control"
            label="Security control"
            error={form.formState.errors.controlId?.message}
          >
            <Select
              id="incident-control"
              autoFocus
              disabled={
                options.isPending ||
                options.isError ||
                availableControls.length === 0
              }
              aria-invalid={Boolean(form.formState.errors.controlId)}
              {...form.register("controlId")}
            >
              <option value="">
                {options.isPending
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
            {!options.isPending &&
            !options.isError &&
            availableControls.length === 0 ? (
              <p className="text-muted text-xs">
                All available controls are already linked to this incident.
              </p>
            ) : (
              <p className="text-muted text-xs">
                Link the control involved in the incident. A control weakness is
                assessed separately in the next workflow step.
              </p>
            )}
          </FormField>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending || availableControls.length === 0}
            >
              {mutation.isPending ? "Linking…" : "Link control"}
            </Button>
          </div>
        </form>
      ) : null}
    </Dialog>
  );
}
