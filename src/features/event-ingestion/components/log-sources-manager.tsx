"use client";

import {
  Database,
  Ellipsis,
  Eye,
  Layers,
  Pencil,
  Radio,
  Search,
  Shield,
  Trash2,
} from "lucide-react";
import { useState, type FormEvent, type MouseEvent } from "react";
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
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { TableSkeleton } from "@/components/ui/skeleton";
import {
  useCreateLogSource,
  useLogSourceMetrics,
  useLogSources,
  useUpdateLogSource,
} from "../hooks/use-log-sources";
import { useEventSources } from "../hooks/use-event-sources";
import { useNormalizedEventMetrics } from "../hooks/use-normalized-events";
import { useEventGovernanceSummary } from "../hooks/use-event-governance";
import {
  logFormats,
  logSourceFormSchema,
  sourceStatuses,
  sourceTypes,
  type LogSource,
  type LogSourceForm,
} from "../schemas/log-source-schema";
import { DeleteLogSourceDialog } from "./delete-log-source-dialog";
import { EventSourcesList } from "./event-sources-list";
import { EventGovernancePoliciesList } from "./event-governance-policies-list";
import { LogSourceDetailDialog } from "./log-source-detail-dialog";
import { NormalizedEventsList } from "./normalized-events-list";
import { RegisterEventSourceForm } from "./register-event-source-form";
import { cn } from "@/lib/utils";

const defaults: LogSourceForm = {
  name: "",
  sourceType: "application",
  status: "active",
  format: "json",
  timezone: "UTC",
  collectRawPayload: true,
};

type LogSourceFormErrors = Partial<Record<keyof LogSourceForm, string>>;

