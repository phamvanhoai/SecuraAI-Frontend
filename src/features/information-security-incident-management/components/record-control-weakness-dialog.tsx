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
import { Textarea } from "@/components/ui/textarea";
import {
  useControlWeaknessOptions,
  useRecordControlWeakness,
} from "../hooks/use-incidents";
import {
  recordControlWeaknessFormSchema,
  type RecordControlWeaknessForm,
} from "../schemas/control-weakness-schema";
import type { Incident } from "../schemas/report-incident-schema";

const title = (value: string) =>
  value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

export function RecordControlWeaknessDialog({
  incident,
  onClose,
}: {
  incident: Incident | undefined;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const options = useControlWeaknessOptions(incident?.id);
  const mutation = useRecordControlWeakness();
  const toast = useToast();
  const form = useForm<RecordControlWeaknessForm>({
    resolver: zodResolver(recordControlWeaknessFormSchema),
    defaultValues: { controlId: "", severity: "medium", description: "" },
  });
  const available = useMemo(
    () =>
      options.data?.controls.filter((control) => !control.hasOpenWeakness) ??
      [],
    [options.data],
  );
  useEffect(() => {
    if (incident) {
      form.reset({ controlId: "", severity: "medium", description: "" });
      ref.current?.showModal();
    } else ref.current?.close();
  }, [form, incident]);
  const submit = async (values: RecordControlWeaknessForm) => {
    if (!incident) return;
    try {
      const finding = await mutation.mutateAsync({ id: incident.id, values });
      toast.success(
        "Control weakness recorded",
        `${finding.control.controlCode} now has an open weakness from ${finding.incident.incidentCode}.`,
      );
      onClose();
    } catch {
      /* The normalized API error remains visible. */
    }
  };
  return (
    <Dialog
      dialogRef={ref}
      title="Record control weakness"
      className="max-h-[calc(100dvh-2rem)] w-[min(42rem,calc(100%-2rem))] overflow-y-auto"
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
              Unable to load linked controls. Link a control to this incident
              first.
            </Alert>
          ) : null}
          {mutation.isError ? (
            <Alert className="border-danger/25 bg-danger-soft text-danger">
              {mutation.error instanceof Error
                ? mutation.error.message
                : "Unable to record this weakness."}
            </Alert>
          ) : null}
          <FormField
            id="weakness-control"
            label="Linked control"
            error={form.formState.errors.controlId?.message}
          >
            <Select
              id="weakness-control"
              autoFocus
              disabled={
                options.isPending || options.isError || available.length === 0
              }
              {...form.register("controlId")}
            >
              <option value="">
                {options.isPending
                  ? "Loading linked controls…"
                  : "Select a linked control"}
              </option>
              {available.map((control) => (
                <option key={control.id} value={control.id}>
                  {control.controlCode} — {control.name} (
                  {title(control.implementationStatus)})
                </option>
              ))}
            </Select>
            {!options.isPending &&
            !options.isError &&
            available.length === 0 ? (
              <p className="text-muted text-xs">
                No linked control is available, or each linked control already
                has an open weakness.
              </p>
            ) : null}
          </FormField>
          <FormField
            id="weakness-severity"
            label="Severity"
            error={form.formState.errors.severity?.message}
          >
            <Select id="weakness-severity" {...form.register("severity")}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </Select>
          </FormField>
          <FormField
            id="weakness-description"
            label="Weakness description"
            error={form.formState.errors.description?.message}
          >
            <Textarea
              id="weakness-description"
              className="min-h-32"
              maxLength={5000}
              placeholder="Explain how the control failed or was not applied during this incident."
              {...form.register("description")}
            />
            <p className="text-muted text-xs">
              Record observable facts. Risk reassessment is a separate reviewed
              step.
            </p>
          </FormField>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending || available.length === 0}
            >
              {mutation.isPending ? "Recording…" : "Record weakness"}
            </Button>
          </div>
        </form>
      ) : null}
    </Dialog>
  );
}
