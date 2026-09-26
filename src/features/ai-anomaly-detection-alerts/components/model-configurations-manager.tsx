"use client";

import { Eye, Search } from "lucide-react";
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
import { useModelConfigurations } from "../hooks/use-model-configurations";
import type { ModelConfiguration } from "../schemas/model-configuration-schema";
import { ModelConfigurationDetailDialog } from "./model-configuration-detail-dialog";

type ModelStatus = ModelConfiguration["status"];

export function ModelConfigurationsManager() {
  const [page, setPage] = useState(1);
  const [draft, setDraft] = useState("");
  const [modelName, setModelName] = useState("");
  const [status, setStatus] = useState<ModelStatus | "all">("all");
  const [viewing, setViewing] = useState<ModelConfiguration | null>(null);
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

  const columns: readonly DataTableColumn<ModelConfiguration>[] = [
    {
      key: "model",
      header: "Model",
      cell: (item) => (
        <span>
          <strong className="block">{item.modelName}</strong>
          <span className="text-muted text-xs">{item.modelType}</span>
        </span>
      ),
    },
    {
      key: "version",
      header: "Version",
      cell: (item) => <span className="tabular-nums">{item.version}</span>,
    },
    {
      key: "dataset",
      header: "Dataset",
      cell: (item) =>
        item.dataset
          ? `${item.dataset.name} ${item.dataset.version}`
          : "Not linked",
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
          className="min-h-10 px-3"
          onClick={() => setViewing(item)}
          variant="secondary"
        >
          <Eye aria-hidden="true" className="size-4" strokeWidth={1.8} />
          View metrics
        </Button>
      ),
    },
  ];

  return (
    <>
      <ProductPageHeader
        title="Model versions & evaluation"
        description="Review deployed and historical anomaly detection models with their latest measured performance."
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
            value: averageF1 === null ? "—" : formatRatio(averageF1),
            detail: "Latest evaluations on page",
            tone: "neutral",
            loading: models.isPending,
          },
        ]}
      />
      <ProductPanel
        title="Model versions"
        description={
          models.data
            ? `${models.data.pagination.total} versions found`
            : "V2 model registry"
        }
      >
        <form
          className="border-border flex flex-wrap gap-2 border-b p-4"
          onSubmit={(event) => {
            event.preventDefault();
            setPage(1);
            setModelName(draft.trim());
          }}
        >
          <label className="relative block w-full max-w-md">
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
            className="w-44"
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
        </form>
        <div className="p-4">
          {models.isPending ? (
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
            <div className="py-10 text-center">
              <p className="font-medium">No model versions found</p>
              <p className="text-muted mt-1 text-sm">
                Adjust the search or status filter.
              </p>
            </div>
          ) : (
            <DataTable
              columns={columns}
              rows={items}
              getRowKey={(item) => item.id}
            />
          )}
        </div>
        {models.data ? (
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
function statusTone(value: ModelStatus) {
  if (value === "deployed") return "success" as const;
  if (value === "validated") return "info" as const;
  if (value === "retired") return "neutral" as const;
  return "warning" as const;
}
