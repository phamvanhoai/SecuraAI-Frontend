"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Gauge,
  LoaderCircle,
  Pencil,
  Plus,
  Search,
  ShieldAlert,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useForm } from "react-hook-form";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/data-display/data-table";
import { Pagination } from "@/components/data-display/pagination";
import {
  ProductPanel,
  StatusBadge,
} from "@/components/data-display/static-product";
import { useToast } from "@/components/feedback/toast";
import { FormField } from "@/components/forms/form-field";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { TableSkeleton } from "@/components/ui/skeleton";
import {
  useAlertThresholdAssetOptions,
  useAlertThresholds,
  useSetAlertThreshold,
} from "../hooks/use-alert-thresholds";
import {
  alertThresholdFormSchema,
  thresholdRiskLevels,
  type AlertThreshold,
  type AlertThresholdFormInput,
  type AlertThresholdFormValues,
} from "../schemas/alert-threshold-schema";

const defaults: AlertThresholdFormInput = {
  assetId: "",
  thresholdPercent: 80,
  riskLevelMin: "",
  enabled: true,
};

export function AssetThresholdOverridesManager() {
  const [page, setPage] = useState(1);
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<AlertThreshold | null | undefined>();
  const thresholds = useAlertThresholds(page, query, true);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setQuery(draft.trim());
  }

  function clearSearch() {
    setDraft("");
    setQuery("");
    setPage(1);
  }

  const columns: readonly DataTableColumn<AlertThreshold>[] = [
    {
      key: "asset",
      header: "Asset",
      cell: (item) => (
        <span className="block min-w-48 py-0.5">
          <strong className="text-foreground block font-medium">
            {item.asset.assetCode}
          </strong>
          <span className="text-muted mt-0.5 block text-xs">
            {item.asset.name}
          </span>
        </span>
      ),
    },
    {
      key: "threshold",
      header: "Alert threshold",
      cell: (item) => (
        <span className="font-medium tabular-nums">
          {Math.round(item.threshold * 100)}%
        </span>
      ),
    },
    {
      key: "risk",
      header: "Minimum AI risk",
      cell: (item) =>
        item.riskLevelMin ? formatLevel(item.riskLevelMin) : "Any level",
    },
    {
      key: "status",
      header: "Status",
      cell: (item) => (
        <StatusBadge tone={item.enabled ? "success" : "neutral"}>
          {item.enabled ? "Enabled" : "Disabled"}
        </StatusBadge>
      ),
    },
    {
      key: "action",
      header: "Actions",
      cell: (item) => (
        <Button
          className="min-h-8 gap-1.5 px-2.5 text-xs font-medium"
          onClick={() => setEditing(item)}
          type="button"
          variant="secondary"
        >
          <Pencil aria-hidden="true" className="size-3.5" strokeWidth={1.8} />
          Edit
        </Button>
      ),
    },
  ];

  return (
    <>
      <ProductPanel
        description={
          thresholds.data
            ? `${thresholds.data.pagination.total} asset-specific overrides found`
            : "Override the deployed model threshold for individual assets"
        }
        title="Asset threshold overrides"
      >
        <form
          className="border-border flex flex-wrap items-center gap-2 border-b p-4"
          onSubmit={submitSearch}
        >
          <label className="relative block max-w-md min-w-[220px] flex-1">
            <span className="sr-only">Search asset threshold overrides</span>
            <Search
              aria-hidden="true"
              className="text-muted absolute top-1/2 left-3 size-4 -translate-y-1/2"
              strokeWidth={1.8}
            />
            <Input
              className="bg-background min-h-10 pl-9"
              maxLength={100}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Search by asset code or name"
              value={draft}
            />
          </label>
          <Button className="min-h-10" type="submit">
            Search
          </Button>
          {query ? (
            <Button
              className="min-h-10 gap-1.5"
              onClick={clearSearch}
              type="button"
              variant="secondary"
            >
              <X aria-hidden="true" className="size-4" strokeWidth={1.8} />
              Clear
            </Button>
          ) : null}
          <Button
            className="min-h-10 gap-1.5 sm:ml-auto"
            onClick={() => setEditing(null)}
            type="button"
          >
            <Plus aria-hidden="true" className="size-4" strokeWidth={1.8} />
            Add override
          </Button>
        </form>

        <div className="p-4">
          {thresholds.isPending ? (
            <TableSkeleton
              headers={[
                "Asset",
                "Alert threshold",
                "Minimum AI risk",
                "Status",
                "Actions",
              ]}
              label="Loading asset threshold overrides"
              rows={6}
            />
          ) : thresholds.isError ? (
            <Alert>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span>
                  Unable to load asset threshold overrides. Check your session
                  and backend connection.
                </span>
                <Button
                  onClick={() => void thresholds.refetch()}
                  type="button"
                  variant="secondary"
                >
                  Retry
                </Button>
              </div>
            </Alert>
          ) : thresholds.data?.items.length ? (
            <DataTable
              columns={columns}
              getRowKey={(item) => item.id}
              rows={thresholds.data.items}
            />
          ) : (
            <div className="py-12 text-center">
              <SlidersHorizontal className="text-muted mx-auto size-10 stroke-1" />
              <h3 className="mt-2 text-base font-semibold">
                No asset threshold overrides found
              </h3>
              <p className="text-muted mt-1 text-sm">
                {query
                  ? "No configured overrides match the current search."
                  : "Add an override when an asset needs a threshold different from the deployed model."}
              </p>
              <Button
                className="mt-4 min-h-9 gap-1.5 text-xs"
                onClick={query ? clearSearch : () => setEditing(null)}
                type="button"
                variant={query ? "secondary" : "primary"}
              >
                {query ? (
                  <X aria-hidden="true" className="size-3.5" />
                ) : (
                  <Plus aria-hidden="true" className="size-3.5" />
                )}
                {query ? "Clear search" : "Add first override"}
              </Button>
            </div>
          )}
        </div>

        {thresholds.data && thresholds.data.items.length > 0 ? (
          <div className="border-border border-t p-4">
            <Pagination
              onPageChange={setPage}
              page={thresholds.data.pagination.page}
              pageCount={thresholds.data.pagination.totalPages}
            />
          </div>
        ) : null}
      </ProductPanel>

      <ThresholdFormDialog
        editing={editing}
        onClose={() => setEditing(undefined)}
        open={editing !== undefined}
      />
    </>
  );
}

