"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/data-display/data-table";
import { Pagination } from "@/components/data-display/pagination";
import {
  ProductPageHeader,
  ProductPanel,
  StatusBadge,
} from "@/components/data-display/static-product";
import { EmptyState } from "@/components/feedback/empty-state";
import { useToast } from "@/components/feedback/toast";
import { FormField } from "@/components/forms/form-field";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useSessionUser } from "@/features/auth";
import {
  useMyIncident,
  useMyIncidents,
  useReportIncident,
} from "../hooks/use-incidents";
import {
  reportIncidentFormSchema,
  type Incident,
  type ReportIncidentForm,
} from "../schemas/report-incident-schema";

const defaults: ReportIncidentForm = {
  title: "",
  description: "",
  category: "other",
  occurredAt: "",
};
const categoryLabels: Record<ReportIncidentForm["category"], string> = {
  phishing: "Phishing",
  malware: "Malware",
  account_compromise: "Account compromise",
  data_exposure: "Data exposure",
  network: "Network",
  physical: "Physical security",
  other: "Other",
};
const formatDate = (value: string) =>
  new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
export function IncidentReportingManager() {
  const session = useSessionUser();
  const allowed =
    session.data?.permissions.includes("incidents.report") ?? false;
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string>();
  const [message, setMessage] = useState<string>();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const detailDialogRef = useRef<HTMLDialogElement>(null);
  const list = useMyIncidents(page, allowed);
  const detail = useMyIncident(selectedId);
  const mutation = useReportIncident();
  const toast = useToast();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ReportIncidentForm>({
    resolver: zodResolver(reportIncidentFormSchema),
    defaultValues: defaults,
  });
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);
  useEffect(() => {
    const dialog = detailDialogRef.current;
    if (!dialog) return;
    if (selectedId && !dialog.open) dialog.showModal();
    if (!selectedId && dialog.open) dialog.close();
  }, [selectedId]);
  const close = () => {
    setOpen(false);
    setMessage(undefined);
    reset(defaults);
  };
  const submit = async (values: ReportIncidentForm) => {
    try {
      const created = await mutation.mutateAsync(values);
      close();
      setPage(1);
      toast.success(
        "Incident reported",
        `${created.incidentCode} has been sent to the security team.`,
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to report the incident.",
      );
    }
  };
  const columns: readonly DataTableColumn<Incident>[] = [
    {
      key: "incident",
      header: "Incident",
      cell: (item) => (
        <span>
          <strong className="block">{item.title}</strong>
          <span className="text-muted text-xs">{item.incidentCode}</span>
        </span>
      ),
    },
    {
      key: "category",
      header: "Category",
      cell: (item) =>
        item.category
          ? (categoryLabels[item.category as ReportIncidentForm["category"]] ??
            item.category)
          : "—",
    },
    {
      key: "status",
      header: "Status",
      cell: (item) => <StatusBadge tone="info">{item.status}</StatusBadge>,
    },
    {
      key: "reported",
      header: "Reported",
      cell: (item) => (
        <span className="whitespace-nowrap">{formatDate(item.createdAt)}</span>
      ),
    },
    {
      key: "action",
      header: "Action",
      cell: (item) => (
        <Button variant="secondary" onClick={() => setSelectedId(item.id)}>
          <Eye aria-hidden="true" className="size-4" strokeWidth={1.8} />
          View details
        </Button>
      ),
    },
  ];
  if (session.isPending)
    return (
      <div
        aria-label="Loading incident reporting"
        className="bg-neutral-soft h-56 animate-pulse rounded-xl"
      />
    );
  if (!allowed)
    return <Alert>You do not have permission to report incidents.</Alert>;
  return (
    <>
      <ProductPageHeader
        title="Report security incidents"
        description="Report suspicious activity promptly so the security team can investigate and respond."
        showSampleNotice={false}
        additionalActions={
          <Button onClick={() => setOpen(true)}>
            <Plus aria-hidden="true" className="size-4" />
            Report new incident
          </Button>
        }
      />
      <ProductPanel
        title="My incident reports"
        description={
          list.data
            ? `${list.data.pagination.total} reports submitted`
            : "Incidents you have reported"
        }
      >
        <div className="p-4">
          {list.isPending ? (
            <div
              aria-label="Loading incident reports"
              className="bg-neutral-soft h-56 animate-pulse rounded-xl"
            />
          ) : list.isError ? (
            <Alert>Unable to load your incident reports.</Alert>
          ) : list.data?.items.length ? (
            <DataTable
              columns={columns}
              rows={list.data.items}
              getRowKey={(item) => item.id}
            />
          ) : (
            <EmptyState
              title="No incidents reported"
              description="Use Report new incident when you notice suspicious activity or a possible security event."
            />
          )}
        </div>
        {list.data ? (
          <div className="border-border border-t p-4">
            <Pagination
              page={page}
              pageCount={list.data.pagination.totalPages}
              onPageChange={setPage}
            />
          </div>
        ) : null}
      </ProductPanel>
      <Dialog
        dialogRef={dialogRef}
        title="Report new incident"
        className="max-h-[calc(100dvh-2rem)] w-[min(40rem,calc(100%-2rem))] overflow-y-auto"
        onClose={close}
      >
        <form className="space-y-5" noValidate onSubmit={handleSubmit(submit)}>
          {message ? (
            <Alert className="border-danger/25 bg-danger-soft text-danger">
              {message}
            </Alert>
          ) : null}
          <FormField
            id="incident-title"
            label="What happened?"
            error={errors.title?.message}
          >
            <Input
              id="incident-title"
              autoFocus
              maxLength={255}
              aria-invalid={Boolean(errors.title)}
              aria-describedby={
                errors.title ? "incident-title-error" : undefined
              }
              placeholder="Example: Suspicious email requesting my password"
              {...register("title")}
            />
          </FormField>
          <FormField
            id="incident-category"
            label="Incident category"
            error={errors.category?.message}
          >
            <Select id="incident-category" {...register("category")}>
              {Object.entries(categoryLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField
            id="occurred-at"
            label="When did it happen? (optional)"
            error={errors.occurredAt?.message}
          >
            <Input
              id="occurred-at"
              type="datetime-local"
              {...register("occurredAt")}
            />
            <p className="text-muted text-xs">
              Leave blank if you are unsure. Detection time is recorded
              automatically.
            </p>
          </FormField>
          <FormField
            id="incident-description"
            label="Description"
            error={errors.description?.message}
          >
            <Textarea
              id="incident-description"
              className="min-h-36"
              maxLength={10000}
              aria-invalid={Boolean(errors.description)}
              aria-describedby={
                errors.description ? "incident-description-error" : undefined
              }
              placeholder="Describe what you observed, affected account or device, and any action already taken. Do not include passwords or secret keys."
              {...register("description")}
            />
          </FormField>
          <Alert>
            Submitting creates a report for investigation. Severity will be
            classified by the security team.
          </Alert>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={close}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Submitting…" : "Submit report"}
            </Button>
          </div>
        </form>
      </Dialog>
      <Dialog
        dialogRef={detailDialogRef}
        title="Incident report details"
        className="max-h-[calc(100dvh-2rem)] w-[min(42rem,calc(100%-2rem))] overflow-y-auto"
        onClose={() => setSelectedId(undefined)}
      >
        {detail.isPending ? (
          <div
            aria-label="Loading incident details"
            className="bg-neutral-soft h-64 animate-pulse rounded-xl"
          />
        ) : detail.isError ? (
          <div className="space-y-4">
            <Alert>Unable to load this incident report.</Alert>
            <div className="flex justify-end">
              <Button
                variant="secondary"
                onClick={() => setSelectedId(undefined)}
              >
                Close
              </Button>
            </div>
          </div>
        ) : detail.data ? (
          <div className="space-y-5">
            <div className="border-border flex flex-wrap items-start justify-between gap-3 border-b pb-4">
              <div className="min-w-0">
                <p className="text-muted text-xs font-medium tracking-wide uppercase">
                  {detail.data.incidentCode}
                </p>
                <p className="mt-1 text-base font-semibold break-words">
                  {detail.data.title}
                </p>
              </div>
              <StatusBadge tone="info">{detail.data.status}</StatusBadge>
            </div>
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-muted text-sm">Category</dt>
                <dd className="mt-1 font-medium">
                  {detail.data.category
                    ? (categoryLabels[
                        detail.data.category as ReportIncidentForm["category"]
                      ] ?? detail.data.category)
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-muted text-sm">Severity</dt>
                <dd className="mt-1 font-medium capitalize">
                  {detail.data.severity}
                </dd>
              </div>
              <div>
                <dt className="text-muted text-sm">Occurred</dt>
                <dd className="mt-1 font-medium">
                  {detail.data.occurredAt
                    ? formatDate(detail.data.occurredAt)
                    : "Not specified"}
                </dd>
              </div>
              <div>
                <dt className="text-muted text-sm">Reported</dt>
                <dd className="mt-1 font-medium">
                  {formatDate(detail.data.createdAt)}
                </dd>
              </div>
              <div>
                <dt className="text-muted text-sm">Detected</dt>
                <dd className="mt-1 font-medium">
                  {formatDate(detail.data.detectedAt)}
                </dd>
              </div>
            </dl>
            <div>
              <h3 className="text-sm font-semibold">Description</h3>
              <p className="text-muted mt-2 leading-6 break-words whitespace-pre-wrap">
                {detail.data.description ?? "No description available."}
              </p>
            </div>
            <div className="border-border flex justify-end border-t pt-4">
              <Button
                variant="secondary"
                onClick={() => setSelectedId(undefined)}
              >
                Close
              </Button>
            </div>
          </div>
        ) : null}
      </Dialog>
    </>
  );
}
