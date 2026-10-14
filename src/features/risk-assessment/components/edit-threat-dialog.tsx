"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { History, Pencil } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { FormField } from "@/components/forms/form-field";
import { useToast } from "@/components/feedback/toast";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useRiskRecord } from "../hooks/use-risk-register";
import { useUpdateThreat } from "../hooks/use-update-threat";
import type { RiskRegisterDetail } from "../schemas/risk-register-schema";
import { type UpdateThreatInput, updateThreatSchema } from "../schemas/update-threat-schema";

type Threat = RiskRegisterDetail["threats"][number];

export function EditThreatDialog({
  riskId,
  riskLabel,
  threat,
  onClose,
}: {
  riskId: string;
  riskLabel: string;
  threat: Threat;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [message, setMessage] = useState<string>();
  const [tab, setTab] = useState<"edit" | "history">("edit");
  const risk = useRiskRecord(riskId);
  const mutation = useUpdateThreat(riskId, threat.id);
  const toast = useToast();
  const blockedReason = risk.data?.vulnerabilityWorkflow?.blockedReason ?? null;
  const { register, handleSubmit, formState: { errors } } = useForm<UpdateThreatInput>({
    resolver: zodResolver(updateThreatSchema),
    defaultValues: {
      name: threat.name,
      description: threat.description ?? "",
      vulnerabilityIds: threat.vulnerabilities.map((item) => item.id),
      expectedUpdatedAt: threat.updatedAt,
    },
  });
  const cannotSave = mutation.isPending || risk.isPending || risk.isError || !risk.data ||
    Boolean(blockedReason) || risk.data.vulnerabilityWorkflow?.canIdentify === false;

  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  const submit = async (input: UpdateThreatInput) => {
    if (cannotSave) return;
    setMessage(undefined);
    try {
      const updated = await mutation.mutateAsync(input);
      onClose();
      toast.success(
        "Threat updated",
        `${updated.name} is linked to ${updated.vulnerabilities.length} vulnerabilit${updated.vulnerabilities.length === 1 ? "y" : "ies"}.`,
      );
      toast.warning(
        "Reassessment required",
        "Risk context changed. Reassess inherent and residual risk before submitting acceptance.",
      );
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : "Unable to update the threat.");
    }
  };

  return (
    <Dialog
      title="Edit Threat"
      dialogRef={ref}
      onClose={onClose}
      className="max-h-[calc(100dvh-2rem)] w-[min(40rem,calc(100%-2rem))] overflow-y-auto"
    >
      <div className="border-border bg-surface mb-4 inline-flex w-full gap-1 rounded-xl border p-1" role="tablist" aria-label="Threat editor views">
        <button type="button" role="tab" aria-selected={tab === "edit"} className={`min-h-10 flex-1 rounded-lg px-3.5 py-2 text-sm font-medium ${tab === "edit" ? "bg-brand text-brand-contrast font-semibold" : "text-muted hover:bg-neutral-soft"}`} onClick={() => setTab("edit")}>Edit threat</button>
        <button type="button" role="tab" aria-selected={tab === "history"} className={`min-h-10 inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium ${tab === "history" ? "bg-brand text-brand-contrast font-semibold" : "text-muted hover:bg-neutral-soft"}`} onClick={() => setTab("history")}><History className="size-4" aria-hidden="true" />History ({risk.data?.contextHistory.filter((entry) => entry.type === "threat" && entry.entityId === threat.id).length ?? 0})</button>
      </div>
      {tab === "history" ? (
        <section role="tabpanel" className="space-y-3">
          <p className="text-muted text-sm">Read-only changes for this Threat.</p>
          {risk.data?.contextHistory.filter((entry) => entry.type === "threat" && entry.entityId === threat.id).map((entry) => (
            <article key={entry.id} className="border-border rounded-lg border p-3"><p className="font-medium">{entry.actor?.fullName ?? "Unknown actor"}</p><p className="text-muted text-xs">{new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(entry.occurredAt))}</p><details className="mt-2"><summary className="cursor-pointer text-sm">View changes</summary><div className="mt-2 grid gap-2 sm:grid-cols-2"><pre className="bg-neutral-soft overflow-auto rounded p-2 text-xs whitespace-pre-wrap">{JSON.stringify(entry.before, null, 2)}</pre><pre className="bg-neutral-soft overflow-auto rounded p-2 text-xs whitespace-pre-wrap">{JSON.stringify(entry.after, null, 2)}</pre></div></details></article>
          )) ?? <p className="border-border rounded-lg border border-dashed p-6 text-center text-sm">No history recorded.</p>}
        </section>
      ) : (
      <form className="space-y-5" noValidate onSubmit={handleSubmit(submit)}>
        <p className="text-muted text-sm">
          Update this threat for <strong className="text-foreground">{riskLabel}</strong>.
          This changes the existing record and requires the Risk to be reassessed.
        </p>
        {message ? <Alert className="border-danger/25 bg-danger-soft text-danger">{message}</Alert> : null}
        {risk.isError ? <Alert>Unable to refresh this Risk. Close and try again.</Alert> : null}
        {blockedReason ? <Alert>{blockedReason}</Alert> : null}
        <FormField id="editThreatName" label="Threat name" error={errors.name?.message}>
          <Input id="editThreatName" maxLength={255} autoFocus {...register("name")} />
        </FormField>
        <FormField id="editThreatDescription" label="Threat scenario" error={errors.description?.message}>
          <Textarea id="editThreatDescription" rows={4} maxLength={3000} {...register("description")} />
        </FormField>
        <fieldset>
          <legend className="text-sm font-medium">Related vulnerabilities</legend>
          <p className="text-muted mt-1 text-xs">
            Select at least one vulnerability already documented for this Risk.
          </p>
          <div className="border-border mt-3 max-h-52 space-y-1 overflow-y-auto rounded-lg border p-2">
            {risk.isPending ? <p className="text-muted p-2 text-sm">Loading vulnerabilities…</p> :
              risk.data?.vulnerabilities.length ? risk.data.vulnerabilities.map((item) => (
                <label key={item.id} className="hover:bg-neutral-soft flex min-h-10 cursor-pointer items-start gap-3 rounded-md p-2 text-sm">
                  <input
                    className="mt-0.5 size-4 shrink-0"
                    type="checkbox"
                    value={item.id}
                    {...register("vulnerabilityIds")}
                  />
                  <span>
                    <strong className="block font-medium">{item.name}</strong>
                    {item.description ? <span className="text-muted line-clamp-2">{item.description}</span> : null}
                  </span>
                </label>
              )) : <p className="text-muted p-2 text-sm">No vulnerabilities are available.</p>}
          </div>
          {errors.vulnerabilityIds?.message ? <p className="text-danger mt-1 text-xs" role="alert">{errors.vulnerabilityIds.message}</p> : null}
        </fieldset>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={cannotSave}>
            <Pencil className="size-4" aria-hidden="true" />
            {mutation.isPending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </form>
      )}
    </Dialog>
  );
}
