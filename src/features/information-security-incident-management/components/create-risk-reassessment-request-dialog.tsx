"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { History, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useToast } from "@/components/feedback/toast";
import { FormField } from "@/components/forms/form-field";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  useCreateRiskReassessmentRequest,
  useRiskReassessmentRequestOptions,
} from "../hooks/use-incidents";
import {
  createRiskReassessmentRequestFormSchema,
  type CreateRiskReassessmentRequestForm,
} from "../schemas/risk-reassessment-request-schema";
import type { Incident } from "../schemas/report-incident-schema";
import { RiskReassessmentRequestHistoryPanel } from "./risk-reassessment-request-history-panel";

export function CreateRiskReassessmentRequestDialog({
  incident,
  onClose,
}: {
  incident: Incident | undefined;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [tab, setTab] = useState<"create" | "history">("create");
  const options = useRiskReassessmentRequestOptions(incident?.id);
  const mutation = useCreateRiskReassessmentRequest();
  const toast = useToast();
  const form = useForm<CreateRiskReassessmentRequestForm>({
    resolver: zodResolver(createRiskReassessmentRequestFormSchema),
    defaultValues: { riskId: "", controlFindingId: "", reason: "" },
  });
  const availableRisks = useMemo(
    () => options.data?.risks.filter((risk) => !risk.hasActiveRequest) ?? [],
    [options.data],
  );
  useEffect(() => {
    if (incident) {
      form.reset({ riskId: "", controlFindingId: "", reason: "" });
      ref.current?.showModal();
    } else ref.current?.close();
  }, [form, incident]);
  const submit = async (values: CreateRiskReassessmentRequestForm) => {
    if (!incident) return;
    try {
      const request = await mutation.mutateAsync({ id: incident.id, values });
      toast.success(
        "Reassessment requested",
        `${request.risk.riskCode} is pending review; its current rating was not changed.`,
      );
      form.reset({ riskId: "", controlFindingId: "", reason: "" });
      setTab("history");
    } catch {
      /* The normalized API error remains visible in the dialog. */
    }
  };
  const close = () => {
    setTab("create");
    onClose();
  };
  return (
    <Dialog
      dialogRef={ref}
      title="Request risk reassessment"
      className="max-h-[calc(100dvh-2rem)] w-[min(76rem,calc(100%-2rem))] overflow-y-auto"
      onClose={close}
    >
      {incident ? (
        <div className="space-y-5">
          <div className="border-border bg-neutral-soft rounded-lg border p-4">
            <p className="text-muted text-xs font-medium tracking-wide uppercase">
              {incident.incidentCode}
            </p>
            <p className="mt-1 font-semibold break-words">{incident.title}</p>
          </div>
          <div
            aria-label="Risk reassessment request views"
            className="border-border bg-surface inline-flex w-full items-center gap-1 rounded-xl border p-1 shadow-xs sm:w-auto"
            role="tablist"
          >
            {[
              {
                id: "create" as const,
                label: "Create request",
                icon: RotateCcw,
              },
              {
                id: "history" as const,
                label: "Request history",
                icon: History,
              },
            ].map((item) => {
              const Icon = item.icon;
              const selected = tab === item.id;
              return (
                <button
                  aria-selected={selected}
                  className={cn(
                    "inline-flex min-w-0 flex-1 items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors sm:flex-none",
                    selected
                      ? "bg-brand text-brand-contrast font-semibold shadow-xs"
                      : "text-muted hover:bg-neutral-soft hover:text-foreground",
                  )}
                  key={item.id}
                  onClick={() => setTab(item.id)}
                  role="tab"
                  type="button"
                >
                  <Icon
                    aria-hidden="true"
                    className="size-4"
                    strokeWidth={1.8}
                  />
                  {item.label}
                </button>
              );
            })}
          </div>
          <div className="h-[26rem] overflow-y-auto pr-1 sm:h-[30rem]">
            {tab === "create" ? (
              <form
                className="space-y-5"
                noValidate
                onSubmit={form.handleSubmit(submit)}
                role="tabpanel"
              >
                {options.isError ? (
                  <Alert className="border-danger/25 bg-danger-soft text-danger">
                    Unable to load linked risks. Link a risk to this incident
                    first.
                  </Alert>
                ) : null}
                {mutation.isError ? (
                  <Alert className="border-danger/25 bg-danger-soft text-danger">
                    {mutation.error instanceof Error
                      ? mutation.error.message
                      : "Unable to create this reassessment request."}
                  </Alert>
                ) : null}
                <FormField
                  id="reassessment-risk"
                  label="Linked risk"
                  error={form.formState.errors.riskId?.message}
                >
                  <Select
                    id="reassessment-risk"
                    autoFocus
                    disabled={
                      options.isPending ||
                      options.isError ||
                      availableRisks.length === 0
                    }
                    {...form.register("riskId")}
                  >
                    <option value="">
                      {options.isPending
                        ? "Loading linked risks…"
                        : "Select a linked risk"}
                    </option>
                    {availableRisks.map((risk) => (
                      <option key={risk.id} value={risk.id}>
                        {risk.riskCode} — {risk.title}
                      </option>
                    ))}
                  </Select>
                  {!options.isPending &&
                  !options.isError &&
                  availableRisks.length === 0 ? (
                    <p className="text-muted text-xs">
                      No linked risk is available, or every linked risk already
                      has an active request.
                    </p>
                  ) : null}
                </FormField>
                <FormField
                  id="reassessment-weakness"
                  label="Related control weakness (optional)"
                  error={form.formState.errors.controlFindingId?.message}
                >
                  <Select
                    id="reassessment-weakness"
                    disabled={options.isPending || options.isError}
                    {...form.register("controlFindingId")}
                  >
                    <option value="">No specific control weakness</option>
                    {options.data?.controlWeaknesses.map((finding) => (
                      <option key={finding.id} value={finding.id}>
                        {finding.control.controlCode} — {finding.control.name}
                        {finding.severity ? ` (${finding.severity})` : ""}
                      </option>
                    ))}
                  </Select>
                </FormField>
                <FormField
                  id="reassessment-reason"
                  label="Reason for reassessment"
                  error={form.formState.errors.reason?.message}
                >
                  <Textarea
                    id="reassessment-reason"
                    className="min-h-32"
                    maxLength={5000}
                    placeholder="Explain how the incident or control weakness may change the risk likelihood, impact, or treatment assumptions."
                    {...form.register("reason")}
                  />
                  <p className="text-muted text-xs">
                    This creates a review request only. It does not change the
                    current risk rating.
                  </p>
                </FormField>
                <div className="flex justify-end gap-2">
                  <Button variant="secondary" onClick={close}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={mutation.isPending || availableRisks.length === 0}
                  >
                    {mutation.isPending ? "Requesting…" : "Create request"}
                  </Button>
                </div>
              </form>
            ) : (
              <RiskReassessmentRequestHistoryPanel incidentId={incident.id} />
            )}
          </div>
          {tab === "history" ? (
            <div className="border-border flex justify-end border-t pt-4">
              <Button variant="secondary" onClick={close}>
                Close
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </Dialog>
  );
}
