"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState } from "react";
import { useForm, useWatch, type UseFormRegisterReturn } from "react-hook-form";
import { useToast } from "@/components/feedback/toast";
import { FormField } from "@/components/forms/form-field";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAssetDetail } from "../hooks/use-asset-detail";
import { previewAssetCriticality } from "../lib/asset-classification-method";
import { useClassifyAssetCriticality } from "../hooks/use-classify-asset-criticality";
import {
  classifyAssetCriticalitySchema,
  type ClassifyAssetCriticalityInput,
  type ClassifyAssetCriticalityRequest,
} from "../schemas/classify-asset-criticality-schema";
import type { AssetListItem } from "../schemas/asset-list-schema";

const defaults: ClassifyAssetCriticalityInput = {
  confidentialityImpact: "",
  integrityImpact: "",
  availabilityImpact: "",
  businessImpact: "",
  rationale: "",
  dataClassificationBasis: "",
  dataClassification: "",
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
  const detail = useAssetDetail(asset?.id ?? null);
  const initializedAsset = useRef<string | null>(null);
  const toast = useToast();
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<
    ClassifyAssetCriticalityInput,
    unknown,
    ClassifyAssetCriticalityRequest
  >({
    resolver: zodResolver(classifyAssetCriticalitySchema),
    defaultValues: defaults,
  });

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (asset && !dialog.open) {
      initializedAsset.current = null;
      reset({
        ...defaults,
        dataClassification: [
          "public",
          "internal",
          "confidential",
          "restricted",
        ].includes(asset.dataClassification ?? "")
          ? (asset.dataClassification ?? "")
          : "",
      });
      dialog.showModal();
    }
    if (!asset && dialog.open) dialog.close();
  }, [asset, reset]);

  useEffect(() => {
    if (!asset) {
      initializedAsset.current = null;
      return;
    }
    if (
      !detail.data ||
      detail.data.id !== asset.id ||
      initializedAsset.current === asset.id
    )
      return;
    const basis = detail.data.classification;
    reset({
      ...defaults,
      ...(basis
        ? {
            confidentialityImpact: basis.confidentialityImpact,
            integrityImpact: basis.integrityImpact,
            availabilityImpact: basis.availabilityImpact,
            businessImpact: basis.businessImpact,
            rationale: basis.rationale,
            dataClassificationBasis: basis.dataClassificationBasis ?? "",
          }
        : {}),
      dataClassification: detail.data.dataClassification.toLowerCase(),
    });
    initializedAsset.current = asset.id;
  }, [asset, detail.data, reset]);

  const preview = previewAssetCriticality(
    useWatch({
      control,
      name: [
        "confidentialityImpact",
        "integrityImpact",
        "availabilityImpact",
        "businessImpact",
      ],
    }),
  );

  const close = (): void => {
    reset(defaults);
    setMessage(undefined);
    onClose();
  };
  const submit = async (
    values: ClassifyAssetCriticalityRequest,
  ): Promise<void> => {
    if (!asset || !detail.data || detail.isError || detail.isPending) return;
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
  const blocked =
    archived || detail.isPending || detail.isError || mutation.isPending;
  return (
    <Dialog
      title="Classify Asset"
      dialogRef={dialogRef}
      onClose={close}
      className="max-h-[calc(100dvh-2rem)] w-[min(48rem,calc(100%-2rem))] overflow-y-auto"
    >
      {asset ? (
        <form className="space-y-4" noValidate onSubmit={handleSubmit(submit)}>
          <p className="text-sm">
            <strong>{asset.assetCode}</strong> – {asset.name}. Current
            criticality: {criticalityLabels[asset.criticality]}.
          </p>
          <p className="text-muted text-xs leading-5">
            Assess the potential impact if this asset is compromised or
            unavailable.
          </p>
          <details className="text-sm">
            <summary className="cursor-pointer font-medium">
              Methodology
            </summary>
            <p className="text-muted mt-2 leading-6">
              SECURAAI-ASSET-IMPACT-v1: internal method informed by FIPS PUB 199
              (2004), Section 3. This is not a FIPS categorization. Score
              potential impact, not likelihood or control effectiveness.
            </p>
          </details>
          {detail.isPending ? (
            <p role="status">Loading classification context…</p>
          ) : null}
          {detail.isError ? (
            <Alert>
              Unable to load classification context.{" "}
              <Button
                type="button"
                variant="secondary"
                onClick={() => void detail.refetch()}
              >
                Try again
              </Button>
            </Alert>
          ) : null}
          {detail.data ? (
            <section
              aria-label="Asset context"
              className="border-border rounded-lg border p-3 text-sm"
            >
              <h3 className="font-medium">Asset context</h3>
              <dl className="mt-2 space-y-2">
                {[
                  ["Owner", detail.data.owner?.fullName ?? "Unassigned"],
                  [
                    "Business service",
                    detail.data.businessService?.name ?? "Unassigned",
                  ],
                  [
                    "Dependencies",
                    detail.data.dependencies
                      .map((link) => link.asset.name)
                      .join(", ") || "None",
                  ],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="grid gap-1 sm:grid-cols-[9rem_1fr] sm:gap-3"
                  >
                    <dt className="text-muted">{label}</dt>
                    <dd className="min-w-0 break-words">{value}</dd>
                  </div>
                ))}
              </dl>
              <p className="text-muted mt-3 text-xs">
                {detail.data.classification
                  ? "Latest assessment loaded."
                  : "No saved assessment basis. Complete all four criteria."}
              </p>
            </section>
          ) : null}
          <h3 className="font-semibold">1. Asset Criticality</h3>
          <details className="text-sm">
            <summary className="cursor-pointer font-medium">
              Scoring guide (internal 1–5 scale)
            </summary>
            <dl className="mt-3 space-y-3 leading-6">
              {[
                [
                  "1 — Limited",
                  "Limited, localized harm; primary functions continue.",
                ],
                ["2 — Recoverable", "Material but recoverable disruption."],
                [
                  "3 — Serious",
                  "Serious disruption, significant loss or harm; primary functions still operate.",
                ],
                [
                  "4 — Severe",
                  "Severe disruption; a primary function cannot operate.",
                ],
                [
                  "5 — Catastrophic",
                  "Catastrophic or prolonged loss of essential operations, major asset damage or severe harm to people.",
                ],
              ].map(([label, description]) => (
                <div
                  key={label}
                  className="grid gap-1 sm:grid-cols-[10rem_1fr] sm:gap-3"
                >
                  <dt className="font-medium">{label}</dt>
                  <dd className="text-muted">{description}</dd>
                </div>
              ))}
            </dl>
            <p className="text-muted mt-3 text-xs leading-5">
              Explain asset-specific evidence for every score in Assessment
              basis.
            </p>
          </details>
          {archived ? (
            <Alert>Archived assets cannot be classified.</Alert>
          ) : null}
          {message ? (
            <Alert className="border-danger/25 bg-danger-soft text-danger">
              {message}
            </Alert>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <ScoreField
              id="confidentialityImpact"
              label="Confidentiality impact"
              error={errors.confidentialityImpact?.message}
              disabled={blocked}
              help="Harm from unauthorized disclosure of information."
              registration={register("confidentialityImpact", {
                valueAsNumber: true,
              })}
            />
            <ScoreField
              id="integrityImpact"
              label="Integrity impact"
              error={errors.integrityImpact?.message}
              disabled={blocked}
              help="Harm from unauthorized alteration or destruction of information."
              registration={register("integrityImpact", {
                valueAsNumber: true,
              })}
            />
            <ScoreField
              id="availabilityImpact"
              label="Availability impact"
              error={errors.availabilityImpact?.message}
              disabled={blocked}
              help="Harm from loss of timely, reliable access or service."
              registration={register("availabilityImpact", {
                valueAsNumber: true,
              })}
            />
            <ScoreField
              id="businessImpact"
              label="Business impact"
              error={errors.businessImpact?.message}
              disabled={blocked}
              help="Operational, financial and customer-service consequences; an internal extension."
              registration={register("businessImpact", { valueAsNumber: true })}
            />
          </div>
          <section
            aria-label="Criticality preview"
            className="bg-neutral-soft space-y-2 rounded-lg p-3 text-sm"
          >
            <p role="status">
              Calculated preview:{" "}
              <strong>{preview ?? "Select all four scores"}</strong>
            </p>
            <p className="text-muted text-xs leading-5">
              Uses the highest score across Confidentiality, Integrity,
              Availability and Business impact.
            </p>
            <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                ["1", "Low"],
                ["2–3", "Medium"],
                ["4", "High"],
                ["5", "Critical"],
              ].map(([score, label]) => (
                <div key={score}>
                  <dt className="text-muted text-xs">Score {score}</dt>
                  <dd className="font-medium">{label}</dd>
                </div>
              ))}
            </dl>
          </section>
          <FormField
            id="classification-rationale"
            label="Criticality assessment basis"
            error={errors.rationale?.message}
          >
            <Textarea
              id="classification-rationale"
              rows={4}
              maxLength={2000}
              disabled={blocked}
              {...register("rationale")}
            />
          </FormField>
          <p className="text-muted text-xs">
            Explain the information handled, disclosure/alteration/outage
            consequences, business impact and supporting evidence. Saving
            replaces the latest basis; it does not recalculate related risks
            automatically.
          </p>
          <h3 className="border-border border-t pt-4 font-semibold">
            2. Data Classification
          </h3>
          <FormField
            id="data-classification"
            label="Data classification"
            error={errors.dataClassification?.message}
          >
            <Select
              id="data-classification"
              disabled={blocked}
              {...register("dataClassification")}
            >
              <option value="">Select data classification</option>
              <option value="public">Public</option>
              <option value="internal">Internal</option>
              <option value="confidential">Confidential</option>
              <option value="restricted">Restricted</option>
            </Select>
          </FormField>
          <details className="text-sm">
            <summary className="cursor-pointer font-medium">
              Data classification guide
            </summary>
            <dl className="mt-3 space-y-2 leading-6">
              {[
                ["Public", "Approved for public disclosure."],
                ["Internal", "For use within the organization."],
                ["Confidential", "Access limited to authorized people."],
                [
                  "Restricted",
                  "Sensitive information requiring strict access controls.",
                ],
              ].map(([label, description]) => (
                <div
                  key={label}
                  className="grid gap-1 sm:grid-cols-[9rem_1fr] sm:gap-3"
                >
                  <dt className="font-medium">{label}</dt>
                  <dd className="text-muted">{description}</dd>
                </div>
              ))}
            </dl>
          </details>
          <p className="text-muted text-xs leading-5">
            Select the highest sensitivity actually handled. Data classification
            does not automatically determine Criticality.
          </p>

          <details className="text-sm">
            <summary className="cursor-pointer font-medium">
              Data classification methodology
            </summary>
            <p className="text-muted mt-2 leading-6">
              SECURAAI-DATA-CLASSIFICATION-v1: internal labels informed by
              ISO/IEC 27002:2022, Control 5.12 (Classification of information).
              ISO does not prescribe these four labels. This records
              classification; it does not automatically enforce access controls.
            </p>
          </details>
          <FormField
            id="data-classification-basis"
            label="Data classification basis"
            error={errors.dataClassificationBasis?.message}
          >
            <Textarea
              id="data-classification-basis"
              rows={3}
              maxLength={2000}
              disabled={blocked}
              aria-invalid={Boolean(errors.dataClassificationBasis)}
              aria-describedby={
                errors.dataClassificationBasis
                  ? "data-classification-basis-help data-classification-basis-error"
                  : "data-classification-basis-help"
              }
              {...register("dataClassificationBasis")}
            />
          </FormField>
          <p
            id="data-classification-basis-help"
            className="text-muted text-xs leading-5"
          >
            Describe the information handled and justify its sensitivity,
            including relevant disclosure, contractual or protection
            requirements. Do not enter actual customer records, passwords or
            secrets. Older assessments without a separate basis require one
            before saving again.
          </p>
          <div className="flex justify-end gap-2">
            <Button
              className="bg-surface text-foreground ring-border hover:bg-neutral-soft ring-1"
              onClick={close}
              type="button"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={blocked}>
              {mutation.isPending ? "Saving…" : "Save classification"}
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
  help,
}: {
  id: string;
  label: string;
  error: string | undefined;
  disabled: boolean;
  registration: UseFormRegisterReturn;
  help: string;
}) {
  return (
    <FormField id={id} label={label} error={error}>
      <Input
        id={id}
        type="number"
        min={1}
        max={5}
        step={1}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-help ${id}-error` : `${id}-help`}
        {...registration}
      />
      <p className="text-muted mt-1 text-xs" id={`${id}-help`}>
        {help}
      </p>
    </FormField>
  );
}
