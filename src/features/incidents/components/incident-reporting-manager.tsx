"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Ellipsis,
  Activity,
  Eye,
  Plus,
  RotateCcw,
  Search,
  ShieldAlert,
  UserPlus,
} from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useForm, useWatch } from "react-hook-form";
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
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useSessionUser } from "@/features/auth";
import {
  useClassifyIncidentSeverity,
  useAssignIncidentHandler,
  useIncidentAssignmentOptions,
  useIncidentClassificationQueue,
  useUpdateIncidentHandlingProgress,
  useMyIncident,
  useMyIncidents,
  useReportIncident,
} from "../hooks/use-incidents";
import {
  classifyIncidentFormSchema,
  assignIncidentFormSchema,
  updateIncidentProgressFormSchema,
  reportIncidentFormSchema,
  type ClassifyIncidentForm,
  type AssignIncidentForm,
  type UpdateIncidentProgressForm,
  type Incident,
  type IncidentSeverity,
  type ReportIncidentForm,
} from "../schemas/report-incident-schema";

const defaults: ReportIncidentForm = {
  title: "",
  description: "",
  category: "other",
  occurredAt: "",
};
const classificationDefaults: ClassifyIncidentForm = {
  severity: "medium",
  rationale: "",
};
const assignmentDefaults: AssignIncidentForm = { assigneeUserId: "", note: "" };
const progressDefaults: UpdateIncidentProgressForm = {
  status: "in_progress",
  note: "",
};
const progressOptions: Record<
  string,
  readonly UpdateIncidentProgressForm["status"][]
