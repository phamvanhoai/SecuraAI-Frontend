"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState } from "react";
import { useForm, type UseFormRegisterReturn } from "react-hook-form";
import { useToast } from "@/components/feedback/toast";
import { FormField } from "@/components/forms/form-field";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useClassifyAssetCriticality } from "../hooks/use-classify-asset-criticality";
import {
  classifyAssetCriticalitySchema,
  type ClassifyAssetCriticalityInput,
  type ClassifyAssetCriticalityRequest,
} from "../schemas/classify-asset-criticality-schema";
import type { AssetListItem } from "../schemas/asset-list-schema";

const defaults: ClassifyAssetCriticalityInput = {
  confidentialityImpact: 3,
  integrityImpact: 3,
  availabilityImpact: 3,
  businessImpact: 3,
  dataClassification: "internal",
};
const criticalityLabels = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
} as const;

export function ClassifyAssetCriticalityDialog({
  asset,
  onClose,
}: {
  asset: AssetListItem | null;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [message, setMessage] = useState<string>();
  const mutation = useClassifyAssetCriticality(asset?.id ?? null);
  const toast = useToast();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClassifyAssetCriticalityInput, unknown, ClassifyAssetCriticalityRequest>({
    resolver: zodResolver(classifyAssetCriticalitySchema),
    defaultValues: defaults,
  });

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (asset && !dialog.open) {
      reset({ ...defaults, dataClassification: asset.dataClassification === "public" || asset.dataClassification === "confidential" || asset.dataClassification === "restricted" ? asset.dataClassification : "internal" });
      dialog.showModal();
    }
    if (!asset && dialog.open) dialog.close();
  }, [asset, reset]);

  const close = (): void => {
    reset(defaults);
    setMessage(undefined);
    onClose();
  };
  const submit = async (values: ClassifyAssetCriticalityRequest): Promise<void> => {
    if (!asset) return;
    setMessage(undefined);
    try {
      const result = await mutation.mutateAsync(values);
      close();
      toast.success(
        "Asset classified",
        `${asset.assetCode}: ${criticalityLabels[result.criticality]}, ${result.dataClassification} data – score ${result.score}`,
      );
    } catch (error: unknown) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to classify asset. Please try again.",
      );
    }
  };

  const archived = asset?.status === "archived";
  return (
    <Dialog
      title="Classify Asset Criticality"
      dialogRef={dialogRef}
      onClose={close}
      className="w-[min(40rem,calc(100%-2rem))]"
    >
      {asset ? (
        <form className="space-y-4" noValidate onSubmit={handleSubmit(submit)}>
          <p className="text-sm">
            <strong>{asset.assetCode}</strong> – {asset.name}. Current criticality: {criticalityLabels[asset.criticality]}.
          </p>
          <p className="text-muted text-xs leading-5">
            Rate each criterion from 1 (low impact) to 5 (very high impact). The system calculates the final result.
          </p>
          {archived ? <Alert>Archived assets cannot be classified.</Alert> : null}
          {message ? (
            <Alert className="border-danger/25 bg-danger-soft text-danger">{message}</Alert>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <ScoreField
              id="confidentialityImpact"
              label="Confidentiality impact"
              error={errors.confidentialityImpact?.message}
              disabled={archived}
              registration={register("confidentialityImpact", { valueAsNumber: true })}
            />
            <ScoreField
              id="integrityImpact"
              label="Integrity impact"
              error={errors.integrityImpact?.message}
              disabled={archived}
              registration={register("integrityImpact", { valueAsNumber: true })}
            />
            <ScoreField
              id="availabilityImpact"
              label="Availability impact"
              error={errors.availabilityImpact?.message}
              disabled={archived}
              registration={register("availabilityImpact", { valueAsNumber: true })}
            />
            <ScoreField
              id="businessImpact"
              label="Business impact"
              error={errors.businessImpact?.message}
              disabled={archived}
              registration={register("businessImpact", { valueAsNumber: true })}
            />
          </div>
          <FormField id="data-classification" label="Data classification" error={errors.dataClassification?.message}>
            <Select id="data-classification" disabled={archived} {...register("dataClassification")}>
              <option value="public">Public</option>
              <option value="internal">Internal</option>
              <option value="confidential">Confidential</option>
              <option value="restricted">Restricted</option>
            </Select>
          </FormField>
          <div className="flex justify-end gap-2">
            <Button
              className="bg-surface text-foreground ring-border hover:bg-neutral-soft ring-1"
              onClick={close}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={archived || mutation.isPending}>
              {mutation.isPending ? "Classifying…" : "Classify"}
            </Button>
          </div>
        </form>
      ) : null}
    </Dialog>
  );
}

function ScoreField({
  id,
  label,
  error,
  disabled,
  registration,
}: {
  id: string;
  label: string;
  error: string | undefined;
  disabled: boolean;
  registration: UseFormRegisterReturn;
}) {
  return (
    <FormField id={id} label={label} error={error}>
      <Input id={id} type="number" min={1} max={5} step={1} disabled={disabled} {...registration} />
    </FormField>
  );
}
