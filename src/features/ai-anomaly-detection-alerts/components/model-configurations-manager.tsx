"use client";

import { Bot, Eye, Search, SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/data-display/data-table";
import { Pagination } from "@/components/data-display/pagination";
import {
  MetricStrip,
  ProductPageHeader,
  ProductPanel,
  StatusBadge,
} from "@/components/data-display/static-product";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { TableSkeleton } from "@/components/ui/skeleton";
import { useSessionUser } from "@/features/authentication-account";
import { useModelConfigurations } from "../hooks/use-model-configurations";
import type { ModelConfiguration } from "../schemas/model-configuration-schema";
import { ConfigureDetectionThresholdDialog } from "./configure-detection-threshold-dialog";
import { ModelConfigurationDetailDialog } from "./model-configuration-detail-dialog";

type ModelStatus = ModelConfiguration["status"];

export function ModelConfigurationsManager() {
  const [page, setPage] = useState(1);
  const [draft, setDraft] = useState("");
  const [modelName, setModelName] = useState("");
  const [status, setStatus] = useState<ModelStatus | "all">("all");
  const [viewing, setViewing] = useState<ModelConfiguration | null>(null);
  const [thresholdOpen, setThresholdOpen] = useState(false);
  const session = useSessionUser();
  const canManageThreshold =
    session.data?.permissions.includes("ai-alerts.thresholds.manage") ?? false;
  const models = useModelConfigurations({
    page,
    limit: 20,
    ...(modelName ? { modelName } : {}),
    ...(status === "all" ? {} : { status }),
  });
  const items = models.data?.items ?? [];
  const evaluated = items.filter((item) => item.latestEvaluation !== null);
  const deployed = items.filter((item) => item.status === "deployed").length;
  const averageF1 = average(
    evaluated.map((item) => item.latestEvaluation?.f1Score ?? null),
  );
  const isFiltered = Boolean(modelName || status !== "all");

  const clearFilters = (): void => {
    setDraft("");
    setModelName("");
    setStatus("all");
    setPage(1);
  };

  const columns: readonly DataTableColumn<ModelConfiguration>[] = [
    {
      key: "model",
      header: "Model",
      cell: (item) => (
        <div className="py-0.5">
          <strong className="text-foreground block font-medium [overflow-wrap:anywhere]">
            {item.modelName}
          </strong>
          <span className="text-muted mt-0.5 block text-xs">
            {formatModelType(item.modelType)}
          </span>
        </div>
      ),
    },
    {
      key: "version",
      header: "Version",
      cell: (item) => (
        <span className="border-border bg-neutral-soft/80 inline-flex rounded px-1.5 py-0.5 font-mono text-xs font-semibold tabular-nums">
          v{item.version}
        </span>
      ),
    },
    {
      key: "dataset",
      header: "Dataset",
      cell: (item) =>
        item.dataset ? (
          <span className="block min-w-36">
            <strong className="block text-sm font-medium">
              {item.dataset.name}
            </strong>
            <span className="text-muted block text-xs tabular-nums">
              v{item.dataset.version}
            </span>
          </span>
        ) : (
          <span className="text-muted text-sm">Not linked</span>
        ),
    },
    {
      key: "f1",
      header: "F1 score",
      cell: (item) => formatRatio(item.latestEvaluation?.f1Score ?? null),
    },
    {
      key: "precision",
      header: "Precision",
      cell: (item) => formatRatio(item.latestEvaluation?.precision ?? null),
    },
    {
      key: "recall",
      header: "Recall",
      cell: (item) => formatRatio(item.latestEvaluation?.recall ?? null),
    },
    {
      key: "status",
      header: "Status",
      cell: (item) => (
        <StatusBadge tone={statusTone(item.status)}>
          {formatStatus(item.status)}
        </StatusBadge>
      ),
    },
    {
      key: "action",
      header: "Actions",
      cell: (item) => (
        <Button
          className="min-h-8 gap-1.5 px-2.5 text-xs font-medium"
          onClick={() => setViewing(item)}
          type="button"
          variant="secondary"
        >
          <Eye aria-hidden="true" className="size-3.5" strokeWidth={1.8} />
          Details
        </Button>
      ),
    },
  ];

  return (
    <>
      <ProductPageHeader
        title="Model versions & evaluation"
        description="Review deployed and historical anomaly-scoring configurations and their measured performance. These versions calculate detection scores; Ollama is used only to explain stored alert evidence."
        additionalActions={
          canManageThreshold ? (
            <Button onClick={() => setThresholdOpen(true)}>
              <SlidersHorizontal
                aria-hidden="true"
                className="size-4"
                strokeWidth={1.8}
              />
              Configure Detection Threshold
            </Button>
          ) : null
        }
        showSampleNotice={false}
      />
      <MetricStrip
        ariaLabel="Model version metrics"
        metrics={[
          {
            label: "Model versions",
            value: models.data ? String(models.data.pagination.total) : "—",
            detail: "All registered versions",
            tone: "brand",
            loading: models.isPending,
          },
          {
            label: "Deployed",
            value: models.data ? String(deployed) : "—",
            detail: "On this page",
            tone: "brand",
            loading: models.isPending,
          },
          {
            label: "Evaluated",
            value: models.data ? String(evaluated.length) : "—",
            detail: "On this page",
            tone: "neutral",
            loading: models.isPending,
          },
          {
            label: "Average F1",
            value: models.data
              ? averageF1 === null
                ? "Not evaluated"
                : formatRatio(averageF1)
              : "—",
            detail: "Latest evaluations on page",
            tone: "neutral",
            loading: models.isPending,
          },
        ]}
      />
      <ProductPanel
        title="Model versions"
        description={
          models.isPlaceholderData && models.isFetching
            ? "Updating model versions…"
            : models.data
              ? `${models.data.pagination.total} versions found`
              : "V2 model registry"
        }
      >
        <form
          className="border-border flex flex-wrap items-center gap-2 border-b p-4"
          onSubmit={(event) => {
            event.preventDefault();
            setPage(1);
            setModelName(draft.trim());
          }}
        >
          <label className="relative block max-w-md min-w-[220px] flex-1">
            <span className="sr-only">Search model versions</span>
            <Search
              className="text-muted absolute top-1/2 left-3 size-4 -translate-y-1/2"
              aria-hidden="true"
            />
            <Input
              className="bg-background min-h-10 pl-9"
              value={draft}
              maxLength={150}
              placeholder="Search by model name"
              onChange={(event) => setDraft(event.target.value)}
            />
          </label>
          <Select
            className="min-h-10 w-full sm:w-44"
            aria-label="Filter by model status"
            value={status}
            onChange={(event) => {
              setPage(1);
              setStatus(event.target.value as ModelStatus | "all");
            }}
          >
            <option value="all">All statuses</option>
            <option value="development">Development</option>
            <option value="validated">Validated</option>
            <option value="deployed">Deployed</option>
            <option value="retired">Retired</option>
          </Select>
          <Button className="min-h-10" type="submit">
            Search
          </Button>
          {isFiltered ? (
            <Button
              className="min-h-10 gap-1.5"
              onClick={clearFilters}
              type="button"
              variant="secondary"
            >
              <X aria-hidden="true" className="size-4" strokeWidth={1.8} />
              Clear
            </Button>
          ) : null}
        </form>
        <div className="p-4">
          {models.isPending ||
          (models.isPlaceholderData && models.isFetching) ? (
            <TableSkeleton
              headers={[
                "Model",
                "Version",
                "Dataset",
                "F1 score",
                "Precision",
                "Recall",
                "Status",
                "Actions",
              ]}
              label="Loading model versions"
              rows={4}
            />
          ) : models.isError ? (
            <Alert>
              Unable to load model versions and evaluation metrics. Check your
              session and backend connection.
            </Alert>
          ) : items.length === 0 ? (
            <div className="py-12 text-center">
              <Bot className="text-muted mx-auto size-10 stroke-1" />
              <h3 className="mt-2 text-base font-semibold">
                No model versions found
              </h3>
              <p className="text-muted mt-1 text-sm">
                {isFiltered
                  ? "No model versions match the current search and status filters."
                  : "No anomaly detection model versions have been registered yet."}
              </p>
              {isFiltered ? (
                <Button
                  className="mt-4 min-h-9 gap-1.5 text-xs"
                  onClick={clearFilters}
                  type="button"
                  variant="secondary"
                >
                  <X aria-hidden="true" className="size-3.5" />
                  Clear filters
                </Button>
              ) : null}
            </div>
          ) : (
            <DataTable
              columns={columns}
              rows={items}
              getRowKey={(item) => item.id}
            />
          )}
        </div>
        {models.data &&
        models.data.items.length > 0 &&
        !models.isPlaceholderData ? (
          <div className="border-border border-t p-4">
            <Pagination
              page={models.data.pagination.page}
              pageCount={models.data.pagination.totalPages}
              onPageChange={setPage}
            />
          </div>
        ) : null}
      </ProductPanel>
      <ModelConfigurationDetailDialog
        configuration={viewing}
        onClose={() => setViewing(null)}
      />
      <ConfigureDetectionThresholdDialog
        open={thresholdOpen}
        onClose={() => setThresholdOpen(false)}
      />
    </>
  );
}

function average(values: readonly (number | null)[]): number | null {
  const available = values.filter((value): value is number => value !== null);
  return available.length
    ? available.reduce((total, value) => total + value, 0) / available.length
    : null;
}
function formatRatio(value: number | null): string {
  return value === null ? "Not evaluated" : `${(value * 100).toFixed(1)}%`;
}
function formatStatus(value: ModelStatus): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
function formatModelType(value: string): string {
  return value
    .replaceAll("_", " ")
    .replace(/^./, (character) => character.toUpperCase());
}
function statusTone(value: ModelStatus) {
  if (value === "deployed") return "success" as const;
  if (value === "validated") return "info" as const;
  if (value === "retired") return "neutral" as const;
  return "warning" as const;
}