> = {
  assigned: ["in_progress", "escalated"],
  in_progress: ["escalated", "resolved"],
  escalated: ["in_progress", "resolved"],
  resolved: ["closed"],
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
const severityTone = (severity: string) => {
  if (severity === "critical") return "danger" as const;
  if (severity === "high") return "warning" as const;
  if (severity === "low") return "success" as const;
  return "info" as const;
};
const statusPresentation: Record<
  string,
  { label: string; tone: "neutral" | "info" | "warning" | "danger" | "success" }
> = {
  reported: { label: "Reported", tone: "neutral" },
  assigned: { label: "Assigned", tone: "info" },
  in_progress: { label: "In progress", tone: "warning" },
  escalated: { label: "Escalated", tone: "danger" },
  resolved: { label: "Resolved", tone: "success" },
  closed: { label: "Closed", tone: "neutral" },
};
const incidentStatus = (status: string) =>
  statusPresentation[status] ?? {
    label: status.replaceAll("_", " "),
    tone: "neutral" as const,
  };
export function IncidentReportingManager() {
  const session = useSessionUser();
  const allowed =
    session.data?.permissions.includes("incidents.report") ?? false;
  const canClassify =
    session.data?.permissions.includes("incidents.classify") ?? false;
  const canAssign =
    session.data?.permissions.includes("incidents.assign") ?? false;
  const canUpdateProgress =
    session.data?.permissions.includes("incidents.update-progress") ?? false;
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [classificationFilters, setClassificationFilters] = useState({
    search: "",
    severity: "",
    status: "",
    classification: "",
  });
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string>();
  const [classificationTarget, setClassificationTarget] = useState<Incident>();
  const [assignmentTarget, setAssignmentTarget] = useState<Incident>();
  const [progressTarget, setProgressTarget] = useState<Incident>();
  const [handlerSearch, setHandlerSearch] = useState("");
  const [message, setMessage] = useState<string>();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const detailDialogRef = useRef<HTMLDialogElement>(null);
  const classificationDialogRef = useRef<HTMLDialogElement>(null);
  const assignmentDialogRef = useRef<HTMLDialogElement>(null);
  const progressDialogRef = useRef<HTMLDialogElement>(null);
  const list = useMyIncidents(page, allowed && !canClassify);
  const classificationQueue = useIncidentClassificationQueue(
    page,
    classificationFilters,
    canClassify,
  );
  const displayedList = canClassify ? classificationQueue : list;
  const detail = useMyIncident(selectedId);
  const mutation = useReportIncident();
  const classificationMutation = useClassifyIncidentSeverity();
  const assignmentOptions = useIncidentAssignmentOptions(canAssign);
  const assignmentMutation = useAssignIncidentHandler();
  const progressMutation = useUpdateIncidentHandlingProgress();
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
  const classificationForm = useForm<ClassifyIncidentForm>({
    resolver: zodResolver(classifyIncidentFormSchema),
    defaultValues: classificationDefaults,
  });
  const assignmentForm = useForm<AssignIncidentForm>({
    resolver: zodResolver(assignIncidentFormSchema),
    defaultValues: assignmentDefaults,
  });
  const progressForm = useForm<UpdateIncidentProgressForm>({
    resolver: zodResolver(updateIncidentProgressFormSchema),
    defaultValues: progressDefaults,
  });
  const selectedHandlerId = useWatch({
    control: assignmentForm.control,
    name: "assigneeUserId",
  });
  const filteredHandlers =
    assignmentOptions.data?.users.filter((user) => {
      const search = handlerSearch.trim().toLocaleLowerCase("vi");
      return (
        !search ||
        user.name.toLocaleLowerCase("vi").includes(search) ||
        user.email.toLocaleLowerCase("vi").includes(search)
      );
    }) ?? [];
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
  useEffect(() => {
    const dialog = classificationDialogRef.current;
    if (!dialog) return;
    if (classificationTarget && !dialog.open) dialog.showModal();
    if (!classificationTarget && dialog.open) dialog.close();
  }, [classificationTarget]);
  useEffect(() => {
    const dialog = assignmentDialogRef.current;
    if (!dialog) return;
    if (assignmentTarget && !dialog.open) dialog.showModal();
    if (!assignmentTarget && dialog.open) dialog.close();
  }, [assignmentTarget]);
  useEffect(() => {
    const dialog = progressDialogRef.current;
    if (!dialog) return;
    if (progressTarget && !dialog.open) dialog.showModal();
    if (!progressTarget && dialog.open) dialog.close();
  }, [progressTarget]);
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
  const openClassification = (incident: Incident) => {
    classificationForm.reset({
      severity: incident.severity as IncidentSeverity,
      rationale: "",
    });
    classificationMutation.reset();
    setClassificationTarget(incident);
  };
  const closeClassification = () => {
    setClassificationTarget(undefined);
    classificationForm.reset(classificationDefaults);
    classificationMutation.reset();
  };
  const submitClassification = async (values: ClassifyIncidentForm) => {
    if (!classificationTarget) return;
    try {
      const updated = await classificationMutation.mutateAsync({
        id: classificationTarget.id,
        values,
      });
      closeClassification();
      toast.success(
        "Severity classified",
        `${updated.incidentCode} is now ${updated.severity}.`,
      );
    } catch {
      // The persistent API error is rendered inside the dialog.
    }
  };
  const openAssignment = (incident: Incident) => {
    setHandlerSearch("");
    assignmentForm.reset({
      assigneeUserId: incident.currentAssignment?.assignee.id ?? "",
      note: "",
    });
    assignmentMutation.reset();
    setAssignmentTarget(incident);
  };
  const closeAssignment = () => {
    setAssignmentTarget(undefined);
    assignmentForm.reset(assignmentDefaults);
    assignmentMutation.reset();
    setHandlerSearch("");
  };
  const submitAssignment = async (values: AssignIncidentForm) => {
    if (!assignmentTarget) return;
    try {
      const updated = await assignmentMutation.mutateAsync({
        id: assignmentTarget.id,
        values,
      });
      closeAssignment();
      toast.success(
        "Handler assigned",
        `${updated.incidentCode} is assigned to ${updated.currentAssignment?.assignee.name ?? "the selected handler"}.`,
      );
    } catch {
      // The persistent API error is rendered inside the dialog.
    }
  };
  const openProgress = (incident: Incident) => {
    const nextStatus = progressOptions[incident.status]?.[0];
    if (!nextStatus) return;
    progressForm.reset({ status: nextStatus, note: "" });
    progressMutation.reset();
    setProgressTarget(incident);
  };
  const closeProgress = () => {
    setProgressTarget(undefined);
    progressForm.reset(progressDefaults);
    progressMutation.reset();
  };
  const submitProgress = async (values: UpdateIncidentProgressForm) => {
    if (!progressTarget) return;
    try {
      const updated = await progressMutation.mutateAsync({
        id: progressTarget.id,
        values,
      });
      closeProgress();
      toast.success(
        "Progress updated",
        `${updated.incidentCode} is now ${incidentStatus(updated.status).label}.`,
      );
    } catch {
      // Persistent error is rendered in the dialog.
    }
  };
  const submitFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
    setClassificationFilters((current) => ({
      ...current,
      search: searchInput.trim(),
    }));
  };
  const resetFilters = () => {
    setSearchInput("");
    setPage(1);
    setClassificationFilters({
      search: "",
      severity: "",
      status: "",
      classification: "",
    });
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
      key: "severity",
      header: "Severity",
      cell: (item) =>
        canClassify && !item.classified ? (
          <StatusBadge tone="neutral">Unclassified</StatusBadge>
        ) : (
          <StatusBadge tone={severityTone(item.severity)}>
            <span className="capitalize">{item.severity}</span>
          </StatusBadge>
        ),
    },
    {
      key: "status",
      header: "Status",
      cell: (item) => {
        const presentation = incidentStatus(item.status);
        return (
          <StatusBadge tone={presentation.tone}>
            {presentation.label}
          </StatusBadge>
        );
      },
    },
    ...(canAssign
      ? ([
          {
            key: "handler",
            header: "Handler",
            cell: (item: Incident) =>
              item.currentAssignment?.assignee.name ?? "Unassigned",
          },
        ] satisfies readonly DataTableColumn<Incident>[])
      : []),
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
      cell: (item) =>
        canClassify ? (
          <DropdownMenu
            className="w-fit"
            label={
              <span className="grid size-6 place-items-center">
                <span className="sr-only">Actions for {item.incidentCode}</span>
                <Ellipsis
                  aria-hidden="true"
                  className="size-5"
                  strokeWidth={1.8}
                />
              </span>
            }
          >
            <button
              className="hover:bg-neutral-soft focus-visible:outline-brand flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-left text-sm transition-colors focus-visible:outline-2 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={item.status === "closed"}
              onClick={() => openClassification(item)}
              type="button"
            >
              <ShieldAlert
                aria-hidden="true"
                className="size-4"
                strokeWidth={1.8}
              />
              {item.classified ? "Reclassify severity" : "Classify severity"}
            </button>
            {canAssign ? (
              <button
                className="hover:bg-neutral-soft focus-visible:outline-brand flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-left text-sm transition-colors focus-visible:outline-2 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={
                  item.status === "closed" || item.status === "resolved"
                }
                onClick={() => openAssignment(item)}
                type="button"
              >
                <UserPlus
                  aria-hidden="true"
                  className="size-4"
                  strokeWidth={1.8}
                />
                {item.currentAssignment ? "Reassign handler" : "Assign handler"}
              </button>
            ) : null}
            {canUpdateProgress && progressOptions[item.status]?.length ? (
              <button
                className="hover:bg-neutral-soft focus-visible:outline-brand flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-left text-sm transition-colors focus-visible:outline-2"
                onClick={() => openProgress(item)}
                type="button"
              >
                <Activity
                  aria-hidden="true"
                  className="size-4"
                  strokeWidth={1.8}
                />
                Update progress
              </button>
            ) : null}
          </DropdownMenu>
        ) : (
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
  if (!allowed && !canClassify)
    return (
      <Alert>You do not have permission to access incident management.</Alert>
    );
  return (
    <>
      <ProductPageHeader
        title={
          canClassify
            ? "Classify incident severity"
            : "Report security incidents"
        }
        description={
          canClassify
            ? "Review reported incidents and assign a documented severity for response prioritization."
            : "Report suspicious activity promptly so the security team can investigate and respond."
        }
        showSampleNotice={false}
        additionalActions={
          <Button onClick={() => setOpen(true)} disabled={!allowed}>
            <Plus aria-hidden="true" className="size-4" />
            Report new incident
          </Button>
        }
      />
      <ProductPanel
        title={
          canClassify ? "Incident classification queue" : "My incident reports"
        }
        description={
          displayedList.data
            ? `${displayedList.data.pagination.total} incidents found`
            : canClassify
              ? "Reported incidents awaiting review or reclassification"
              : "Incidents you have reported"
        }
      >
        {canClassify ? (
          <form
            className="border-border flex flex-col gap-3 border-b p-4 md:flex-row md:flex-wrap md:items-end xl:flex-nowrap"
            onSubmit={submitFilters}
          >
            <label className="min-w-0 flex-1 md:basis-full xl:basis-0">
              <span className="mb-1.5 block text-sm font-medium">
                Search incidents
              </span>
              <span className="relative block">
                <Search
                  aria-hidden="true"
                  className="text-muted absolute top-1/2 left-3 size-4 -translate-y-1/2"
                  strokeWidth={1.8}
                />
                <Input
                  className="pl-9"
                  value={searchInput}
                  maxLength={100}
                  placeholder="Search by incident code or title"
                  onChange={(event) => setSearchInput(event.target.value)}
                />
              </span>
            </label>
            <label className="min-w-40 flex-1 md:max-w-52">
              <span className="mb-1.5 block text-sm font-medium">Severity</span>
              <Select
                value={classificationFilters.severity}
                onChange={(event) => {
                  setPage(1);
                  setClassificationFilters((current) => ({
                    ...current,
                    severity: event.target.value,
                  }));
                }}
              >
                <option value="">All severities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </Select>
            </label>
            <label className="min-w-40 flex-1 md:max-w-52">
              <span className="mb-1.5 block text-sm font-medium">
                Classification
              </span>
              <Select
                value={classificationFilters.classification}
                onChange={(event) => {
                  setPage(1);
                  setClassificationFilters((current) => ({
                    ...current,
                    classification: event.target.value,
                  }));
                }}
              >
                <option value="">All classifications</option>
                <option value="unclassified">Unclassified</option>
                <option value="classified">Classified</option>
              </Select>
            </label>
            <label className="min-w-40 flex-1 md:max-w-52">
              <span className="mb-1.5 block text-sm font-medium">Status</span>
              <Select
                value={classificationFilters.status}
                onChange={(event) => {
                  setPage(1);
                  setClassificationFilters((current) => ({
                    ...current,
                    status: event.target.value,
                  }));
                }}
              >
                <option value="">All statuses</option>
                <option value="reported">Reported</option>
                <option value="assigned">Assigned</option>
                <option value="in_progress">In progress</option>
                <option value="escalated">Escalated</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </Select>
            </label>
            <div className="flex gap-2">
              <Button type="submit">
                <Search
                  aria-hidden="true"
                  className="size-4"
                  strokeWidth={1.8}
                />
                Search
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={resetFilters}
                disabled={
                  !searchInput &&
                  !classificationFilters.search &&
                  !classificationFilters.severity &&
                  !classificationFilters.status &&
                  !classificationFilters.classification
                }
              >
                <RotateCcw
                  aria-hidden="true"
                  className="size-4"
                  strokeWidth={1.8}
                />
                Reset
              </Button>
            </div>
          </form>
        ) : null}
        <div className="p-4">
          {displayedList.isPending ? (
            <div
              aria-label="Loading incident reports"
              className="bg-neutral-soft h-56 animate-pulse rounded-xl"
            />
          ) : displayedList.isError ? (
            <Alert>Unable to load incident reports.</Alert>
          ) : displayedList.data?.items.length ? (
            <DataTable
              columns={columns}
              rows={displayedList.data.items}
              getRowKey={(item) => item.id}
            />
          ) : (
            <EmptyState
              title={
                canClassify
                  ? "No incidents to classify"
                  : "No incidents reported"
              }
              description={
                canClassify
                  ? "New incident reports will appear here for severity classification."
                  : "Use Report new incident when you notice suspicious activity or a possible security event."
              }
            />
          )}
        </div>
        {displayedList.data ? (
          <div className="border-border border-t p-4">
            <Pagination
              page={page}
              pageCount={displayedList.data.pagination.totalPages}
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
        dialogRef={assignmentDialogRef}
        title="Assign incident handler"
        className="max-h-[calc(100dvh-2rem)] w-[min(40rem,calc(100%-2rem))] overflow-y-auto"
        onClose={closeAssignment}
      >
        {assignmentTarget ? (
          <form
            className="space-y-5"
            noValidate
            onSubmit={assignmentForm.handleSubmit(submitAssignment)}
          >
            <div className="border-border bg-neutral-soft rounded-lg border p-4">
              <p className="text-muted text-xs font-medium tracking-wide uppercase">
                {assignmentTarget.incidentCode}
              </p>
              <p className="mt-1 font-semibold break-words">
                {assignmentTarget.title}
              </p>
              {assignmentTarget.currentAssignment ? (
                <p className="text-muted mt-2 text-sm">
                  Currently assigned to{" "}
                  {assignmentTarget.currentAssignment.assignee.name} ·{" "}
                  {formatDate(assignmentTarget.currentAssignment.assignedAt)}
                </p>
              ) : (
                <p className="text-muted mt-2 text-sm">
                  No active handler assigned.
                </p>
              )}
            </div>
            {assignmentMutation.isError ? (
              <Alert className="border-danger/25 bg-danger-soft text-danger">
                {assignmentMutation.error instanceof Error
                  ? assignmentMutation.error.message
                  : "Unable to assign this incident. Review the values and try again."}
              </Alert>
            ) : null}
            {assignmentOptions.isError ? (
              <Alert>
                Unable to load eligible handlers. Try reopening this dialog.
              </Alert>
            ) : null}
            <FormField
              id="incident-handler"
              label="Handler"
              error={assignmentForm.formState.errors.assigneeUserId?.message}
            >
              <input
                type="hidden"
                {...assignmentForm.register("assigneeUserId")}
              />
              <div className="border-border overflow-hidden rounded-lg border">
                <div className="border-border relative border-b">
                  <Search
                    aria-hidden="true"
                    className="text-muted pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
                    strokeWidth={1.8}
                  />
                  <Input
                    id="incident-handler"
                    autoFocus
                    className="rounded-none border-0 pl-10 focus:ring-0"
                    disabled={
                      assignmentOptions.isPending || assignmentOptions.isError
                    }
                    onChange={(event) => setHandlerSearch(event.target.value)}
                    placeholder="Search by name or email"
                    value={handlerSearch}
                  />
                </div>
                <div
                  aria-label="Eligible incident handlers"
                  className="max-h-56 overflow-y-auto p-1.5"
                  role="listbox"
                >
                  {assignmentOptions.isPending ? (
                    <p className="text-muted px-3 py-4 text-sm">
                      Loading handlers…
                    </p>
                  ) : filteredHandlers.length ? (
                    filteredHandlers.map((user) => {
                      const selected = selectedHandlerId === user.id;
                      return (
                        <button
                          aria-selected={selected}
                          className={`focus-visible:outline-brand flex min-h-11 w-full items-center justify-between gap-3 rounded-md px-3 text-left text-sm focus-visible:outline-2 ${selected ? "bg-brand-soft text-brand" : "hover:bg-neutral-soft"}`}
                          key={user.id}
                          onClick={() =>
                            assignmentForm.setValue("assigneeUserId", user.id, {
                              shouldDirty: true,
                              shouldValidate: true,
                            })
                          }
                          role="option"
                          type="button"
                        >
                          <span className="min-w-0">
                            <span className="block font-medium break-words">
                              {user.name}
                            </span>
                            <span className="text-muted block text-xs break-all">
                              {user.email}
                            </span>
                          </span>
                          {selected ? (
                            <span className="shrink-0 text-xs font-semibold">
                              Selected
                            </span>
                          ) : null}
                        </button>
                      );
                    })
                  ) : (
                    <p className="text-muted px-3 py-4 text-sm">
                      No active security officers match this search.
                    </p>
                  )}
                </div>
              </div>
            </FormField>
            <FormField
              id="assignment-note"
              label="Assignment note"
              error={assignmentForm.formState.errors.note?.message}
            >
              <Textarea
                id="assignment-note"
                className="min-h-28"
                maxLength={2000}
                placeholder="Explain why this handler is appropriate and any immediate response expectations."
                {...assignmentForm.register("note")}
              />
              <p className="text-muted text-xs">
                The assignment, responsible officer and note are retained in
                incident history and the audit log.
              </p>
            </FormField>
            <Alert>
              Assigning a reported incident changes its workflow status to
              Assigned. Reassignment closes the previous active assignment.
            </Alert>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={closeAssignment}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  assignmentMutation.isPending ||
                  assignmentOptions.isPending ||
                  assignmentOptions.isError
                }
              >
                {assignmentMutation.isPending ? "Assigning…" : "Assign handler"}
              </Button>
            </div>
          </form>
        ) : null}
      </Dialog>
      <Dialog
        dialogRef={progressDialogRef}
        title="Update incident handling progress"
        className="max-h-[calc(100dvh-2rem)] w-[min(40rem,calc(100%-2rem))] overflow-y-auto"
        onClose={closeProgress}
      >
        {progressTarget ? (
          <form
            className="space-y-5"
            noValidate
            onSubmit={progressForm.handleSubmit(submitProgress)}
          >
            <div className="border-border bg-neutral-soft rounded-lg border p-4">
              <p className="text-muted text-xs font-medium tracking-wide uppercase">
                {progressTarget.incidentCode}
              </p>
              <p className="mt-1 font-semibold break-words">
                {progressTarget.title}
              </p>
              <p className="text-muted mt-2 text-sm">
                Current status: {incidentStatus(progressTarget.status).label}
              </p>
            </div>
            {progressMutation.isError ? (
              <Alert className="border-danger/25 bg-danger-soft text-danger">
                {progressMutation.error instanceof Error
                  ? progressMutation.error.message
                  : "Unable to update incident progress."}
              </Alert>
            ) : null}
            <FormField
              id="incident-progress-status"
              label="Next status"
              error={progressForm.formState.errors.status?.message}
            >
              <Select
                id="incident-progress-status"
                autoFocus
                {...progressForm.register("status")}
              >
                {progressOptions[progressTarget.status]?.map((status) => (
                  <option key={status} value={status}>
                    {incidentStatus(status).label}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField
              id="incident-progress-note"
              label="Progress note"
              error={progressForm.formState.errors.note?.message}
            >
              <Textarea
                id="incident-progress-note"
                className="min-h-32"
                maxLength={5000}
                placeholder="Describe actions completed, findings, impact changes, blockers and the next response step."
                {...progressForm.register("note")}
              />
              <p className="text-muted text-xs">
                This note and status transition are retained in incident history
                and the audit log.
              </p>
            </FormField>
            <Alert>
              Workflow transitions are controlled. Closed incidents cannot be
              reopened from this function.
            </Alert>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={closeProgress}>
                Cancel
              </Button>
              <Button type="submit" disabled={progressMutation.isPending}>
                {progressMutation.isPending ? "Saving…" : "Save progress"}
              </Button>
            </div>
          </form>
        ) : null}
      </Dialog>
      <Dialog
        dialogRef={classificationDialogRef}
        title="Classify incident severity"
        className="max-h-[calc(100dvh-2rem)] w-[min(40rem,calc(100%-2rem))] overflow-y-auto"
        onClose={closeClassification}
      >
        {classificationTarget ? (
          <form
            className="space-y-5"
            noValidate
            onSubmit={classificationForm.handleSubmit(submitClassification)}
          >
            <div className="border-border bg-neutral-soft rounded-lg border p-4">
              <p className="text-muted text-xs font-medium tracking-wide uppercase">
                {classificationTarget.incidentCode}
              </p>
              <p className="mt-1 font-semibold break-words">
                {classificationTarget.title}
              </p>
              <p className="text-muted mt-2 line-clamp-4 text-sm leading-6 break-words whitespace-pre-wrap">
                {classificationTarget.description}
              </p>
            </div>
            {classificationTarget.lastClassification ? (
              <div className="border-border rounded-lg border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold">
                    Latest classification
                  </h3>
                  <span className="text-muted text-xs">
                    {classificationTarget.classificationCount} classification
                    {classificationTarget.classificationCount === 1
                      ? ""
                      : "s"}{" "}
                    recorded
                  </span>
                </div>
                <p className="text-muted mt-2 text-sm">
                  {classificationTarget.lastClassification.classifiedBy?.name ??
                    "Unknown user"}{" "}
                  ·{" "}
                  {formatDate(
                    classificationTarget.lastClassification.classifiedAt,
                  )}
                </p>
                {classificationTarget.lastClassification.rationale ? (
                  <p className="mt-2 text-sm leading-6 break-words whitespace-pre-wrap">
                    {classificationTarget.lastClassification.rationale}
                  </p>
                ) : null}
              </div>
            ) : (
              <Alert>
                This incident has not been formally classified. Its stored
                medium severity is the database default, not an officer
                decision.
              </Alert>
            )}
            {classificationMutation.isError ? (
              <Alert className="border-danger/25 bg-danger-soft text-danger">
                {classificationMutation.error instanceof Error
                  ? classificationMutation.error.message
                  : "Unable to classify this incident. Review the values and try again."}
              </Alert>
            ) : null}
            <FormField
              id="incident-severity"
              label="Severity"
              error={classificationForm.formState.errors.severity?.message}
            >
              <Select
                id="incident-severity"
                autoFocus
                {...classificationForm.register("severity")}
              >
                <option value="low">
                  Low — limited impact, routine response
                </option>
                <option value="medium">
                  Medium — contained but requires investigation
                </option>
                <option value="high">
                  High — significant impact or active threat
                </option>
                <option value="critical">
                  Critical — severe, widespread or urgent impact
                </option>
              </Select>
            </FormField>
            <FormField
              id="classification-rationale"
              label="Classification rationale"
              error={classificationForm.formState.errors.rationale?.message}
            >
              <Textarea
                id="classification-rationale"
                className="min-h-28"
                maxLength={2000}
                placeholder="Describe the observed impact, scope, affected services and urgency supporting this severity."
                aria-invalid={Boolean(
                  classificationForm.formState.errors.rationale,
                )}
                {...classificationForm.register("rationale")}
              />
              <p className="text-muted text-xs">
                This rationale is retained in the incident update history and
                audit log.
              </p>
            </FormField>
            <Alert>
              Classification prioritizes response; it does not assign the
              incident or change its workflow status.
            </Alert>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={closeClassification}>
                Cancel
              </Button>
              <Button type="submit" disabled={classificationMutation.isPending}>
                {classificationMutation.isPending
                  ? "Saving…"
                  : "Save classification"}
              </Button>
            </div>
          </form>
        ) : null}
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
              <StatusBadge tone={incidentStatus(detail.data.status).tone}>
                {incidentStatus(detail.data.status).label}
              </StatusBadge>
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