export function LogSourcesManager() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<
    "events" | "event-sources" | "log-sources" | "governance"
  >("events");
  const [page, setPage] = useState(1);
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<LogSource | null>(null);
  const [viewing, setViewing] = useState<LogSource | null>(null);
  const [deleting, setDeleting] = useState<LogSource | null>(null);
  const [form, setForm] = useState<LogSourceForm>(defaults);
  const [formOpen, setFormOpen] = useState(false);
  const [registerEventSourceOpen, setRegisterEventSourceOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<LogSourceFormErrors>({});
  const sources = useLogSources({
    page,
    limit: 20,
    ...(query ? { q: query } : {}),
  });
  const eventSourcesOverview = useEventSources({ limit: 100 });
  const eventMetrics = useNormalizedEventMetrics();
  const metrics = useLogSourceMetrics();
  const governanceSummary = useEventGovernanceSummary();
  const create = useCreateLogSource();
  const update = useUpdateLogSource();

  const totalEventSources = eventSourcesOverview.data?.pagination.total ?? 0;
  const activeEventSources =
    eventSourcesOverview.data?.items.filter((s) => s.status === "ACTIVE").length ?? 0;
  const uniqueSourceTypes = new Set(
    eventSourcesOverview.data?.items.map((s) => s.sourceType) ?? [],
  ).size;
  const uniqueFamilies = new Set(
    eventSourcesOverview.data?.items.flatMap((s) => s.eventFamilies) ?? [],
  ).size;

  const columns: readonly DataTableColumn<LogSource>[] = [
    {
      key: "name",
      header: "Log source",
      cell: (item) => (
        <span>
          <strong className="block">{item.name}</strong>
          <span className="text-muted text-xs">{item.sourceType}</span>
        </span>
      ),
    },
    {
      key: "format",
      header: "Format",
      cell: (item) => item.configuration.format.toUpperCase(),
    },
    { key: "status", header: "Status", cell: (item) => item.status },
    {
      key: "asset",
      header: "Asset",
      cell: (item) => item.asset?.name ?? "Not linked",
    },
    {
      key: "last",
      header: "Last received",
      cell: (item) =>
        item.lastReceivedAt
          ? new Intl.DateTimeFormat("en-US", {
            dateStyle: "medium",
            timeStyle: "short",
          }).format(new Date(item.lastReceivedAt))
          : "Never",
    },
    {
      key: "actions",
      header: "Actions",
      cell: (item) => (
        <DropdownMenu
          className="w-fit"
          label={
            <span className="grid size-6 place-items-center">
              <span className="sr-only">Actions for {item.name}</span>
              <Ellipsis
                aria-hidden="true"
                className="size-5"
                strokeWidth={1.8}
              />
            </span>
          }
        >
          <button
            className="hover:bg-neutral-soft focus-visible:outline-brand flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-left text-sm transition-colors focus-visible:outline-2"
            onClick={(event) => {
              closeActionMenu(event);
              setViewing(item);
            }}
            type="button"
          >
            <Eye aria-hidden="true" className="size-4" strokeWidth={1.8} />
            View details
          </button>
          <button
            className="hover:bg-neutral-soft focus-visible:outline-brand flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-left text-sm transition-colors focus-visible:outline-2"
            onClick={(event) => {
              closeActionMenu(event);
              openEdit(item);
            }}
            type="button"
          >
            <Pencil aria-hidden="true" className="size-4" strokeWidth={1.8} />
            Edit
          </button>
          <button
            className="text-danger hover:bg-danger-soft focus-visible:outline-danger flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-left text-sm transition-colors focus-visible:outline-2"
            onClick={(event) => {
              closeActionMenu(event);
              setDeleting(item);
            }}
            type="button"
          >
            <Trash2 aria-hidden="true" className="size-4" strokeWidth={1.8} />
            Delete
          </button>
        </DropdownMenu>
      ),
    },
  ];

  function openCreate() {
    setEditing(null);
    setForm(defaults);
    setFormError(null);
    setFieldErrors({});
    setFormOpen(true);
  }
  function closeActionMenu(event: MouseEvent<HTMLButtonElement>): void {
    event.currentTarget.closest("details")?.removeAttribute("open");
  }
  function openEdit(item: LogSource) {
    setEditing(item);
    setForm({
      name: item.name,
      sourceType: item.sourceType,
      status: item.status,
      format: item.configuration.format,
      timezone: item.configuration.timezone,
      collectRawPayload: item.configuration.collectRawPayload,
      ...(item.configuration.pollingIntervalSeconds
        ? { pollingIntervalSeconds: item.configuration.pollingIntervalSeconds }
        : {}),
    });
    setFormError(null);
    setFieldErrors({});
    setFormOpen(true);
  }
  function clearFieldError(field: keyof LogSourceForm): void {
    setFieldErrors((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
  }
  async function save(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    const parsed = logSourceFormSchema.safeParse(form);
    if (!parsed.success) {
      const errors: LogSourceFormErrors = {};
      for (const issue of parsed.error.issues) {
        switch (issue.path[0]) {
          case "name":
            errors.name ??= issue.message;
            break;
          case "sourceType":
            errors.sourceType ??= issue.message;
            break;
          case "status":
            errors.status ??= issue.message;
            break;
          case "format":
            errors.format ??= issue.message;
            break;
          case "timezone":
            errors.timezone ??= issue.message;
            break;
          case "collectRawPayload":
            errors.collectRawPayload ??= issue.message;
            break;
          case "pollingIntervalSeconds":
            errors.pollingIntervalSeconds ??= issue.message;
            break;
        }
      }
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    try {
      if (editing)
        await update.mutateAsync({ id: editing.id, values: parsed.data });
      else await create.mutateAsync(parsed.data);
      setFormOpen(false);
      toast.success(editing ? "Log source updated" : "Log source created");
    } catch {
      setFormError(
        "Unable to save the log source. Check your permissions and try again.",
      );
    }
  }

  return (
    <>
      <ProductPageHeader
        description="Configure and monitor the sources used to ingest security events, logs, and event data governance policies."
        showSampleNotice={false}
        title="Event & Log sources"
        {...(activeTab === "event-sources"
          ? {
              primaryAction: "Register event source",
              onPrimaryAction: () => setRegisterEventSourceOpen(true),
            }
          : activeTab === "log-sources"
            ? {
                primaryAction: "Configure log source",
                onPrimaryAction: () => openCreate(),
              }
            : {})}
      />
      <MetricStrip
        ariaLabel={
          activeTab === "events"
            ? "Security event metrics"
            : activeTab === "event-sources"
              ? "Event source metrics"
              : activeTab === "governance"
                ? "Data governance & retention metrics"
                : "Log source metrics"
        }
        metrics={
          activeTab === "events"
            ? [
              {
                label: "Total events",
                value: eventMetrics.data
                  ? String(eventMetrics.data.totalEvents)
                  : "—",
                detail: "Across all active sources",
                tone: "brand",
                loading: eventMetrics.isPending,
              },
              {
                label: "Resolved & mapped",
                value: eventMetrics.data
                  ? String(eventMetrics.data.totalMapped)
                  : "—",
                detail: "Entities identified",
                tone: "neutral",
                loading: eventMetrics.isPending,
              },
              {
                label: "24h Volume",
                value: eventMetrics.data
                  ? String(eventMetrics.data.eventsLast24Hours)
                  : "—",
                detail: "Ingested in last 24h",
                tone: "neutral",
                loading: eventMetrics.isPending,
              },
              {
                label: "Unmapped / Review",
                value: eventMetrics.data
                  ? String(eventMetrics.data.totalUnmapped)
                  : "—",
                detail: "Awaiting entity mapping",
                tone:
                  (eventMetrics.data?.totalUnmapped ?? 0) > 0
                    ? "warning"
                    : "neutral",
                loading: eventMetrics.isPending,
              },
            ]
            : activeTab === "event-sources"
              ? [
                {
                  label: "Total sources",
                  value: eventSourcesOverview.data
                    ? String(totalEventSources)
                    : "—",
                  detail: "Normalized event sources",
                  tone: "brand",
                  loading: eventSourcesOverview.isPending,
                },
                {
                  label: "Active sources",
                  value: eventSourcesOverview.data
                    ? String(activeEventSources)
                    : "—",
                  detail: "Ready to ingest events",
                  tone: "neutral",
                  loading: eventSourcesOverview.isPending,
                },
                {
                  label: "Source types",
                  value: eventSourcesOverview.data
                    ? String(uniqueSourceTypes)
                    : "—",
                  detail: "Distinct ingestion types",
                  tone: "neutral",
                  loading: eventSourcesOverview.isPending,
                },
                {
                  label: "Event families",
                  value: eventSourcesOverview.data
                    ? String(uniqueFamilies)
                    : "—",
                  detail: "Coverage across domains",
                  tone: "neutral",
                  loading: eventSourcesOverview.isPending,
                },
              ]
              : activeTab === "governance"
                ? [
                  {
                    label: "Total policies",
                    value: governanceSummary.data
                      ? String(governanceSummary.data.totalPolicies)
                      : "—",
                    detail: governanceSummary.data
                      ? `${governanceSummary.data.activePolicies} active policies`
                      : "Governance & retention",
                    tone: "brand",
                    loading: governanceSummary.isPending,
                  },
                  {
                    label: "Retention (Min / Max)",
                    value: governanceSummary.data
                      ? `${governanceSummary.data.minRetentionDays} - ${governanceSummary.data.maxRetentionDays} days`
                      : "—",
                    detail: governanceSummary.data
                      ? `Average: ${governanceSummary.data.avgRetentionDays} days`
                      : "Configured retention range",
                    tone: "neutral",
                    loading: governanceSummary.isPending,
                  },
                  {
                    label: "Cold archival rules",
                    value: governanceSummary.data
                      ? String(governanceSummary.data.policiesWithArchival)
                      : "—",
                    detail: "Policies with cold storage",
                    tone: "warning",
                    loading: governanceSummary.isPending,
                  },
                  {
                    label: "Automated purge",
                    value: governanceSummary.data
                      ? String(governanceSummary.data.policiesWithAutomatedDeletion)
                      : "—",
                    detail: "Automated disposal enabled",
                    tone: "danger",
                    loading: governanceSummary.isPending,
                  },
                ]
                : [
                  {
                    label: "Total sources",
                    value: metrics.data ? String(metrics.data.total) : "—",
                    detail: "Across all log sources",
                    tone: "brand",
                    loading: metrics.isPending,
                  },
                  {
                    label: "Active",
                    value: metrics.data ? String(metrics.data.active) : "—",
                    detail: "Across all log sources",
                    tone: "neutral",
                    loading: metrics.isPending,
                  },
                  {
                    label: "Receiving logs",
                    value: metrics.data ? String(metrics.data.receiving) : "—",
                    detail: "Received at least one event",
                    tone: "neutral",
                    loading: metrics.isPending,
                  },
                  {
                    label: "Errors",
                    value: metrics.data ? String(metrics.data.errors) : "—",
                    detail: "Across all log sources",
                    tone: "danger",
                    loading: metrics.isPending,
                  },
                ]
        }
      />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="border-border bg-surface inline-flex items-center gap-1 rounded-xl border p-1 shadow-xs">
          <button
            type="button"
            onClick={() => setActiveTab("events")}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-all",
              activeTab === "events"
                ? "bg-brand text-brand-contrast font-semibold shadow-xs"
                : "text-muted hover:bg-neutral-soft hover:text-foreground",
            )}
          >
            <Layers
              aria-hidden="true"
              className={cn(
                "size-4",
                activeTab === "events"
                  ? "text-brand-contrast"
                  : "text-muted",
              )}
              strokeWidth={2}
            />
            <span>Security events</span>
            {eventMetrics.data ? (
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-bold transition-colors",
                  activeTab === "events"
                    ? "bg-white/20 text-brand-contrast"
                    : "border-border bg-neutral-soft text-muted border",
                )}
              >
                {eventMetrics.data.totalEvents}
              </span>
            ) : null}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("event-sources")}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-all",
              activeTab === "event-sources"
                ? "bg-brand text-brand-contrast font-semibold shadow-xs"
                : "text-muted hover:bg-neutral-soft hover:text-foreground",
            )}
          >
            <Radio
              aria-hidden="true"
              className={cn(
                "size-4",
                activeTab === "event-sources"
                  ? "text-brand-contrast"
                  : "text-muted",
              )}
              strokeWidth={2}
            />
            <span>Normalized event sources</span>
            {eventSourcesOverview.data ? (
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-bold transition-colors",
                  activeTab === "event-sources"
                    ? "bg-white/20 text-brand-contrast"
                    : "border-border bg-neutral-soft text-muted border",
                )}
              >
                {totalEventSources}
              </span>
            ) : null}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("log-sources")}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-all",
              activeTab === "log-sources"
                ? "bg-brand text-brand-contrast font-semibold shadow-xs"
                : "text-muted hover:bg-neutral-soft hover:text-foreground",
            )}
          >
            <Database
              aria-hidden="true"
              className={cn(
                "size-4",
                activeTab === "log-sources"
                  ? "text-brand-contrast"
                  : "text-muted",
              )}
              strokeWidth={2}
            />
            <span>Legacy log sources</span>
            {sources.data ? (
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-bold transition-colors",
                  activeTab === "log-sources"
                    ? "bg-white/20 text-brand-contrast"
                    : "border-border bg-neutral-soft text-muted border",
                )}
              >
                {sources.data.pagination.total}
              </span>
            ) : null}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("governance")}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-all",
              activeTab === "governance"
                ? "bg-brand text-brand-contrast font-semibold shadow-xs"
                : "text-muted hover:bg-neutral-soft hover:text-foreground",
            )}
          >
            <Shield
              aria-hidden="true"
              className={cn(
                "size-4",
                activeTab === "governance"
                  ? "text-brand-contrast"
                  : "text-muted",
              )}
              strokeWidth={2}
            />
            <span>Data governance & Retention</span>
            {governanceSummary.data ? (
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-bold transition-colors",
                  activeTab === "governance"
                    ? "bg-white/20 text-brand-contrast"
                    : "border-border bg-neutral-soft text-muted border",
                )}
              >
                {governanceSummary.data.totalPolicies}
              </span>
            ) : null}
          </button>
        </div>
      </div>

      {activeTab === "events" ? (
        <NormalizedEventsList />
      ) : activeTab === "event-sources" ? (
        <EventSourcesList
          onRegisterClick={() => setRegisterEventSourceOpen(true)}
        />
      ) : activeTab === "governance" ? (
        <EventGovernancePoliciesList />
      ) : (
        <ProductPanel
          description={
            sources.data
              ? `${sources.data.pagination.total} log sources found`
              : "Backend-managed security log sources"
          }
          title="Log source list"
        >
          <form
            className="border-border flex gap-2 border-b p-4"
            onSubmit={(event) => {
              event.preventDefault();
              setPage(1);
              setQuery(draft.trim());
            }}
          >
            <label className="relative block w-full max-w-md">
              <span className="sr-only">Search log sources</span>
              <Search
                aria-hidden="true"
                className="text-muted absolute top-1/2 left-3 size-4 -translate-y-1/2"
                strokeWidth={1.8}
              />
              <Input
                className="bg-background min-h-10 pl-9"
                maxLength={100}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Search by name"
                value={draft}
              />
            </label>
            <Button className="min-h-10" type="submit">
              Search
            </Button>
          </form>
          <div className="p-4">
            {sources.isPending ? (
              <TableSkeleton
                headers={[
                  "Log source",
                  "Format",
                  "Status",
                  "Asset",
                  "Last received",
                  "Actions",
                ]}
                label="Loading log sources"
                rows={skeletonRows(metrics.data?.total)}
              />
            ) : sources.isError ? (
              <Alert>
                Unable to load log sources. Check your session and backend
                connection.
              </Alert>
            ) : sources.data?.items.length === 0 ? (
              <p className="text-muted py-10 text-center">
                No log sources found.
              </p>
            ) : sources.data ? (
              <DataTable
                columns={columns}
                rows={sources.data.items}
                getRowKey={(item) => item.id}
              />
            ) : null}
          </div>
          {sources.data ? (
            <div className="border-border border-t p-4">
              <Pagination
                page={sources.data.pagination.page}
                pageCount={sources.data.pagination.totalPages}
                onPageChange={setPage}
              />
            </div>
          ) : null}
        </ProductPanel>
      )}
      <LogSourceDetailDialog
        onClose={() => setViewing(null)}
        source={viewing}
      />
      <DeleteLogSourceDialog
        onClose={() => setDeleting(null)}
        source={deleting}
      />
      {formOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
          <form
            className="border-border bg-surface w-full max-w-xl space-y-4 rounded-xl border p-6"
            onSubmit={save}
          >
            <h2 className="text-xl font-semibold">
              {editing ? "Edit log source" : "Configure log source"}
            </h2>
            {formError ? <Alert>{formError}</Alert> : null}
            <FormField
              id="log-source-name"
              label="Name"
              error={fieldErrors.name}
            >
              <Input
                aria-describedby={
                  fieldErrors.name ? "log-source-name-error" : undefined
                }
                aria-invalid={Boolean(fieldErrors.name)}
                id="log-source-name"
                value={form.name}
                onChange={(event) => {
                  clearFieldError("name");
                  setForm({ ...form, name: event.target.value });
                }}
              />
            </FormField>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                id="log-source-type"
                label="Source type"
                error={fieldErrors.sourceType}
              >
                {editing ? (
                  <>
                    <Input
                      aria-describedby="source-type-edit-help"
                      aria-invalid={Boolean(fieldErrors.sourceType)}
                      className="capitalize"
                      id="log-source-type"
                      readOnly
                      value={form.sourceType}
                    />
                    <span
                      className="text-muted mt-1 block text-xs font-normal"
                      id="source-type-edit-help"
                    >
                      Source type cannot be changed after the log source is
                      created.
                    </span>
                  </>
                ) : (
                  <Select
                    aria-describedby={
                      fieldErrors.sourceType
                        ? "log-source-type-error"
                        : undefined
                    }
                    aria-invalid={Boolean(fieldErrors.sourceType)}
                    id="log-source-type"
                    value={form.sourceType}
                    onChange={(event) => {
                      clearFieldError("sourceType");
                      setForm({
                        ...form,
                        sourceType: event.target
                          .value as LogSourceForm["sourceType"],
                      });
                    }}
                  >
                    {sourceTypes.map((value) => (
                      <option key={value}>{value}</option>
                    ))}
                  </Select>
                )}
              </FormField>
              <FormField
                id="log-source-status"
                label="Status"
                error={fieldErrors.status}
              >
                <Select
                  aria-describedby={
                    fieldErrors.status ? "log-source-status-error" : undefined
                  }
                  aria-invalid={Boolean(fieldErrors.status)}
                  id="log-source-status"
                  value={form.status}
                  onChange={(event) => {
                    clearFieldError("status");
                    setForm({
                      ...form,
                      status: event.target.value as LogSourceForm["status"],
                    });
                  }}
                >
                  {sourceStatuses.map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </Select>
              </FormField>
              <FormField
                id="log-source-format"
                label="Format"
                error={fieldErrors.format}
              >
                <Select
                  aria-describedby={
                    fieldErrors.format ? "log-source-format-error" : undefined
                  }
                  aria-invalid={Boolean(fieldErrors.format)}
                  id="log-source-format"
                  value={form.format}
                  onChange={(event) => {
                    clearFieldError("format");
                    setForm({
                      ...form,
                      format: event.target.value as LogSourceForm["format"],
                    });
                  }}
                >
                  {logFormats.map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </Select>
              </FormField>
              <FormField
                id="log-source-timezone"
                label="Timezone"
                error={fieldErrors.timezone}
              >
                <Input
                  aria-describedby={
                    fieldErrors.timezone
                      ? "log-source-timezone-error"
                      : undefined
                  }
                  aria-invalid={Boolean(fieldErrors.timezone)}
                  id="log-source-timezone"
                  value={form.timezone}
                  onChange={(event) => {
                    clearFieldError("timezone");
                    setForm({ ...form, timezone: event.target.value });
                  }}
                />
              </FormField>
              <FormField
                id="log-source-polling-interval"
                label="Polling interval (seconds)"
                error={fieldErrors.pollingIntervalSeconds}
              >
                <Input
                  aria-describedby={
                    fieldErrors.pollingIntervalSeconds
                      ? "log-source-polling-interval-error"
                      : undefined
                  }
                  aria-invalid={Boolean(fieldErrors.pollingIntervalSeconds)}
                  id="log-source-polling-interval"
                  type="number"
                  min={1}
                  max={86400}
                  value={form.pollingIntervalSeconds ?? ""}
                  onChange={(event) => {
                    clearFieldError("pollingIntervalSeconds");
                    setForm({
                      ...form,
                      pollingIntervalSeconds: event.target.value
                        ? Number(event.target.value)
                        : undefined,
                    });
                  }}
                />
              </FormField>
              <label className="flex items-center gap-2 pt-6 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={form.collectRawPayload}
                  onChange={(e) =>
                    setForm({ ...form, collectRawPayload: e.target.checked })
                  }
                />
                Collect raw payload
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setFormOpen(false)}
              >
                Cancel
              </Button>
              <Button
                disabled={create.isPending || update.isPending}
                type="submit"
              >
                {create.isPending || update.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        </div>
      ) : null}
      {registerEventSourceOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
          <div className="bg-surface border-border max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border p-6 shadow-xl">
            <RegisterEventSourceForm
              onCancel={() => setRegisterEventSourceOpen(false)}
              onSuccess={() => {
                setRegisterEventSourceOpen(false);
              }}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}

function skeletonRows(total: number | undefined): number {
  return total === undefined ? 4 : Math.max(1, Math.min(total, 20));
}
