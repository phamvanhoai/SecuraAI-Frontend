"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Bot, Gauge, LoaderCircle } from "lucide-react";
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
  } = useForm<
    DetectionThresholdFormInput,
    unknown,
    DetectionThresholdFormValues
  >({
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

  const submit = async (
    values: DetectionThresholdFormValues,
  ): Promise<void> => {
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
      className="max-h-[calc(100dvh-2rem)] w-[min(40rem,calc(100%-2rem))] overflow-y-auto"
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
            <Button
              onClick={() => void threshold.refetch()}
              variant="secondary"
            >
              Try again
            </Button>
          </div>
        </Alert>
      ) : threshold.data ? (
        <form className="space-y-5" noValidate onSubmit={handleSubmit(submit)}>
          <div className="border-border bg-neutral-soft/30 rounded-lg border p-4">
            <div className="flex items-start gap-3">
              <div className="bg-brand/10 text-brand flex size-10 shrink-0 items-center justify-center rounded-lg">
                <Bot aria-hidden="true" className="size-5" strokeWidth={1.8} />
              </div>
              <div className="min-w-0">
                <span className="text-muted block text-xs font-medium">
                  Deployed model
                </span>
                <strong className="mt-1 block [overflow-wrap:anywhere]">
                  {threshold.data.modelName} {threshold.data.version}
                </strong>
              </div>
            </div>
            <dl className="border-border mt-4 grid gap-3 border-t pt-3 sm:grid-cols-2">
              <div>
                <span className="sr-only">
                  Current threshold:{" "}
                  {Math.round(threshold.data.threshold * 100)}%
                </span>
                <dt className="text-muted text-xs font-medium">
                  Current threshold
                </dt>
                <dd className="mt-1 text-base font-semibold tabular-nums">
                  {Math.round(threshold.data.threshold * 100)}%
                </dd>
              </div>
              <div>
                <dt className="text-muted text-xs font-medium">
                  Proposed threshold
                </dt>
                <dd className="mt-1 text-base font-semibold tabular-nums">
                  {Number.isFinite(thresholdPercent)
                    ? `${thresholdPercent}%`
                    : "Not set"}
                </dd>
              </div>
            </dl>
          </div>

          <FormField
            error={errors.thresholdPercent?.message}
            id="detection-threshold-percent"
            label="Anomaly score threshold (%)"
          >
            <Input
              aria-invalid={Boolean(errors.thresholdPercent)}
              id="detection-threshold-percent"
              max={100}
              min={50}
              step={1}
              type="number"
              {...register("thresholdPercent")}
            />
            <p className="text-muted text-xs">
              Enter a value from 50% to 100%.
            </p>
          </FormField>

          <div className="border-border flex items-start gap-3 rounded-lg border p-4">
            <Gauge
              aria-hidden="true"
              className="text-brand mt-0.5 size-5 shrink-0"
              strokeWidth={1.8}
            />
            <div>
              <h3 className="text-sm font-semibold">Detection behavior</h3>
              <p className="text-muted mt-1 text-sm leading-6">
                This default applies to assets without an enabled override.
                Events scoring
                <strong className="mx-1 tabular-nums">
                  {Number.isFinite(thresholdPercent)
                    ? `${thresholdPercent}%`
                    : "—"}
                </strong>
                or higher create alerts. Lower values increase sensitivity and
                may produce more alerts.
              </p>
            </div>
          </div>

          {message ? (
            <Alert className="border-danger/25 bg-danger-soft text-danger">
              {message}
            </Alert>
          ) : null}

          <div className="border-border flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
            <Button
              disabled={mutation.isPending}
              onClick={close}
              type="button"
              variant="secondary"
            >
              Cancel
            </Button>
            <Button disabled={mutation.isPending} type="submit">
              {mutation.isPending ? (
                <>
                  <LoaderCircle
                    aria-hidden="true"
                    className="size-4 animate-spin motion-reduce:animate-none"
                  />
                  Saving…
                </>
              ) : (
                "Save threshold"
              )}
            </Button>
          </div>
        </form>
      ) : null}
    </Dialog>
  );
}
