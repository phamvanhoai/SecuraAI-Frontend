"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useToast } from "@/components/feedback/toast";
import { FormField } from "@/components/forms/form-field";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useAssets } from "@/features/assets";
import { useAlertThresholds, useSetAlertThreshold } from "../hooks/use-alert-thresholds";
import {
  alertThresholdFormSchema,
  thresholdRiskLevels,
  type AlertThresholdFormInput,
  type AlertThresholdFormValues,
} from "../schemas/alert-threshold-schema";

const defaults: AlertThresholdFormInput = {
  assetId: "",
  thresholdPercent: 80,
  riskLevelMin: "",
  enabled: true,
};

export function AlertThresholdsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [message, setMessage] = useState<string>();
  const thresholds = useAlertThresholds(1, open);
  const assets = useAssets(
    { page: 1, limit: 100, sortBy: "assetCode", sortOrder: "asc", status: "active" },
    open,
  );
  const mutation = useSetAlertThreshold();
  const toast = useToast();
  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<AlertThresholdFormInput, unknown, AlertThresholdFormValues>({
    resolver: zodResolver(alertThresholdFormSchema),
    defaultValues: defaults,
  });
  const selectedAssetId = useWatch({ control, name: "assetId" });

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const close = (): void => {
    reset(defaults);
    setMessage(undefined);
    onClose();
  };

  const chooseAsset = (assetId: string): void => {
    setValue("assetId", assetId, { shouldValidate: true });
    const existing = thresholds.data?.items.find((item) => item.asset.id === assetId);
    setValue("thresholdPercent", existing ? existing.threshold * 100 : 80);
    setValue("riskLevelMin", existing?.riskLevelMin ?? "");
    setValue("enabled", existing?.enabled ?? true);
  };

  const submit = async (values: AlertThresholdFormValues): Promise<void> => {
    setMessage(undefined);
    try {
      await mutation.mutateAsync({
        assetId: values.assetId,
        input: {
          threshold: values.thresholdPercent / 100,
          riskLevelMin: values.riskLevelMin || null,
          enabled: values.enabled,
        },
      });
      toast.success("Alert threshold saved", "The custom asset threshold is now active.");
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : "Unable to save the alert threshold.");
    }
  };

  return (
    <Dialog
      className="max-h-[calc(100dvh-2rem)] w-[min(46rem,calc(100%-2rem))] overflow-y-auto"
      dialogRef={dialogRef}
      onClose={close}
      title="Alert thresholds"
    >
      <p className="text-muted text-sm leading-6">
        Set an asset-specific anomaly score threshold. Lower values create alerts more readily.
      </p>
      {message ? <Alert className="border-danger/25 bg-danger-soft text-danger mt-4">{message}</Alert> : null}
      <form className="mt-5 space-y-4" noValidate onSubmit={handleSubmit(submit)}>
        <FormField error={errors.assetId?.message} id="threshold-asset" label="Asset">
          <Select
            id="threshold-asset"
            onChange={(event) => chooseAsset(event.target.value)}
            value={selectedAssetId}
          >
            <option value="">Select an active asset</option>
            {assets.data?.items.map((asset) => (
              <option key={asset.id} value={asset.id}>{asset.assetCode} — {asset.name}</option>
            ))}
          </Select>
        </FormField>
        {assets.isError ? <Alert>Unable to load active assets.</Alert> : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField error={errors.thresholdPercent?.message} id="threshold-percent" label="Anomaly score threshold (%)">
            <Input id="threshold-percent" inputMode="decimal" min={1} max={100} step={1} type="number" {...register("thresholdPercent")} />
            <p className="text-muted text-xs">Accepted range: 1% to 100%.</p>
          </FormField>
          <FormField error={errors.riskLevelMin?.message} id="threshold-risk" label="Minimum risk level (optional)">
            <Select id="threshold-risk" {...register("riskLevelMin")}>
              <option value="">Any risk level</option>
              {thresholdRiskLevels.map((level) => <option key={level} value={level}>{formatLevel(level)}</option>)}
            </Select>
          </FormField>
        </div>
        <label className="flex min-h-10 items-center gap-3 text-sm font-medium">
          <Checkbox {...register("enabled")} />
          Enable this threshold
        </label>
        <div className="border-border flex justify-end gap-2 border-t pt-4">
          <Button onClick={close} type="button" variant="secondary">Cancel</Button>
          <Button disabled={mutation.isPending || assets.isPending} type="submit">
            {mutation.isPending ? "Saving…" : "Save threshold"}
          </Button>
        </div>
      </form>
      <section className="border-border mt-6 border-t pt-5" aria-labelledby="configured-thresholds-title">
        <h3 className="font-semibold" id="configured-thresholds-title">Configured thresholds</h3>
        {thresholds.isPending ? (
          <p className="text-muted mt-3 text-sm">Loading thresholds…</p>
        ) : thresholds.data?.items.length ? (
          <div className="mt-3 space-y-2">
            {thresholds.data.items.map((item) => (
              <button
                className="border-border hover:bg-neutral-soft focus-visible:outline-brand flex min-h-11 w-full items-center justify-between gap-4 rounded-lg border px-3 text-left text-sm focus-visible:outline-2"
                key={item.id}
                onClick={() => chooseAsset(item.asset.id)}
                type="button"
              >
                <span><strong>{item.asset.assetCode}</strong><span className="text-muted ml-2">{item.asset.name}</span></span>
                <span className="shrink-0 tabular-nums">{Math.round(item.threshold * 100)}% · {item.enabled ? "Enabled" : "Disabled"}</span>
              </button>
            ))}
          </div>
        ) : thresholds.isError ? (
          <Alert className="mt-3">Unable to load configured thresholds.</Alert>
        ) : (
          <p className="text-muted mt-3 text-sm">No custom thresholds have been configured.</p>
        )}
      </section>
    </Dialog>
  );
}

function formatLevel(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
