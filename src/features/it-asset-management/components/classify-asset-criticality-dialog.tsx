"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertTriangle,
  Gauge,
  HardDrive,
  History,
  Info,
  Loader2,
  ShieldCheck,
  Tags,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";
import { useForm, useWatch, type UseFormRegisterReturn } from "react-hook-form";
import { useToast } from "@/components/feedback/toast";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
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
import { useAssetClassificationHistory } from "../hooks/use-asset-classification-history";
import { AssetClassificationHistory } from "./asset-classification-history";

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
  const [tab, setTab] = useState<"classify" | "history">("classify");
  const history = useAssetClassificationHistory(asset?.id ?? null, 1);
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
  } = useForm<ClassifyAssetCriticalityInput, unknown, ClassifyAssetCriticalityRequest>({
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
        dataClassification: ["public", "internal", "confidential", "restricted"].includes(
          asset.dataClassification ?? "",
        )
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
    if (!detail.data || detail.data.id !== asset.id || initializedAsset.current === asset.id)
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
      dataClassification: detail.data.dataClassification?.toLowerCase() ?? "",
    });
    initializedAsset.current = asset.id;
  }, [asset, detail.data, reset]);

  const preview = previewAssetCriticality(
    useWatch({
      control,
      name: ["confidentialityImpact", "integrityImpact", "availabilityImpact", "businessImpact"],
    }),
  );

  const close = (): void => {
    reset(defaults);
    setMessage(undefined);
    setTab("classify");
    onClose();
  };

  const submit = async (values: ClassifyAssetCriticalityRequest): Promise<void> => {
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
        error instanceof Error ? error.message : "Unable to classify asset. Please try again.",
      );
    }
  };

  const archived = asset?.status === "archived" || detail.data?.status === "archived";
  const selectedTab = archived ? "history" : tab;
  const blocked = archived || detail.isPending || detail.isError || mutation.isPending;

  const tabs = [
    { id: "classify" as const, label: "Classify Asset", Icon: ShieldCheck },
    { id: "history" as const, label: "History", Icon: History },
  ];

  return (
    <Dialog
      title="Classify Asset"
      dialogRef={dialogRef}
      onClose={close}
      className="max-h-[calc(100dvh-2rem)] w-[min(48rem,calc(100%-2rem))] overflow-y-auto"
    >
      {/* Tab switcher */}
      <div
        role="tablist"
        aria-label="Asset classification views"
        className="border-border bg-surface mb-5 inline-flex w-full items-center gap-1 rounded-xl border p-1 shadow-xs"
      >
        {tabs.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            id={`asset-classification-${id}-tab`}
            aria-controls={`asset-classification-${id}-panel`}
            aria-selected={selectedTab === id}
            disabled={id === "classify" && archived}
            tabIndex={selectedTab === id ? 0 : -1}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50",
              selectedTab === id
                ? "bg-brand text-white shadow-xs"
                : "text-muted hover:text-foreground",
            )}
            onClick={() => setTab(id)}
            onKeyDown={(event) => {
              if (
                archived ||
                !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)
              )
                return;
              event.preventDefault();
              const next =
                event.key === "Home"
                  ? "classify"
                  : event.key === "End"
                    ? "history"
                    : id === "classify"
                      ? "history"
                      : "classify";
              setTab(next);
              dialogRef.current
                ?.querySelector<HTMLButtonElement>(`#asset-classification-${next}-tab`)
                ?.focus();
            }}
          >
            <Icon className="size-3.5" strokeWidth={2} />
            {label}
            {id === "history" && history.data ? ` (${history.data.pagination.total})` : ""}
          </button>
        ))}
      </div>

      {/* History tab panel */}
      <div
        role="tabpanel"
        id="asset-classification-history-panel"
        aria-labelledby="asset-classification-history-tab"
        hidden={selectedTab !== "history"}
      >
        {archived ? (
          <div role="alert" className="border-border bg-neutral-soft/30 mb-4 flex gap-2.5 rounded-xl border p-3.5">
            <AlertTriangle
              className="mt-0.5 size-4 shrink-0 text-warning"
              strokeWidth={1.8}
            />
            <p className="text-xs leading-5">
              <strong className="text-foreground block">Archived asset</strong>
              <span className="text-muted">
                Archived assets cannot be classified. History remains available for review.
              </span>
            </p>
          </div>
        ) : null}
        {selectedTab === "history" && asset ? (
          <AssetClassificationHistory key={asset.id} assetId={asset.id} />
        ) : null}
        <div className="mt-5 flex items-center justify-end border-t border-border pt-4">
          <Button type="button" variant="secondary" onClick={close}>
            Close
          </Button>
        </div>
      </div>

      {/* Classify tab panel */}
      <div
        role="tabpanel"
        id="asset-classification-classify-panel"
        aria-labelledby="asset-classification-classify-tab"
        hidden={selectedTab !== "classify"}
      >
        {asset ? (
          <form
            className="space-y-5"
            noValidate
            onSubmit={(event) => void handleSubmit(submit)(event)}
          >
            {/* Context bar */}
            <div className="border-border bg-neutral-soft/30 flex flex-wrap items-center gap-3 rounded-lg border p-3.5 text-xs">
              <HardDrive className="size-3.5 shrink-0 text-brand" strokeWidth={1.8} />
              <span className="font-semibold tabular-nums">{asset.assetCode}</span>
              <span className="text-muted">·</span>
              <span className="text-muted truncate">{asset.name}</span>
              <span className="text-muted">·</span>
              <span className="text-muted">
                Current:{" "}
                <strong className="text-foreground">
                  {asset.criticality === null ? "—" : criticalityLabels[asset.criticality]}
                </strong>
              </span>
            </div>

            {/* Archived warning */}
            {archived ? (
              <div className="border-border bg-neutral-soft/30 flex gap-2.5 rounded-xl border p-3.5">
                <AlertTriangle
                  className="mt-0.5 size-4 shrink-0 text-warning"
                  strokeWidth={1.8}
                />
                <p className="text-xs leading-5">
                  <strong className="text-foreground block">Archived asset</strong>
                  <span className="text-muted">Archived assets cannot be classified.</span>
                </p>
              </div>
            ) : null}

            {/* Submit error */}
            {message ? (
              <div className="border-border bg-neutral-soft/30 flex gap-2.5 rounded-xl border p-3.5">
                <AlertTriangle
                  className="mt-0.5 size-4 shrink-0 text-danger"
                  strokeWidth={1.8}
                />
                <p className="text-danger text-xs leading-5">{message}</p>
              </div>
            ) : null}

            {/* Asset context */}
            {detail.data ? (
              <div className="border-border bg-neutral-soft/30 space-y-3 rounded-xl border p-4">
                <div className="flex items-start gap-2 border-b border-border pb-2">
                  <HardDrive
                    className="mt-0.5 size-4 shrink-0 text-brand"
                    strokeWidth={1.8}
                  />
                  <h3 className="text-sm font-semibold">Asset context</h3>
                </div>
                <dl className="grid gap-x-6 gap-y-3 text-xs sm:grid-cols-3">
                  {[
                    ["Owner", detail.data.owner?.fullName ?? "Unassigned"],
                    ["Business service", detail.data.businessService?.name ?? "Unassigned"],
                    [
                      "Dependencies",
                      detail.data.dependencies.map((link) => link.asset.name).join(", ") ||
                        "None",
                    ],
                  ].map(([label, value]) => (
                    <div key={label} className="min-w-0">
                      <dt className="text-muted font-medium uppercase tracking-wide">
                        {label}
                      </dt>
                      <dd className="mt-1 font-medium break-words">{value}</dd>
                    </div>
                  ))}
                </dl>
                <p className="border-t border-border pt-2 text-xs text-muted">
                  {detail.data.classification
                    ? "Latest assessment loaded."
                    : "No saved assessment basis. Complete all four criteria."}
                </p>
              </div>
            ) : null}

            {/* â”€â”€ Section 1: Asset Criticality â”€â”€ */}
            <div className="space-y-4">
              <div className="flex items-start gap-2 border-b border-border pb-2">
                <Gauge className="mt-0.5 size-4 shrink-0 text-brand" strokeWidth={1.8} />
                <h3 className="text-sm font-semibold">1. Asset Criticality</h3>
              </div>

              {/* Methodology details */}
              <details className="rounded-xl border border-border text-sm">
                <summary className="focus-visible:outline-brand flex cursor-pointer list-none items-center justify-between gap-2 rounded-xl px-4 py-3 font-medium focus-visible:outline-2 focus-visible:outline-offset-2">
                  <span className="flex items-center gap-2 text-xs">
                    <Info className="size-3.5 text-muted" strokeWidth={1.8} />
                    Scoring guide (internal 1–5 scale)
                  </span>
                </summary>
                <div className="border-t border-border px-4 pb-4 pt-3">
                  <dl className="space-y-3 text-xs leading-6">
                    {[
                      ["1 — Limited", "Limited, localized harm; primary functions continue."],
                      ["2 — Recoverable", "Material but recoverable disruption."],
                      [
                        "3 — Serious",
                        "Serious disruption, significant loss or harm; primary functions still operate.",
                      ],
                      ["4 — Severe", "Severe disruption; a primary function cannot operate."],
                      [
                        "5 — Catastrophic",
                        "Catastrophic or prolonged loss of essential operations, major asset damage or severe harm to people.",
                      ],
                    ].map(([label, description]) => (
                      <div key={label} className="grid gap-1 sm:grid-cols-[10rem_1fr] sm:gap-3">
                        <dt className="font-medium">{label}</dt>
                        <dd className="text-muted">{description}</dd>
                      </div>
                    ))}
                  </dl>
                  <p className="mt-3 text-xs text-muted leading-5">
                    Explain asset-specific evidence for every score in Assessment basis.
                  </p>
                  <p className="mt-2 text-xs text-muted leading-5">
                    SECURAAI-ASSET-IMPACT-v1: internal method informed by FIPS PUB 199 (2004),
                    Section 3. This is not a FIPS categorization. Score potential impact, not
                    likelihood or control effectiveness.
                  </p>
                </div>
              </details>

              {/* Loading skeleton */}
              {detail.isPending ? (
                <div className="space-y-5" role="status" aria-busy="true">
                  <span className="sr-only">Loading classification context…</span>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <Skeleton className="h-12 w-full rounded-xl" />
                  <Skeleton className="h-24 w-full" />
                </div>
              ) : null}

              {/* Load error */}
              {detail.isError ? (
                <div className="border-border bg-neutral-soft/30 flex gap-2.5 rounded-xl border p-3.5">
                  <AlertTriangle
                    className="mt-0.5 size-4 shrink-0 text-danger"
                    strokeWidth={1.8}
                  />
                  <div className="text-xs leading-5">
                    <span className="text-danger font-medium block">
                      Unable to load classification context.
                    </span>
                    <Button
                      type="button"
                      variant="secondary"
                      className="mt-2 h-7 min-h-7 px-2.5 text-xs"
                      onClick={() => void detail.refetch()}
                    >
                      Try again
                    </Button>
                  </div>
                </div>
              ) : null}

              {/* Score fields */}
              <div className="grid gap-4 sm:grid-cols-2">
                <ScoreField
                  id="confidentialityImpact"
                  label="Confidentiality impact"
                  error={errors.confidentialityImpact?.message}
                  disabled={blocked}
                  help="Harm from unauthorized disclosure of information."
                  registration={register("confidentialityImpact", { valueAsNumber: true })}
                />
                <ScoreField
                  id="integrityImpact"
                  label="Integrity impact"
                  error={errors.integrityImpact?.message}
                  disabled={blocked}
                  help="Harm from unauthorized alteration or destruction of information."
                  registration={register("integrityImpact", { valueAsNumber: true })}
                />
                <ScoreField
                  id="availabilityImpact"
                  label="Availability impact"
                  error={errors.availabilityImpact?.message}
                  disabled={blocked}
                  help="Harm from loss of timely, reliable access or service."
                  registration={register("availabilityImpact", { valueAsNumber: true })}
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

              {/* Criticality preview strip */}
              <div className="border-border bg-neutral-soft/30 flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3.5 text-xs">
                <div className="flex items-center gap-2">
                  <Gauge className="size-4 shrink-0 text-brand" strokeWidth={1.8} />
                  <span className="text-muted">Calculated preview:
                  <strong className="text-foreground" role="status">
                    {preview ?? "Select all four scores"}
                  </strong></span>
                </div>
                <div className="flex items-center gap-4 text-muted">
                  {[
                    ["1", "Low"],
                    ["2–3", "Medium"],
                    ["4", "High"],
                    ["5", "Critical"],
                  ].map(([score, label]) => (
                    <span key={score}>
                      <span className="font-medium text-foreground">{label}</span>
                      {" "}({score})
                    </span>
                  ))}
                </div>
              </div>

              {/* Criticality basis textarea */}
              <div className="space-y-1.5">
                <label
                  htmlFor="classification-rationale"
                  className="block text-sm font-medium"
                >
                  Criticality assessment basis
                </label>
                <Textarea
                  id="classification-rationale"
                  rows={4}
                  maxLength={2000}
                  disabled={blocked}
                  aria-invalid={Boolean(errors.rationale)}
                  aria-describedby={
                    errors.rationale
                      ? "classification-rationale-help classification-rationale-error"
                      : "classification-rationale-help"
                  }
                  {...register("rationale")}
                />
                {errors.rationale && (
                  <p
                    id="classification-rationale-error"
                    role="alert"
                    className="text-danger text-xs"
                  >
                    {errors.rationale.message}
                  </p>
                )}
              </div>
              <p id="classification-rationale-help" className="text-muted text-xs leading-5">
                Explain the information handled, disclosure/alteration/outage consequences,
                business impact and supporting evidence. Saving updates the current basis and
                records changes in History; it does not recalculate related risks automatically.
              </p>
            </div>

            {/* â”€â”€ Section 2: Data Classification â”€â”€ */}
            <div className="space-y-4 border-t border-border pt-5">
              <div className="flex items-start gap-2 border-b border-border pb-2">
                <Tags className="mt-0.5 size-4 shrink-0 text-brand" strokeWidth={1.8} />
                <h3 className="text-sm font-semibold">2. Data Classification</h3>
              </div>

              {/* Data classification select */}
              <div className="space-y-1.5">
                <label htmlFor="data-classification" className="block text-sm font-medium">
                  Data classification
                </label>
                <Select
                  id="data-classification"
                  disabled={blocked}
                  aria-invalid={Boolean(errors.dataClassification)}
                  aria-describedby={
                    errors.dataClassification ? "data-classification-error" : undefined
                  }
                  {...register("dataClassification")}
                >
                  <option value="">Select data classification</option>
                  <option value="public">Public</option>
                  <option value="internal">Internal</option>
                  <option value="confidential">Confidential</option>
                  <option value="restricted">Restricted</option>
                </Select>
                {errors.dataClassification && (
                  <p
                    id="data-classification-error"
                    role="alert"
                    className="text-danger text-xs"
                  >
                    {errors.dataClassification.message}
                  </p>
                )}
              </div>

              {/* Data classification guide */}
              <details className="rounded-xl border border-border text-sm">
                <summary className="focus-visible:outline-brand flex cursor-pointer list-none items-center gap-2 rounded-xl px-4 py-3 text-xs font-medium focus-visible:outline-2 focus-visible:outline-offset-2">
                  <Info className="size-3.5 text-muted" strokeWidth={1.8} />
                  Data classification guide
                </summary>
                <div className="border-t border-border px-4 pb-4 pt-3">
                  <dl className="space-y-2 text-xs leading-6">
                    {[
                      ["Public", "Approved for public disclosure."],
                      ["Internal", "For use within the organization."],
                      ["Confidential", "Access limited to authorized people."],
                      ["Restricted", "Sensitive information requiring strict access controls."],
                    ].map(([label, description]) => (
                      <div key={label} className="grid gap-1 sm:grid-cols-[9rem_1fr] sm:gap-3">
                        <dt className="font-medium">{label}</dt>
                        <dd className="text-muted">{description}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </details>

              <p className="text-muted text-xs leading-5">
                Select the highest sensitivity actually handled. Data classification does not
                automatically determine Criticality.
              </p>

              {/* Data classification methodology */}
              <details className="rounded-xl border border-border text-sm">
                <summary className="focus-visible:outline-brand flex cursor-pointer list-none items-center gap-2 rounded-xl px-4 py-3 text-xs font-medium focus-visible:outline-2 focus-visible:outline-offset-2">
                  <Info className="size-3.5 text-muted" strokeWidth={1.8} />
                  Data classification methodology
                </summary>
                <div className="border-t border-border px-4 pb-4 pt-3">
                  <p className="text-muted text-xs leading-5">
                    SECURAAI-DATA-CLASSIFICATION-v1: internal labels informed by ISO/IEC
                    27002:2022, Control 5.12 (Classification of information). ISO does not
                    prescribe these four labels. This records classification; it does not
                    automatically enforce access controls.
                  </p>
                </div>
              </details>

              {/* Data classification basis textarea */}
              <div className="space-y-1.5">
                <label
                  htmlFor="data-classification-basis"
                  className="block text-sm font-medium"
                >
                  Data classification basis
                </label>
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
                {errors.dataClassificationBasis && (
                  <p
                    id="data-classification-basis-error"
                    role="alert"
                    className="text-danger text-xs"
                  >
                    {errors.dataClassificationBasis.message}
                  </p>
                )}
              </div>
              <p id="data-classification-basis-help" className="text-muted text-xs leading-5">
                Describe the information handled and justify its sensitivity, including relevant
                disclosure, contractual or protection requirements. Do not enter actual customer
                records, passwords or secrets. Older assessments without a separate basis require
                one before saving again.
              </p>
            </div>

            {/* Info hint */}
            <div className="border-border bg-neutral-soft/30 flex gap-2.5 rounded-xl border p-3.5">
              <Info className="mt-0.5 size-4 shrink-0 text-brand" strokeWidth={1.8} />
              <p className="text-muted text-xs leading-5">
                Saving updates the current classification basis and records the change in History.
                It does not automatically recalculate risk scores for related risks.
              </p>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
              <Button type="button" variant="secondary" onClick={close}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={blocked}
                className={cn(mutation.isPending && "opacity-80")}
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className="mr-1.5 size-3.5 animate-spin" strokeWidth={2} />
                    Saving…
                  </>
                ) : (
                  "Save classification"
                )}
              </Button>
            </div>
          </form>
        ) : null}
      </div>
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
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
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
      <p className="text-muted text-xs" id={`${id}-help`}>
        {help}
      </p>
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-danger text-xs">
          {error}
        </p>
      ) : null}
    </div>
  );
}
