"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useToast } from "@/components/feedback/toast";
import { FormField } from "@/components/forms/form-field";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useConfigureDetectionThreshold,
  useDetectionThreshold,
} from "../hooks/use-alert-thresholds";
import {
  detectionThresholdFormSchema,
  type DetectionThresholdFormInput,
  type DetectionThresholdFormValues,
} from "../schemas/alert-threshold-schema";

const defaults: DetectionThresholdFormInput = { thresholdPercent: 80 };

export function ConfigureDetectionThresholdDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [message, setMessage] = useState<string>();
  const threshold = useDetectionThreshold(open);
  const mutation = useConfigureDetectionThreshold();
  const toast = useToast();
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DetectionThresholdFormInput, unknown, DetectionThresholdFormValues>({
    resolver: zodResolver(detectionThresholdFormSchema),
    defaultValues: defaults,
  });
  const thresholdPercent = Number(
    useWatch({ control, name: "thresholdPercent" }),
  );

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (threshold.data) {
      reset({ thresholdPercent: threshold.data.threshold * 100 });
    }
  }, [reset, threshold.data]);

  const close = (): void => {
    setMessage(undefined);
    onClose();
  };

  const submit = async (values: DetectionThresholdFormValues): Promise<void> => {
    setMessage(undefined);
    try {
      const result = await mutation.mutateAsync({
        threshold: values.thresholdPercent / 100,
      });
      toast.success(
        "Detection threshold updated",
        `${result.modelName} ${result.version} will create alerts at ${Math.round(result.threshold * 100)}% or higher.`,
      );
      close();
    } catch (error: unknown) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to update the detection threshold.",
      );
    }
  };

  return (
    <Dialog
      className="max-h-[calc(100dvh-2rem)] overflow-y-auto"
      dialogRef={dialogRef}
      onClose={close}
      title="Configure Detection Threshold"
    >
      {threshold.isPending ? (
        <div
          aria-label="Loading detection threshold"
          className="space-y-3"
          role="status"
        >
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : threshold.isError ? (
        <Alert>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>Unable to load the deployed model threshold.</span>
            <Button onClick={() => void threshold.refetch()} variant="secondary">
              Try again
            </Button>
          </div>
        </Alert>
      ) : threshold.data ? (
        <form className="space-y-5" noValidate onSubmit={handleSubmit(submit)}>
          <div className="border-border bg-neutral-soft rounded-lg border p-3">
            <span className="text-muted block text-xs font-medium tracking-wide uppercase">
              Deployed model
            </span>
            <strong className="mt-1 block [overflow-wrap:anywhere]">
              {threshold.data.modelName} {threshold.data.version}
            </strong>
            <span className="text-muted mt-1 block text-sm">
              Current threshold: {Math.round(threshold.data.threshold * 100)}%
            </span>
          </div>

          <FormField
            error={errors.thresholdPercent?.message}
            id="detection-threshold-percent"
            label="Anomaly score threshold (%)"
          >
            <Input
              id="detection-threshold-percent"
              max={100}
              min={50}
              step={1}
              type="number"
              {...register("thresholdPercent")}
            />
          </FormField>

          <div className="border-border rounded-lg border p-3 text-sm leading-6">
            This is the default for every asset without an enabled override. {" "}
            Events scoring
            <strong className="mx-1 tabular-nums">
              {Number.isFinite(thresholdPercent) ? `${thresholdPercent}%` : "—"}
            </strong>
            or higher will create alerts. A lower value increases sensitivity
            and may produce more alerts.
          </div>

          {message ? (
            <Alert className="border-danger/25 bg-danger-soft text-danger">
              {message}
            </Alert>
          ) : null}

          <div className="flex flex-wrap justify-end gap-2">
            <Button onClick={close} type="button" variant="secondary">
              Cancel
            </Button>
            <Button disabled={mutation.isPending} type="submit">
              {mutation.isPending ? "Saving…" : "Save threshold"}
            </Button>
          </div>
        </form>
      ) : null}
    </Dialog>
  );
}
