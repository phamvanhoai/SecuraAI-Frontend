"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useToast } from "@/components/feedback/toast";
import { FormField } from "@/components/forms/form-field";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useConfigureDetectionThreshold, useDetectionThreshold } from "../hooks/use-alert-thresholds";
import {
  detectionThresholdFormSchema,
  type DetectionThresholdFormInput,
  type DetectionThresholdFormValues,
} from "../schemas/alert-threshold-schema";

const defaults: DetectionThresholdFormInput = { thresholdPercent: 80 };

export function AlertThresholdsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [message, setMessage] = useState<string>();
  const threshold = useDetectionThreshold(open);
  const mutation = useConfigureDetectionThreshold();
  const toast = useToast();
  const { register, handleSubmit, reset, formState: { errors } } =
    useForm<DetectionThresholdFormInput, unknown, DetectionThresholdFormValues>({
      resolver: zodResolver(detectionThresholdFormSchema),
      defaultValues: defaults,
    });

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (threshold.data) reset({ thresholdPercent: threshold.data.threshold * 100 });
  }, [reset, threshold.data]);

  const close = (): void => {
    setMessage(undefined);
    onClose();
  };

  const submit = async (values: DetectionThresholdFormValues): Promise<void> => {
    setMessage(undefined);
    try {
      await mutation.mutateAsync({ threshold: values.thresholdPercent / 100 });
      toast.success("Detection threshold saved", "New anomaly detection runs will use this threshold.");
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : "Unable to save the detection threshold.");
    }
  };

  return (
    <Dialog
      className="max-h-[calc(100dvh-2rem)] w-[min(36rem,calc(100%-2rem))] overflow-y-auto"
      dialogRef={dialogRef}
      onClose={close}
      title="Detection threshold"
    >
      <p className="text-muted text-sm leading-6">
        Configure when the deployed AI model classifies an event as anomalous. Lower values increase sensitivity and may create more alerts.
      </p>
      {message ? <Alert className="border-danger/25 bg-danger-soft text-danger mt-4">{message}</Alert> : null}
      {threshold.isError ? <Alert className="mt-4">Unable to load the deployed model. Deploy a model before configuring its threshold.</Alert> : null}
      {threshold.isPending ? (
        <p className="text-muted mt-5 text-sm" role="status">Loading threshold…</p>
      ) : threshold.data ? (
        <form className="mt-5 space-y-4" noValidate onSubmit={handleSubmit(submit)}>
          <div className="border-border bg-neutral-soft grid gap-3 rounded-xl border p-4 text-sm sm:grid-cols-2">
            <div>
              <p className="text-muted text-xs font-medium uppercase tracking-wide">Deployed model</p>
              <p className="mt-1 font-semibold">{threshold.data.modelName}</p>
            </div>
            <div>
              <p className="text-muted text-xs font-medium uppercase tracking-wide">Version</p>
              <p className="mt-1 font-semibold tabular-nums">{threshold.data.version}</p>
            </div>
          </div>
          <FormField error={errors.thresholdPercent?.message} id="detection-threshold-percent" label="Anomaly score threshold (%)">
            <Input id="detection-threshold-percent" inputMode="decimal" min={50} max={100} step={1} type="number" {...register("thresholdPercent")} />
            <p className="text-muted text-xs">Accepted range: 50% to 100%. Changes apply to future detection runs only.</p>
          </FormField>
          <div className="border-border flex justify-end gap-2 border-t pt-4">
            <Button onClick={close} type="button" variant="secondary">Cancel</Button>
            <Button disabled={mutation.isPending} type="submit">{mutation.isPending ? "Saving…" : "Save threshold"}</Button>
          </div>
        </form>
      ) : null}
    </Dialog>
  );
}