function ThresholdFormDialog({
  editing,
  open,
  onClose,
}: {
  editing: AlertThreshold | null | undefined;
  open: boolean;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [message, setMessage] = useState<string>();
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const assets = useAlertThresholdAssetOptions(query, open && !editing);
  const mutation = useSetAlertThreshold();
  const toast = useToast();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AlertThresholdFormInput, unknown, AlertThresholdFormValues>({
    resolver: zodResolver(alertThresholdFormSchema),
    defaultValues: defaults,
  });

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    reset(
      editing
        ? {
            assetId: editing.asset.id,
            thresholdPercent: editing.threshold * 100,
            riskLevelMin: editing.riskLevelMin ?? "",
            enabled: editing.enabled,
          }
        : defaults,
    );
  }, [editing, reset]);

  function close() {
    setMessage(undefined);
    setDraft("");
    setQuery("");
    onClose();
  }

  async function submit(values: AlertThresholdFormValues) {
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
      toast.success(
        "Asset threshold override saved",
        "Future detection runs will apply this asset-specific configuration.",
      );
      close();
    } catch (error: unknown) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to save the asset threshold override.",
      );
    }
  }

  return (
    <Dialog
      className="max-h-[calc(100dvh-2rem)] w-[min(40rem,calc(100%-2rem))] overflow-y-auto"
      dialogRef={dialogRef}
      onClose={close}
      title={
        editing
          ? "Edit asset threshold override"
          : "Add asset threshold override"
      }
    >
      <p className="text-muted -mt-2 mb-5 text-sm leading-5">
        {editing
          ? "Update when this asset should generate an AI alert and whether the override is active."
          : "Choose an active asset and define when its anomaly score should generate an AI alert."}
      </p>

      <form className="space-y-6" noValidate onSubmit={handleSubmit(submit)}>
        <section
          className="space-y-4"
          aria-labelledby="threshold-asset-section"
        >
          <SectionHeading icon={ShieldAlert} id="threshold-asset-section">
            Asset scope
          </SectionHeading>
          {editing ? (
            <FormField id="threshold-asset" label="Asset">
              <Input
                className="bg-neutral-soft/50"
                id="threshold-asset"
                readOnly
                value={`${editing.asset.assetCode} — ${editing.asset.name}`}
              />
            </FormField>
          ) : (
            <>
              <div className="flex flex-col gap-2 sm:flex-row">
                <label className="relative min-w-0 flex-1">
                  <span className="sr-only">Search active assets</span>
                  <Search
                    aria-hidden="true"
                    className="text-muted absolute top-1/2 left-3 size-4 -translate-y-1/2"
                    strokeWidth={1.8}
                  />
                  <Input
                    className="pl-9"
                    maxLength={100}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder="Search active assets"
                    value={draft}
                  />
                </label>
                <Button
                  onClick={() => setQuery(draft.trim())}
                  type="button"
                  variant="secondary"
                >
                  Search assets
                </Button>
              </div>
              <FormField
                error={errors.assetId?.message}
                id="threshold-asset"
                label="Asset *"
              >
                <Select
                  aria-describedby={
                    errors.assetId ? "threshold-asset-error" : undefined
                  }
                  aria-invalid={Boolean(errors.assetId)}
                  id="threshold-asset"
                  {...register("assetId")}
                >
                  <option value="">Select an active asset</option>
                  {assets.data?.map((asset) => (
                    <option key={asset.id} value={asset.id}>
                      {asset.assetCode} — {asset.name}
                    </option>
                  ))}
                </Select>
              </FormField>
              {assets.isPending ? (
                <p
                  className="text-muted flex items-center gap-2 text-xs"
                  role="status"
                >
                  <LoaderCircle
                    aria-hidden="true"
                    className="size-3.5 animate-spin motion-reduce:animate-none"
                  />
                  Loading active assets…
                </p>
              ) : null}
              {assets.isError ? (
                <Alert>
                  Unable to load active assets. Check your session and backend
                  connection.
                </Alert>
              ) : null}
            </>
          )}
        </section>

        <section
          className="space-y-4"
          aria-labelledby="threshold-rules-section"
        >
          <SectionHeading icon={Gauge} id="threshold-rules-section">
            Detection rule
          </SectionHeading>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              error={errors.thresholdPercent?.message}
              id="threshold-percent"
              label="Anomaly score threshold (%) *"
            >
              <Input
                aria-describedby={
                  errors.thresholdPercent
                    ? "threshold-percent-help threshold-percent-error"
                    : "threshold-percent-help"
                }
                aria-invalid={Boolean(errors.thresholdPercent)}
                id="threshold-percent"
                max={100}
                min={1}
                type="number"
                {...register("thresholdPercent")}
              />
              <p className="text-muted text-xs" id="threshold-percent-help">
                An alert is created when the asset score reaches this value.
              </p>
            </FormField>
            <FormField id="threshold-risk" label="Minimum AI risk level">
              <Select id="threshold-risk" {...register("riskLevelMin")}>
                <option value="">Any risk level</option>
                {thresholdRiskLevels.map((level) => (
                  <option key={level} value={level}>
                    {formatLevel(level)}
                  </option>
                ))}
              </Select>
              <p className="text-muted text-xs">
                Optionally require both the score and this risk level.
              </p>
            </FormField>
          </div>
          <label className="border-border bg-neutral-soft/40 flex min-h-11 items-start gap-3 rounded-lg border p-3 text-sm">
            <Checkbox className="mt-0.5" {...register("enabled")} />
            <span>
              <span className="block font-medium">Enable this override</span>
              <span className="text-muted mt-0.5 block text-xs leading-5">
                Disable it to restore the deployed model threshold without
                deleting this configuration.
              </span>
            </span>
          </label>
        </section>

        {message ? (
          <Alert className="border-danger/25 bg-danger-soft text-danger">
            <strong className="block font-semibold">
              Unable to save override
            </strong>
            <span>{message}</span>
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
                  strokeWidth={1.8}
                />
                Saving…
              </>
            ) : (
              <>
                <SlidersHorizontal
                  aria-hidden="true"
                  className="size-4"
                  strokeWidth={1.8}
                />
                {editing ? "Save changes" : "Add override"}
              </>
            )}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

function SectionHeading({
  icon: Icon,
  id,
  children,
}: {
  icon: typeof Gauge;
  id: string;
  children: string;
}) {
  return (
    <div className="border-border flex items-center gap-2 border-b pb-2.5">
      <Icon
        aria-hidden="true"
        className="text-brand size-4"
        strokeWidth={1.8}
      />
      <h3 className="text-sm font-semibold" id={id}>
        {children}
      </h3>
    </div>
  );
}

function formatLevel(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
