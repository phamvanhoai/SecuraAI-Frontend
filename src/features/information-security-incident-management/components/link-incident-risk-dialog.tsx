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
  useIncidentRiskOptions,
  useLinkIncidentToRisk,
} from "../hooks/use-incidents";
import {
  linkIncidentRiskFormSchema,
  type LinkIncidentRiskForm,
} from "../schemas/incident-risk-schema";
import type { Incident } from "../schemas/report-incident-schema";
const title = (value: string) =>
  value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
export function LinkIncidentRiskDialog({
  incident,
  onClose,
}: {
  incident: Incident | undefined;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const options = useIncidentRiskOptions(incident?.id);
  const mutation = useLinkIncidentToRisk();
  const toast = useToast();
  const form = useForm<LinkIncidentRiskForm>({
    resolver: zodResolver(linkIncidentRiskFormSchema),
    defaultValues: { riskId: "" },
  });
  const available = useMemo(
    () => options.data?.risks.filter((risk) => !risk.linked) ?? [],
    [options.data],
  );
  useEffect(() => {
    if (incident) {
      form.reset({ riskId: "" });
      ref.current?.showModal();
    } else ref.current?.close();
  }, [form, incident]);
  const submit = async (values: LinkIncidentRiskForm) => {
    if (!incident) return;
    try {
      const linked = await mutation.mutateAsync({ id: incident.id, values });
      toast.success(
        "Risk linked",
        `${linked.risk.riskCode} is now linked to ${linked.incident.incidentCode}.`,
      );
      onClose();
    } catch {
      /* normalized error remains visible */
    }
  };
  return (
    <Dialog
      dialogRef={ref}
      title="Link incident to existing risk"
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
              Unable to load existing risks. Check your session and backend
              connection.
            </Alert>
          ) : null}
          {mutation.isError ? (
            <Alert className="border-danger/25 bg-danger-soft text-danger">
              {mutation.error instanceof Error
                ? mutation.error.message
                : "Unable to link this risk."}
            </Alert>
          ) : null}
          <FormField
            id="incident-risk"
            label="Existing risk"
            error={form.formState.errors.riskId?.message}
          >
            <Select
              id="incident-risk"
              autoFocus
              disabled={
                options.isPending || options.isError || available.length === 0
              }
              aria-invalid={Boolean(form.formState.errors.riskId)}
              {...form.register("riskId")}
            >
              <option value="">
                {options.isPending
                  ? "Loading existing risks…"
                  : "Select an existing risk"}
              </option>
              {available.map((risk) => (
                <option key={risk.id} value={risk.id}>
                  {risk.riskCode} — {risk.title} ({title(risk.status)})
                </option>
              ))}
            </Select>
            {!options.isPending &&
            !options.isError &&
            available.length === 0 ? (
              <p className="text-muted text-xs">
                All available risks are already linked to this incident.
              </p>
            ) : (
              <p className="text-muted text-xs">
                This records incident context only. Risk reassessment remains a
                separate reviewed action.
              </p>
            )}
          </FormField>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending || available.length === 0}
            >
              {mutation.isPending ? "Linking…" : "Link risk"}
            </Button>
          </div>
        </form>
      ) : null}
    </Dialog>
  );
}
