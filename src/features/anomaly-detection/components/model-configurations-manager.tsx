"use client";
import { CheckCircle2, Eye, Plus, Search, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/data-display/data-table";
import { Pagination } from "@/components/data-display/pagination";
import {
  MetricStrip,
  ProductPageHeader,
  ProductPanel,
} from "@/components/data-display/static-product";
import { useToast } from "@/components/feedback/toast";
import { FormField } from "@/components/forms/form-field";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { TableSkeleton } from "@/components/ui/skeleton";
import {
  useActivateModelConfiguration,
  useCreateModelConfiguration,
  useModelConfigurationMetrics,
  useModelConfigurations,
} from "../hooks/use-model-configurations";
import {
  groupingOptions,
  modelConfigurationFormSchema,
  riskLevels,
  type DetectionRule,
  type ModelConfiguration,
  type ModelConfigurationForm,
} from "../schemas/model-configuration-schema";
import { ModelConfigurationDetailDialog } from "./model-configuration-detail-dialog";

const blankRule: DetectionRule = {
  id: "",
  name: "",
  eventType: "",
  threshold: 5,
  windowSeconds: 300,
  groupBy: "sourceIp",
  severity: "medium",
  enabled: true,
};
const defaults: ModelConfigurationForm = {
  modelName: "security-anomaly",
  algorithm: "rule-based",
  version: "",
  provider: "ollama",
  modelPath: "",
  ollamaModel: "qwen3:4b",
  rules: [{ ...blankRule }],
};
const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

export function ModelConfigurationsManager() {
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [draft, setDraft] = useState("");
  const [modelName, setModelName] = useState("");
  const [active, setActive] = useState<"all" | "true" | "false">("all");
  const [formOpen, setFormOpen] = useState(false);
  const [viewing, setViewing] = useState<ModelConfiguration | null>(null);
  const [form, setForm] = useState<ModelConfigurationForm>(defaults);
  const [formError, setFormError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const configurations = useModelConfigurations({
    page,
    limit: 20,
    ...(modelName ? { modelName } : {}),
    ...(active === "all" ? {} : { active: active === "true" }),
  });
  const metrics = useModelConfigurationMetrics();
  const create = useCreateModelConfiguration();
  const activate = useActivateModelConfiguration();
  const items = configurations.data?.items ?? [];

  const updateRule = (index: number, changes: Partial<DetectionRule>) =>
    setForm((current) => ({
      ...current,
      rules: current.rules.map((rule, position) =>
        position === index ? { ...rule, ...changes } : rule,
      ),
    }));
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    const parsed = modelConfigurationFormSchema.safeParse(form);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues)
        next[issue.path.join(".")] ??= issue.message;
      setErrors(next);
      return;
    }
    setErrors({});
    try {
      await create.mutateAsync(parsed.data);
      setFormOpen(false);
      setForm(defaults);
      toast.success(
        "Configuration created",
        "The new immutable model version is ready to activate.",
      );
    } catch {
      setFormError(
        "Unable to create the configuration. Verify the version is unique and try again.",
      );
    }
  }
  async function activateVersion(item: ModelConfiguration) {
    try {
      await activate.mutateAsync(item.id);
      toast.success(
        "Configuration activated",
        `${item.modelName} ${item.version} now controls anomaly detection.`,
      );
    } catch {
      toast.error("Activation failed", "Check your permission and try again.");
    }
  }
  const columns: readonly DataTableColumn<ModelConfiguration>[] = [
    {
      key: "model",
      header: "Model",
      cell: (item) => (
        <span>
          <strong className="block">{item.modelName}</strong>
          <span className="text-muted text-xs">
            {item.provider} / {item.parameters.ollamaModel}
          </span>
        </span>
      ),
    },
    { key: "version", header: "Version", cell: (item) => item.version },
    { key: "algorithm", header: "Algorithm", cell: (item) => item.algorithm },
    {
      key: "rules",
      header: "Rules",
      cell: (item) =>
        `${item.parameters.rules.filter((rule) => rule.enabled).length} enabled / ${item.parameters.rules.length}`,
    },
    {
      key: "status",
      header: "Status",
      cell: (item) => (
        <span
          className={item.active ? "text-success font-semibold" : "text-muted"}
        >
          {item.active ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "created",
      header: "Created",
      cell: (item) => formatDate(item.createdAt),
    },
    {
      key: "action",
      header: "Actions",
      cell: (item) => (
        <div className="flex items-center gap-2">
          <Button
            className="min-h-10 px-3"
            onClick={() => setViewing(item)}
            variant="secondary"
          >
            <Eye aria-hidden="true" className="size-4" strokeWidth={1.8} />
            View details
          </Button>
          {item.active ? (
            <span className="text-muted inline-flex items-center gap-2 text-sm">
              <CheckCircle2 className="size-4" aria-hidden="true" /> Current
            </span>
          ) : (
            <Button
              className="min-h-10 px-3"
              disabled={activate.isPending}
              onClick={() => void activateVersion(item)}
              variant="secondary"
            >
              Activate
            </Button>
          )}
        </div>
      ),
    },
  ];
  return (
    <>
      <ProductPageHeader
        title="Anomaly detection configuration"
        description="Configure immutable model versions, detection rules, and alert thresholds."
        primaryAction="New configuration"
        onPrimaryAction={() => {
          setForm({ ...defaults, rules: [{ ...blankRule }] });
          setErrors({});
          setFormError(null);
          setFormOpen(true);
        }}
        showSampleNotice={false}
      />
      <MetricStrip
        ariaLabel="Model configuration metrics"
        metrics={[
          {
            label: "Configurations",
            value: metrics.data ? String(metrics.data.configurations) : "—",
            detail: "Across all configurations",
            tone: "brand",
            loading: metrics.isPending,
          },
          {
            label: "Active versions",
            value: metrics.data ? String(metrics.data.activeVersions) : "—",
            detail: "Across all configurations",
            tone: "neutral",
            loading: metrics.isPending,
          },
          {
            label: "Detection rules",
            value: metrics.data ? String(metrics.data.detectionRules) : "—",
            detail: "Across all configurations",
            tone: "neutral",
            loading: metrics.isPending,
          },
          {
            label: "Enabled rules",
            value: metrics.data ? String(metrics.data.enabledRules) : "—",
            detail: "Across all configurations",
            tone: "neutral",
            loading: metrics.isPending,
          },
        ]}
      />
      <ProductPanel
        title="Configuration versions"
        description={
          configurations.data
            ? `${configurations.data.pagination.total} configurations found`
            : "Backend-managed model configuration versions"
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
            <span className="sr-only">Search configurations</span>
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
            className="w-40"
            aria-label="Filter by status"
            value={active}
            onChange={(event) => {
              setPage(1);
              setActive(event.target.value as typeof active);
            }}
          >
            <option value="all">All statuses</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </Select>
          <Button className="min-h-10" type="submit">
            Search
          </Button>
        </form>
        <div className="p-4">
          {configurations.isPending ? (
            <TableSkeleton columns={7} label="Loading configurations" />
          ) : configurations.isError ? (
            <Alert>
              Unable to load model configurations. Check your session,
              permission, and backend connection.
            </Alert>
          ) : items.length === 0 ? (
            <div className="py-10 text-center">
              <p className="font-medium">No configurations found</p>
              <p className="text-muted mt-1 text-sm">
                Create a model version to define anomaly detection thresholds.
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
        {configurations.data ? (
          <div className="border-border border-t p-4">
            <Pagination
              page={configurations.data.pagination.page}
              pageCount={configurations.data.pagination.totalPages}
              onPageChange={setPage}
            />
          </div>
        ) : null}
      </ProductPanel>
      <ModelConfigurationDetailDialog
        configuration={viewing}
        onClose={() => setViewing(null)}
      />
      {formOpen ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4">
          <form
            className="border-border bg-surface mx-auto my-8 w-full max-w-4xl space-y-5 rounded-xl border p-6"
            onSubmit={submit}
          >
            <div>
              <h2 className="text-xl font-semibold">
                New anomaly detection configuration
              </h2>
              <p className="text-muted mt-1 text-sm">
                Configurations are versioned and cannot be edited after
                creation.
              </p>
            </div>
            {formError ? <Alert>{formError}</Alert> : null}
            <div className="grid gap-4 md:grid-cols-3">
              <FormField
                id="model-name"
                label="Model name"
                error={errors.modelName}
              >
                <Input
                  id="model-name"
                  value={form.modelName}
                  onChange={(event) =>
                    setForm({ ...form, modelName: event.target.value })
                  }
                />
              </FormField>
              <FormField
                id="model-version"
                label="Version"
                error={errors.version}
              >
                <Input
                  id="model-version"
                  placeholder="e.g. 1.2.0"
                  value={form.version}
                  onChange={(event) =>
                    setForm({ ...form, version: event.target.value })
                  }
                />
              </FormField>
              <FormField
                id="algorithm"
                label="Algorithm"
                error={errors.algorithm}
              >
                <Input
                  id="algorithm"
                  value={form.algorithm}
                  onChange={(event) =>
                    setForm({ ...form, algorithm: event.target.value })
                  }
                />
              </FormField>
              <FormField id="provider" label="Provider" error={errors.provider}>
                <Input
                  id="provider"
                  value={form.provider}
                  onChange={(event) =>
                    setForm({ ...form, provider: event.target.value })
                  }
                />
              </FormField>
              <FormField
                id="runtime-model"
                label="Runtime model"
                error={errors.ollamaModel}
              >
                <Input
                  id="runtime-model"
                  value={form.ollamaModel}
                  onChange={(event) =>
                    setForm({ ...form, ollamaModel: event.target.value })
                  }
                />
              </FormField>
              <FormField
                id="model-path"
                label="Model URL (optional)"
                error={errors.modelPath}
              >
                <Input
                  id="model-path"
                  type="url"
                  value={form.modelPath}
                  onChange={(event) =>
                    setForm({ ...form, modelPath: event.target.value })
                  }
                />
              </FormField>
            </div>
            <section className="space-y-3" aria-labelledby="rules-heading">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 id="rules-heading" className="font-semibold">
                    Detection rules
                  </h3>
                  <p className="text-muted text-sm">
                    An alert is created when matching events reach the threshold
                    within the time window.
                  </p>
                </div>
                <Button
                  variant="secondary"
                  onClick={() =>
                    setForm({
                      ...form,
                      rules: [...form.rules, { ...blankRule }],
                    })
                  }
                >
                  <Plus className="size-4" aria-hidden="true" />
                  Add rule
                </Button>
              </div>
              {errors.rules ? (
                <p className="text-danger text-sm">{errors.rules}</p>
              ) : null}
              {form.rules.map((rule, index) => (
                <div
                  className="border-border grid gap-3 rounded-xl border p-4 md:grid-cols-4"
                  key={index}
                >
                  <FormField
                    id={`rule-${index}-id`}
                    label="Rule ID"
                    error={errors[`rules.${index}.id`]}
                  >
                    <Input
                      id={`rule-${index}-id`}
                      placeholder="failed-login"
                      value={rule.id}
                      onChange={(event) =>
                        updateRule(index, { id: event.target.value })
                      }
                    />
                  </FormField>
                  <FormField
                    id={`rule-${index}-name`}
                    label="Rule name"
                    error={errors[`rules.${index}.name`]}
                  >
                    <Input
                      id={`rule-${index}-name`}
                      value={rule.name}
                      onChange={(event) =>
                        updateRule(index, { name: event.target.value })
                      }
                    />
                  </FormField>
                  <FormField
                    id={`rule-${index}-event`}
                    label="Event type"
                    error={errors[`rules.${index}.eventType`]}
                  >
                    <Input
                      id={`rule-${index}-event`}
                      placeholder="authentication.failed"
                      value={rule.eventType}
                      onChange={(event) =>
                        updateRule(index, { eventType: event.target.value })
                      }
                    />
                  </FormField>
                  <FormField
                    id={`rule-${index}-threshold`}
                    label="Threshold"
                    error={errors[`rules.${index}.threshold`]}
                  >
                    <Input
                      id={`rule-${index}-threshold`}
                      type="number"
                      min={1}
                      max={10000}
                      value={rule.threshold}
                      onChange={(event) =>
                        updateRule(index, {
                          threshold: Number(event.target.value),
                        })
                      }
                    />
                  </FormField>
                  <FormField
                    id={`rule-${index}-window`}
                    label="Window (seconds)"
                    error={errors[`rules.${index}.windowSeconds`]}
                  >
                    <Input
                      id={`rule-${index}-window`}
                      type="number"
                      min={1}
                      max={86400}
                      value={rule.windowSeconds}
                      onChange={(event) =>
                        updateRule(index, {
                          windowSeconds: Number(event.target.value),
                        })
                      }
                    />
                  </FormField>
                  <FormField id={`rule-${index}-group`} label="Group by">
                    <Select
                      id={`rule-${index}-group`}
                      value={rule.groupBy}
                      onChange={(event) =>
                        updateRule(index, {
                          groupBy: event.target
                            .value as DetectionRule["groupBy"],
                        })
                      }
                    >
                      {groupingOptions.map((option) => (
                        <option key={option} value={option}>
                          {option === "sourceIp" ? "Source IP" : "Log source"}
                        </option>
                      ))}
                    </Select>
                  </FormField>
                  <FormField id={`rule-${index}-severity`} label="Severity">
                    <Select
                      id={`rule-${index}-severity`}
                      value={rule.severity}
                      onChange={(event) =>
                        updateRule(index, {
                          severity: event.target
                            .value as DetectionRule["severity"],
                        })
                      }
                    >
                      {riskLevels.map((level) => (
                        <option key={level}>{level}</option>
                      ))}
                    </Select>
                  </FormField>
                  <div className="flex items-end justify-between gap-3 pb-1">
                    <label className="flex min-h-11 items-center gap-2 text-sm font-medium">
                      <input
                        type="checkbox"
                        checked={rule.enabled}
                        onChange={(event) =>
                          updateRule(index, { enabled: event.target.checked })
                        }
                      />
                      Enabled
                    </label>
                    <Button
                      aria-label={`Remove rule ${index + 1}`}
                      disabled={form.rules.length === 1}
                      variant="secondary"
                      onClick={() =>
                        setForm({
                          ...form,
                          rules: form.rules.filter(
                            (_, position) => position !== index,
                          ),
                        })
                      }
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              ))}
            </section>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setFormOpen(false)}>
                Cancel
              </Button>
              <Button disabled={create.isPending} type="submit">
                {create.isPending ? "Creating..." : "Create configuration"}
              </Button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}
