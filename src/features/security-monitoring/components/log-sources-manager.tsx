"use client";

import { Ellipsis, Eye, Pencil, Search, Trash2 } from "lucide-react";
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
import {
  useCreateLogSource,
  useLogSources,
  useUpdateLogSource,
} from "../hooks/use-log-sources";
import {
  logFormats,
  logSourceFormSchema,
  sourceStatuses,
  sourceTypes,
  type LogSource,
  type LogSourceForm,
} from "../schemas/log-source-schema";
import { DeleteLogSourceDialog } from "./delete-log-source-dialog";
import { LogSourceDetailDialog } from "./log-source-detail-dialog";

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
  const [page, setPage] = useState(1);
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<LogSource | null>(null);
  const [viewing, setViewing] = useState<LogSource | null>(null);
  const [deleting, setDeleting] = useState<LogSource | null>(null);
  const [form, setForm] = useState<LogSourceForm>(defaults);
  const [formOpen, setFormOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<LogSourceFormErrors>({});
  const sources = useLogSources({
    page,
    limit: 20,
    ...(query ? { q: query } : {}),
  });
  const create = useCreateLogSource();
  const update = useUpdateLogSource();
  const items = sources.data?.items ?? [];
  const activeCount = items.filter((item) => item.status === "active").length;
  const errorCount = items.filter((item) => item.status === "error").length;
  const receivingCount = items.filter((item) => item.lastReceivedAt).length;

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
        description="Configure the sources used to collect security logs and events."
        onPrimaryAction={openCreate}
        primaryAction="Configure log source"
        showSampleNotice={false}
        title="Log sources"
      />
      <MetricStrip
        ariaLabel="Log source metrics"
        metrics={[
          {
            label: "Total sources",
            value: sources.data ? String(sources.data.pagination.total) : "—",
            detail: "Returned by the backend",
            tone: "brand",
          },
          {
            label: "Active",
            value: sources.data ? String(activeCount) : "—",
            detail: "On this page",
            tone: "neutral",
          },
          {
            label: "Receiving logs",
            value: sources.data ? String(receivingCount) : "—",
            detail: "Received at least one event on this page",
            tone: "neutral",
          },
          {
            label: "Errors",
            value: sources.data ? String(errorCount) : "—",
            detail: "On this page",
            tone: "danger",
          },
        ]}
      />
      <ProductPanel
        description={
          sources.data
            ? `${sources.data.pagination.total} log sources found`
            : "Loading backend data"
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
            <p className="text-muted py-10 text-center">
              Loading log sources...
            </p>
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
    </>
  );
}
