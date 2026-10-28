"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertTriangle,
  Ellipsis,
  History,
  Download,
  FileText,
  Info,
  Loader2,
  Paperclip,
  Eye,
  Plus,
  RotateCcw,
  Search,
  ShieldAlert,
  Trash2,
  UserPlus,
  Link2,
  ShieldCheck,
  GitBranch,
  ShieldX,
  Sparkles,
  HeartPulse,
  BookOpenCheck,
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
import { useToast } from "@/components/feedback/toast";
import { FormField } from "@/components/forms/form-field";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { canRecordIncidentAction } from "../schemas/incident-workflow";
import { IncidentPhaseHistory } from "./incident-phase-history";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useSessionUser } from "@/features/authentication-account";
import { cn } from "@/lib/utils";
import { ApiError } from "@/lib/api/api-error";
import {
  useClassifyIncidentSeverity,
  useAssignIncidentHandler,
  useIncidentAssignmentOptions,
  useIncidentClassificationQueue,
  useIncidentEvidence,
  useUploadIncidentEvidence,
  useRemoveIncidentEvidence,
  useUpdateIncidentHandlingProgress,
  useMyIncident,
  useMyIncidents,
  useReportIncident,
  useIncidentSourceOptions,
} from "../hooks/use-incidents";
import {
  classifyIncidentFormSchema,
  assignIncidentFormSchema,
  updateIncidentProgressFormSchema,
  reportIncidentFormSchema,
  removeIncidentEvidenceFormSchema,
  type ClassifyIncidentForm,
  type AssignIncidentForm,
  type UpdateIncidentProgressForm,
  type Incident,
  type IncidentSeverity,
  type IncidentEvidence,
  type RemoveIncidentEvidenceForm,
  type ReportIncidentForm,
} from "../schemas/report-incident-schema";
import { LinkIncidentAssetDialog } from "./link-incident-asset-dialog";
import { LinkIncidentControlDialog } from "./link-incident-control-dialog";
import { LinkIncidentRiskDialog } from "./link-incident-risk-dialog";
import { RecordControlWeaknessDialog } from "./record-control-weakness-dialog";
import { CreateRiskReassessmentRequestDialog } from "./create-risk-reassessment-request-dialog";
import { RecordEradicationActionDialog } from "./record-eradication-action-dialog";
import { RecordRecoveryActionDialog } from "./record-recovery-action-dialog";
import { RootCauseAnalysisDialog } from "./root-cause-analysis-dialog";
import { CloseIncidentDialog } from "./close-incident-dialog";
import { ClassificationHistory } from "./classification-history";
import { AssignmentHistory } from "./assignment-history";
import { RecordContainmentActionDialog } from "./record-containment-action-dialog";

const defaults: ReportIncidentForm = {
  creationMode: "source",
  sourceId: "",
  title: "",
  description: "",
  severity: "medium",
  occurredAt: "",
};
const createDefaults = (
  canUseConfirmedSource: boolean,
): ReportIncidentForm => ({
  ...defaults,
  creationMode: canUseConfirmedSource ? "source" : "manual",
});
const classificationDefaults: ClassifyIncidentForm = {
  severity: "medium",
  rationale: "",
};
const assignmentDefaults: AssignIncidentForm = { assigneeUserId: "", note: "" };
const progressDefaults: UpdateIncidentProgressForm = {
  status: "triage",
  note: "",
  confirmed: false,
  skipReason: "",
};
const removalDefaults: RemoveIncidentEvidenceForm = { reason: "" };
const progressOptions: Record<
  string,
  readonly UpdateIncidentProgressForm["status"][]
> = {
  open: ["triage", "containment", "eradication", "recovery"],
  triage: ["containment", "eradication", "recovery"],
  containment: ["eradication", "recovery"],
  eradication: ["recovery"],
  recovery: ["lessons_learned"],
};
const formatDate = (value: string) =>
  new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
const formatWorkflowLabel = (value: string) =>
  value
    .split("_")
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
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
  open: { label: "Open", tone: "danger" },
  triage: { label: "Triage", tone: "warning" },
  containment: { label: "Containment", tone: "warning" },
  eradication: { label: "Eradication", tone: "info" },
  recovery: { label: "Recovery", tone: "info" },
  lessons_learned: { label: "Lessons learned", tone: "success" },
};
const incidentStatus = (status: string) =>
  statusPresentation[status] ?? {
    label: status.replaceAll("_", " "),
    tone: "neutral" as const,
  };
const formatBytes = (value: number | null) => {
  if (value === null) return "Unknown size";
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${Math.ceil(value / 1024)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
};
function ContextList({
  title,
  empty,
  items,
}: {
  title: string;
  empty: string;
  items: string[];
}) {
  return (
    <div className="border-border rounded-lg border p-3">
      <h4 className="text-xs font-semibold">{title}</h4>
      {items.length ? (
        <ul className="mt-2 space-y-2">
          {items.map((item, index) => (
            <li
              className="text-muted text-sm break-words"
              key={`${item}-${index}`}
            >
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted mt-2 text-sm">{empty}</p>
      )}
    </div>
  );
}

export function IncidentReportingManager() {
  const session = useSessionUser();
  const isSecurityOfficer =
    session.data?.roles.some((role) => role.code === "SECURITY_OFFICER") ??
    false;
  const allowed =
    session.data?.roles.some((role) =>
      ["ADMIN", "SECURITY_OFFICER", "EXECUTIVE", "EMPLOYEE"].includes(
        role.code,
      ),
    ) ?? false;
  const canRead = isSecurityOfficer;
  const canClassify = isSecurityOfficer;
  const canAssign = isSecurityOfficer;
  const canLinkAssets = isSecurityOfficer;
  const canLinkControls = isSecurityOfficer;
  const canLinkRisks = isSecurityOfficer;
  const canRecordControlWeakness = isSecurityOfficer;
  const canRequestRiskReassessment = isSecurityOfficer;
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [classificationFilters, setClassificationFilters] = useState({
    search: "",
    severity: "",
    status: "",
  });
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string>();
  const [classificationTarget, setClassificationTarget] = useState<Incident>();
  const [classificationTab, setClassificationTab] = useState<
    "classification" | "history"
  >("classification");
  const [assignmentTarget, setAssignmentTarget] = useState<Incident>();
  const [assignmentTab, setAssignmentTab] = useState<"assignment" | "history">(
    "assignment",
  );
  const [progressTarget, setProgressTarget] = useState<Incident>();
  const [evidenceTarget, setEvidenceTarget] = useState<Incident>();
  const [assetLinkTarget, setAssetLinkTarget] = useState<Incident>();
  const [controlLinkTarget, setControlLinkTarget] = useState<Incident>();
  const [riskLinkTarget, setRiskLinkTarget] = useState<Incident>();
  const [controlWeaknessTarget, setControlWeaknessTarget] =
    useState<Incident>();
  const [riskReassessmentTarget, setRiskReassessmentTarget] =
    useState<Incident>();
  const [eradicationTarget, setEradicationTarget] = useState<Incident>();
  const [recoveryTarget, setRecoveryTarget] = useState<Incident>();
  const [containmentTarget, setContainmentTarget] = useState<Incident>();
  const [rootCauseTarget, setRootCauseTarget] = useState<Incident>();
  const [closeIncidentTarget, setCloseIncidentTarget] = useState<Incident>();
  const [removalTarget, setRemovalTarget] = useState<IncidentEvidence>();
  const [evidencePage, setEvidencePage] = useState(1);
  const [evidenceFile, setEvidenceFile] = useState<File>();
  const [evidenceDescription, setEvidenceDescription] = useState("");
  const [evidenceError, setEvidenceError] = useState<string>();
  const [handlerSearch, setHandlerSearch] = useState("");
  const [message, setMessage] = useState<string>();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const detailDialogRef = useRef<HTMLDialogElement>(null);
  const classificationDialogRef = useRef<HTMLDialogElement>(null);
  const assignmentDialogRef = useRef<HTMLDialogElement>(null);
  const progressDialogRef = useRef<HTMLDialogElement>(null);
  const evidenceDialogRef = useRef<HTMLDialogElement>(null);
  const removalDialogRef = useRef<HTMLDialogElement>(null);
  const list = useMyIncidents(page, allowed && !canClassify);
  const classificationQueue = useIncidentClassificationQueue(
    page,
    classificationFilters,
    canRead,
  );
  const displayedList = canRead ? classificationQueue : list;
  const detail = useMyIncident(selectedId);
  const mutation = useReportIncident();
  const classificationMutation = useClassifyIncidentSeverity();
  const assignmentOptions = useIncidentAssignmentOptions(canAssign);
  const assignmentMutation = useAssignIncidentHandler();
  const progressMutation = useUpdateIncidentHandlingProgress();
  const evidence = useIncidentEvidence(evidenceTarget?.id, evidencePage);
  const evidenceMutation = useUploadIncidentEvidence();
  const removalMutation = useRemoveIncidentEvidence();
  const toast = useToast();
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors },
  } = useForm<ReportIncidentForm>({
    resolver: zodResolver(reportIncidentFormSchema),
    defaultValues: createDefaults(isSecurityOfficer),
  });
  const creationMode = useWatch({ control, name: "creationMode" });
  const sourceOptions = useIncidentSourceOptions(
    open && isSecurityOfficer && creationMode === "source",
  );
  const selectedSourceId = useWatch({ control, name: "sourceId" });
  const selectedSource = sourceOptions.data?.items.find(
    (item) => item.findingId === selectedSourceId,
  );
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
  const removalForm = useForm<RemoveIncidentEvidenceForm>({
    resolver: zodResolver(removeIncidentEvidenceFormSchema),
    defaultValues: removalDefaults,
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
  useEffect(() => {
    const dialog = evidenceDialogRef.current;
    if (!dialog) return;
    if (evidenceTarget && !dialog.open) dialog.showModal();
    if (!evidenceTarget && dialog.open) dialog.close();
  }, [evidenceTarget]);
  useEffect(() => {
    const dialog = removalDialogRef.current;
    if (!dialog) return;
    if (removalTarget && !dialog.open) dialog.showModal();
    if (!removalTarget && dialog.open) dialog.close();
  }, [removalTarget]);
  const close = () => {
    setOpen(false);
    setMessage(undefined);
    reset(createDefaults(isSecurityOfficer));
  };
  const openCreateDialog = () => {
    setMessage(undefined);
    reset(createDefaults(isSecurityOfficer));
    setOpen(true);
  };
  const submit = async (values: ReportIncidentForm) => {
    try {
      const created = await mutation.mutateAsync(values);
      close();
      setPage(1);
      toast.success(
        "Incident created",
        values.creationMode === "source"
          ? `${created.incidentCode} is linked to the confirmed source.`
          : `${created.incidentCode} was created for investigation.`,
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to create the incident.",
      );
    }
  };
  const openClassification = (incident: Incident) => {
    setClassificationTab(
      incident.status === "closed" ? "history" : "classification",
    );
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
        expectedUpdatedAt: classificationTarget.updatedAt,
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
    setAssignmentTab(incident.status === "closed" ? "history" : "assignment");
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
        expectedUpdatedAt: assignmentTarget.updatedAt,
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
  const closeProgress = () => {
    setProgressTarget(undefined);
    progressForm.reset(progressDefaults);
    progressMutation.reset();
  };
  const submitProgress = async (values: UpdateIncidentProgressForm) => {
    if (!progressTarget) return;
    const options = progressOptions[progressTarget.status];
    if (
      values.status !== options?.[0] &&
      (values.skipReason?.trim().length ?? 0) < 10
    ) {
      progressForm.setError("skipReason", {
        message: "Explain why phases must be skipped (at least 10 characters).",
      });
      return;
    }
    if (values.skipReason?.trim() && values.skipReason.trim().length < 10) {
      progressForm.setError("skipReason", {
        message: "Use at least 10 characters for an emergency exception.",
      });
      return;
    }
    try {
      const updated = await progressMutation.mutateAsync({
        id: progressTarget.id,
        values,
        expectedStatus: progressTarget.status,
        expectedUpdatedAt: progressTarget.updatedAt,
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
  const closeEvidence = () => {
    setRemovalTarget(undefined);
    setEvidenceTarget(undefined);
    setEvidenceFile(undefined);
    setEvidenceDescription("");
    setEvidenceError(undefined);
    evidenceMutation.reset();
    removalMutation.reset();
    removalForm.reset(removalDefaults);
  };
  const submitEvidence = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!evidenceTarget || !evidenceFile) {
      setEvidenceError("Choose an evidence or log file before uploading.");
      return;
    }
    if (evidenceFile.size > 20 * 1024 * 1024) {
      setEvidenceError("Incident evidence may not exceed 20 MB.");
      return;
    }
    setEvidenceError(undefined);
    try {
      await evidenceMutation.mutateAsync({
        id: evidenceTarget.id,
        file: evidenceFile,
        description: evidenceDescription,
      });
      toast.success(
        "Evidence attached",
        `${evidenceFile.name} is linked to ${evidenceTarget.incidentCode}.`,
      );
      setEvidenceFile(undefined);
      setEvidenceDescription("");
      setEvidencePage(1);
    } catch (error) {
      setEvidenceError(
        error instanceof Error ? error.message : "Unable to upload evidence.",
      );
    }
  };
  const openRemoval = (item: IncidentEvidence) => {
    removalForm.reset(removalDefaults);
    removalMutation.reset();
    setRemovalTarget(item);
  };
  const closeRemoval = () => {
    setRemovalTarget(undefined);
    removalForm.reset(removalDefaults);
    removalMutation.reset();
  };
  const submitRemoval = async (values: RemoveIncidentEvidenceForm) => {
    if (!removalTarget || !evidenceTarget) return;
    try {
      const removedName = removalTarget.file.name;
      await removalMutation.mutateAsync({
        id: removalTarget.id,
        incidentId: evidenceTarget.id,
        values,
      });
      if ((evidence.data?.items.length ?? 0) === 1 && evidencePage > 1)
        setEvidencePage((current) => current - 1);
      closeRemoval();
      toast.success(
        "Evidence removed",
        `${removedName} was removed and the reason was retained in the audit log.`,
      );
    } catch {
      // The persistent API error is rendered inside the confirmation dialog.
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
    });
  };
  const displayedItems = displayedList.data?.items ?? [];
  const hasActiveFilters = Boolean(
    classificationFilters.search ||
    classificationFilters.severity ||
    classificationFilters.status,
  );
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
              className="hover:bg-neutral-soft focus-visible:outline-brand flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-left text-sm transition-colors focus-visible:outline-2"
              onClick={() => setSelectedId(item.id)}
              type="button"
            >
              <Eye aria-hidden="true" className="size-4" strokeWidth={1.8} />
              View details
            </button>
            {isSecurityOfficer ? (
              <button
                type="button"
                className="hover:bg-neutral-soft focus-visible:outline-brand flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-left text-sm focus-visible:outline-2"
                onClick={() => {
                  progressMutation.reset();
                  progressForm.reset({
                    ...progressDefaults,
                    status: progressOptions[item.status]?.[0] ?? "triage",
                  });
                  setProgressTarget(item);
                }}
              >
                <GitBranch
                  aria-hidden="true"
                  className="size-4"
                  strokeWidth={1.8}
                />
                {progressOptions[item.status]?.length
                  ? "Update handling phase"
                  : "View phase history"}
              </button>
            ) : null}
            <button
              className="hover:bg-neutral-soft focus-visible:outline-brand flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-left text-sm transition-colors focus-visible:outline-2 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => openClassification(item)}
              type="button"
            >
              <ShieldAlert
                aria-hidden="true"
                className="size-4"
                strokeWidth={1.8}
              />
              {item.status === "closed"
                ? "View severity history"
                : item.classificationCount > 0
                  ? "Reclassify severity"
                  : "Classify severity"}
            </button>
            {canAssign ? (
              <button
                className="hover:bg-neutral-soft focus-visible:outline-brand flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-left text-sm transition-colors focus-visible:outline-2 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => openAssignment(item)}
                type="button"
              >
                <UserPlus
                  aria-hidden="true"
                  className="size-4"
                  strokeWidth={1.8}
                />
                {item.status === "closed"
                  ? "View handler assignment"
                  : item.currentAssignment
                    ? "Reassign handler"
                    : "Assign handler"}
              </button>
            ) : null}
            {isSecurityOfficer ? (
              <button
                className="hover:bg-neutral-soft focus-visible:outline-brand flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-left text-sm transition-colors focus-visible:outline-2"
                onClick={() => setEradicationTarget(item)}
                type="button"
              >
                <Sparkles
                  aria-hidden="true"
                  className="size-4"
                  strokeWidth={1.8}
                />
                {!canRecordIncidentAction(item.status, "eradication")
                  ? "View eradication history"
                  : "Record eradication action"}
              </button>
            ) : null}
            {isSecurityOfficer &&
            (["lessons_learned", "closed"].includes(item.status) ||
              item.hasAnalysis) ? (
              <button
                className="hover:bg-neutral-soft focus-visible:outline-brand flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-left text-sm transition-colors focus-visible:outline-2"
                onClick={() => setRootCauseTarget(item)}
                type="button"
              >
                <BookOpenCheck
                  aria-hidden="true"
                  className="size-4"
                  strokeWidth={1.8}
                />
                {item.status === "lessons_learned"
                  ? "Root cause & lessons learned"
                  : "View root cause & lessons learned"}
              </button>
            ) : null}
            {isSecurityOfficer &&
            ["lessons_learned", "closed"].includes(item.status) ? (
              <button
                className="hover:bg-neutral-soft focus-visible:outline-brand flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-left text-sm focus-visible:outline-2"
                onClick={() => setCloseIncidentTarget(item)}
                type="button"
              >
                <ShieldCheck
                  aria-hidden="true"
                  className="size-4"
                  strokeWidth={1.8}
                />
                {item.status === "closed"
                  ? "View closure record"
                  : "Close incident"}
              </button>
            ) : null}
            {isSecurityOfficer ? (
              <button
                className="hover:bg-neutral-soft focus-visible:outline-brand flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-left text-sm transition-colors focus-visible:outline-2"
                onClick={() => setRecoveryTarget(item)}
                type="button"
              >
                <HeartPulse
                  aria-hidden="true"
                  className="size-4"
                  strokeWidth={1.8}
                />
                {!canRecordIncidentAction(item.status, "recovery")
                  ? "View recovery history"
                  : "Record recovery action"}
              </button>
            ) : null}
            {isSecurityOfficer ? (
              <button
                className="hover:bg-neutral-soft focus-visible:outline-brand flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-left text-sm focus-visible:outline-2"
                onClick={() => setContainmentTarget(item)}
                type="button"
              >
                <ShieldCheck
                  aria-hidden="true"
                  className="size-4"
                  strokeWidth={1.8}
                />
                {!canRecordIncidentAction(item.status, "containment")
                  ? "View containment history"
                  : "Record containment action"}
              </button>
            ) : null}
            {canLinkAssets && item.status !== "closed" ? (
              <button
                className="hover:bg-neutral-soft focus-visible:outline-brand flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-left text-sm transition-colors focus-visible:outline-2"
                onClick={() => setAssetLinkTarget(item)}
                type="button"
              >
                <Link2
                  aria-hidden="true"
                  className="size-4"
                  strokeWidth={1.8}
                />
                {item.relatedCounts.assets > 0
                  ? "Link another asset"
                  : "Link asset"}
              </button>
            ) : null}
            {canLinkControls && item.status !== "closed" ? (
              <button
                className="hover:bg-neutral-soft focus-visible:outline-brand flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-left text-sm transition-colors focus-visible:outline-2"
                onClick={() => setControlLinkTarget(item)}
                type="button"
              >
                <ShieldCheck
                  aria-hidden="true"
                  className="size-4"
                  strokeWidth={1.8}
                />
                {item.relatedCounts.controls > 0
                  ? "Link another control"
                  : "Link control"}
              </button>
            ) : null}
            {canLinkRisks && item.status !== "closed" ? (
              <button
                className="hover:bg-neutral-soft focus-visible:outline-brand flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-left text-sm transition-colors focus-visible:outline-2"
                onClick={() => setRiskLinkTarget(item)}
                type="button"
              >
                <GitBranch
                  aria-hidden="true"
                  className="size-4"
                  strokeWidth={1.8}
                />
                {item.relatedCounts.risks > 0
                  ? "Link another risk"
                  : "Link existing risk"}
              </button>
            ) : null}
            {canRecordControlWeakness ? (
              <button
                className="hover:bg-neutral-soft focus-visible:outline-brand flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-left text-sm transition-colors focus-visible:outline-2"
                onClick={() => setControlWeaknessTarget(item)}
                type="button"
              >
                <ShieldX
                  aria-hidden="true"
                  className="size-4"
                  strokeWidth={1.8}
                />
                {item.status === "closed"
                  ? "View control weakness history"
                  : "Record control weakness"}
              </button>
            ) : null}
            {canRequestRiskReassessment ? (
              <button
                className="hover:bg-neutral-soft focus-visible:outline-brand flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-left text-sm transition-colors focus-visible:outline-2"
                onClick={() => setRiskReassessmentTarget(item)}
                type="button"
              >
                <RotateCcw
                  aria-hidden="true"
                  className="size-4"
                  strokeWidth={1.8}
                />
                {item.status === "closed"
                  ? "View risk reassessment history"
                  : "Request risk reassessment"}
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
  if (!allowed && !canRead)
    return (
      <Alert>You do not have permission to access incident management.</Alert>
    );
  return (
    <>
      <ProductPageHeader
        title={canRead ? "Security incidents" : "Report security incidents"}
        description={
          canRead
            ? "Review security incidents and open a selected record for operational details."
            : "Report suspicious activity promptly so the security team can investigate and respond."
        }
        showSampleNotice={false}
        additionalActions={
          allowed ? (
            <Button onClick={openCreateDialog}>
              <Plus aria-hidden="true" className="size-4" />
              Create incident
            </Button>
          ) : undefined
        }
      />
      <ProductPanel
        title={canRead ? "Incident register" : "My incident reports"}
        description={
          displayedList.data
            ? `${displayedList.data.pagination.total} incidents found`
            : canRead
              ? "Search and review security incidents"
              : "Incidents you have reported"
        }
      >
        {canRead ? (
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
                <option value="open">Open</option>
                <option value="triage">Triage</option>
                <option value="containment">Containment</option>
                <option value="eradication">Eradication</option>
                <option value="recovery">Recovery</option>
                <option value="lessons_learned">Lessons learned</option>
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
                  !classificationFilters.status
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
          ) : displayedList.isError && !displayedItems.length ? (
            <Alert>Unable to load incident reports.</Alert>
          ) : displayedItems.length ? (
            <DataTable
              columns={columns}
              rows={displayedItems}
              getRowKey={(item) => item.id}
            />
          ) : (
            <div className="py-12 text-center">
              <ShieldAlert
                aria-hidden="true"
                className="text-muted mx-auto size-10 stroke-1"
              />
              <h3 className="mt-2 text-base font-semibold">
                {canRead && hasActiveFilters
                  ? "No matching incidents found"
                  : canRead
                    ? "No incidents found"
                    : "No incidents reported"}
              </h3>
              <p className="text-muted mx-auto mt-1 max-w-sm text-sm">
                {canRead && hasActiveFilters
                  ? "No incidents match the current search and filter criteria. Try adjusting or clearing the filters."
                  : canRead
                    ? "No security incidents have been recorded yet."
                    : "No incident reports have been submitted yet."}
              </p>
              {canRead && hasActiveFilters ? (
                <Button
                  className="mt-4 min-h-9 text-xs"
                  onClick={resetFilters}
                  type="button"
                  variant="secondary"
                >
                  Clear filters
                </Button>
              ) : !canRead ? (
                <Button
                  className="mt-4 min-h-9 text-xs"
                  onClick={openCreateDialog}
                  type="button"
                >
                  <Plus aria-hidden="true" className="size-4" />
                  Create incident
                </Button>
              ) : null}
            </div>
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
        title="Create incident"
        className="max-h-[calc(100dvh-2rem)] w-[min(40rem,calc(100%-2rem))] overflow-y-auto"
        onClose={close}
      >
        <form className="space-y-5" noValidate onSubmit={handleSubmit(submit)}>
          {message ? (
            <Alert className="border-danger/25 bg-danger-soft text-danger">
              {message}
            </Alert>
          ) : null}
          <input type="hidden" {...register("creationMode")} />
          {isSecurityOfficer ? (
            <div className="space-y-2">
              <p className="text-sm font-medium">Creation method</p>
              <div
                aria-label="Incident creation methods"
                className="border-border bg-surface inline-flex w-full items-center gap-1 rounded-xl border p-1 shadow-xs sm:w-auto"
                role="tablist"
              >
                {(
                  [
                    {
                      value: "source",
                      label: "From confirmed source",
                      icon: Link2,
                    },
                    {
                      value: "manual",
                      label: "Manual",
                      icon: Plus,
                    },
                  ] as const
                ).map((option) => {
                  const Icon = option.icon;
                  const selected = creationMode === option.value;
                  return (
                    <button
                      aria-selected={selected}
                      className={cn(
                        "inline-flex min-w-0 flex-1 items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors sm:flex-none",
                        selected
                          ? "bg-brand text-brand-contrast font-semibold shadow-xs"
                          : "text-muted hover:bg-neutral-soft hover:text-foreground",
                      )}
                      key={option.value}
                      onClick={() => {
                        setValue("creationMode", option.value, {
                          shouldValidate: true,
                        });
                        if (option.value === "manual") {
                          setValue("sourceId", "", { shouldValidate: true });
                        }
                      }}
                      role="tab"
                      type="button"
                    >
                      <Icon
                        aria-hidden="true"
                        className="size-4 shrink-0"
                        strokeWidth={1.8}
                      />
                      <span>{option.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <Alert>
              Submit the information you observed. The security team will review
              and investigate this report.
            </Alert>
          )}
          {creationMode === "source" && sourceOptions.isError ? (
            <Alert className="border-danger/25 bg-danger-soft text-danger">
              Unable to load confirmed alerts and findings. Close and reopen the
              dialog to retry.
            </Alert>
          ) : null}
          {creationMode === "source" ? (
            <FormField
              id="incident-source"
              label="Confirmed alert or finding"
              error={errors.sourceId?.message}
            >
              <Select
                id="incident-source"
                disabled={sourceOptions.isPending || sourceOptions.isError}
                {...register("sourceId", {
                  onChange: (event) => {
                    const source = sourceOptions.data?.items.find(
                      (item) => item.findingId === event.target.value,
                    );
                    if (!source) return;
                    setValue("title", source.title, { shouldValidate: true });
                    setValue("description", source.description ?? "", {
                      shouldValidate: true,
                    });
                    setValue("severity", source.severity, {
                      shouldValidate: true,
                    });
                    setValue("occurredAt", source.detectedAt.slice(0, 16));
                  },
                })}
              >
                <option value="">
                  {sourceOptions.isPending
                    ? "Loading eligible sources…"
                    : "Select a source"}
                </option>
                {sourceOptions.data?.items.map((source) => (
                  <option key={source.findingId} value={source.findingId}>
                    {source.title} · Alert{" "}
                    {source.alertId.slice(0, 8).toUpperCase()}
                  </option>
                ))}
              </Select>
              <p className="text-muted text-xs">
                Only confirmed sources that are not already linked to an
                incident are shown.
              </p>
            </FormField>
          ) : isSecurityOfficer ? (
            <Alert>
              Create manually only when no confirmed alert or finding exists.
              The incident will have no originating-source link.
            </Alert>
          ) : null}
          {creationMode === "source" &&
          sourceOptions.data?.items.length === 0 ? (
            <Alert>
              No eligible confirmed alerts or findings are available.
            </Alert>
          ) : null}
          <FormField
            id="incident-title"
            label="Incident title"
            error={errors.title?.message}
          >
            <Input
              id="incident-title"
              maxLength={255}
              aria-invalid={Boolean(errors.title)}
              aria-describedby={
                errors.title ? "incident-title-error" : undefined
              }
              placeholder="Concise incident title"
              {...register("title")}
            />
          </FormField>
          <FormField
            id="incident-severity"
            label="Severity"
            error={errors.severity?.message}
          >
            <Select id="incident-severity" {...register("severity")}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </Select>
          </FormField>
          <FormField
            id="occurred-at"
            label="Detected at (optional)"
            error={errors.occurredAt?.message}
          >
            <Input
              id="occurred-at"
              type="datetime-local"
              {...register("occurredAt")}
            />
            <p className="text-muted text-xs">
              {creationMode === "source"
                ? "Defaults to the source finding time when left blank."
                : "Defaults to the current time when left blank."}
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
              placeholder="Record the confirmed event, affected scope, and relevant investigation context."
              {...register("description")}
            />
          </FormField>
          {creationMode === "source" ? (
            <Alert>
              Creating the incident permanently links it to the selected
              security finding for audit traceability.
            </Alert>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={close}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                mutation.isPending ||
                (creationMode === "source" &&
                  (!selectedSource || sourceOptions.isPending))
              }
            >
              {mutation.isPending ? "Creating…" : "Create incident"}
            </Button>
          </div>
        </form>
      </Dialog>
      <Dialog
        dialogRef={assignmentDialogRef}
        title="Assign incident handler"
        className="max-h-[calc(100dvh-2rem)] w-[min(44rem,calc(100%-2rem))] overflow-y-auto"
        onClose={closeAssignment}
      >
        {assignmentTarget ? (
          <div className="space-y-5">
            {/* Context bar */}
            <div className="border-border bg-neutral-soft/30 rounded-lg border p-3.5 text-xs">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="text-muted font-mono font-semibold">
                  {assignmentTarget.incidentCode}
                </span>
                <span className="text-foreground font-semibold break-words">
                  {assignmentTarget.title}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
                {assignmentTarget.currentAssignment ? (
                  <>
                    <span className="text-muted">Assigned to:</span>
                    <span className="text-foreground font-medium">
                      {assignmentTarget.currentAssignment.assignee.name}
                    </span>
                    {assignmentTarget.currentAssignment.assignedAt ? (
                      <span className="text-muted">
                        ·{" "}
                        {formatDate(
                          assignmentTarget.currentAssignment.assignedAt,
                        )}
                      </span>
                    ) : null}
                  </>
                ) : (
                  <span className="text-muted">
                    No active handler assigned.
                  </span>
                )}
              </div>
            </div>

            {/* Tab switcher */}
            <div
              role="tablist"
              aria-label="Incident assignment views"
              className="border-border bg-surface inline-flex w-full items-center gap-1 rounded-xl border p-1 shadow-xs sm:w-auto"
            >
              <button
                id="assignment-assignment-tab"
                type="button"
                role="tab"
                aria-selected={assignmentTab === "assignment"}
                aria-controls="assignment-assignment-panel"
                tabIndex={assignmentTab === "assignment" ? 0 : -1}
                disabled={assignmentTarget.status === "closed"}
                className={cn(
                  "focus-visible:outline-brand inline-flex min-w-0 flex-1 items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors focus-visible:outline-2 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none",
                  assignmentTab === "assignment"
                    ? "bg-brand text-brand-contrast font-semibold shadow-xs"
                    : "text-muted hover:bg-neutral-soft hover:text-foreground",
                )}
                onClick={() => setAssignmentTab("assignment")}
                onKeyDown={(event) => {
                  if (assignmentTarget.status === "closed") return;
                  if (
                    ["ArrowLeft", "ArrowRight", "Home", "End"].includes(
                      event.key,
                    )
                  ) {
                    event.preventDefault();
                    const next =
                      event.key === "Home" || event.key === "ArrowLeft"
                        ? "assignment"
                        : "history";
                    setAssignmentTab(next);
                    event.currentTarget.parentElement
                      ?.querySelector<HTMLButtonElement>(
                        `#assignment-${next}-tab`,
                      )
                      ?.focus();
                  }
                }}
              >
                <UserPlus
                  aria-hidden="true"
                  className="size-4 shrink-0"
                  strokeWidth={1.8}
                />
                Assignment
              </button>
              <button
                id="assignment-history-tab"
                type="button"
                role="tab"
                aria-selected={assignmentTab === "history"}
                aria-controls="assignment-history-panel"
                tabIndex={assignmentTab === "history" ? 0 : -1}
                className={cn(
                  "focus-visible:outline-brand inline-flex min-w-0 flex-1 items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors focus-visible:outline-2 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none",
                  assignmentTab === "history"
                    ? "bg-brand text-brand-contrast font-semibold shadow-xs"
                    : "text-muted hover:bg-neutral-soft hover:text-foreground",
                )}
                onClick={() => setAssignmentTab("history")}
                onKeyDown={(event) => {
                  if (
                    ["ArrowLeft", "ArrowRight", "Home", "End"].includes(
                      event.key,
                    )
                  ) {
                    event.preventDefault();
                    const next =
                      event.key === "End" || event.key === "ArrowRight"
                        ? "history"
                        : "assignment";
                    setAssignmentTab(next);
                    event.currentTarget.parentElement
                      ?.querySelector<HTMLButtonElement>(
                        `#assignment-${next}-tab`,
                      )
                      ?.focus();
                  }
                }}
              >
                <History
                  aria-hidden="true"
                  className="size-4 shrink-0"
                  strokeWidth={2}
                />
                History
              </button>
            </div>

            {/* History panel */}
            <div
              id="assignment-history-panel"
              role="tabpanel"
              aria-labelledby="assignment-history-tab"
              hidden={assignmentTab !== "history"}
              className="space-y-5"
            >
              {assignmentTab === "history" ? (
                <AssignmentHistory
                  key={assignmentTarget.id}
                  incidentId={assignmentTarget.id}
                />
              ) : null}
              <div className="border-border flex justify-end border-t pt-4">
                <Button
                  variant="secondary"
                  onClick={closeAssignment}
                  type="button"
                >
                  Close
                </Button>
              </div>
            </div>

            {/* Assignment panel */}
            <form
              id="assignment-assignment-panel"
              role="tabpanel"
              aria-labelledby="assignment-assignment-tab"
              hidden={assignmentTab !== "assignment"}
              className="space-y-6"
              noValidate
              onSubmit={assignmentForm.handleSubmit(submitAssignment)}
            >
              {/* Alerts */}
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

              {/* Section 1 — Handler selection */}
              <section
                aria-labelledby="handler-select-heading"
                className="space-y-3"
              >
                <div className="border-border flex items-start gap-2 border-b pb-2">
                  <UserPlus
                    aria-hidden="true"
                    className="text-brand mt-0.5 size-4 shrink-0"
                    strokeWidth={1.8}
                  />
                  <div>
                    <h3
                      id="handler-select-heading"
                      className="text-foreground text-sm font-semibold"
                    >
                      Select handler
                    </h3>
                    <p className="text-muted text-xs">
                      Choose an active Security Officer to assign as the
                      responsible handler.
                    </p>
                  </div>
                </div>
                <input
                  type="hidden"
                  {...assignmentForm.register("assigneeUserId")}
                />
                <div className="border-border overflow-hidden rounded-xl border">
                  <div className="border-border relative border-b">
                    <Search
                      aria-hidden="true"
                      className="text-muted pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
                      strokeWidth={1.8}
                    />
                    <Input
                      id="incident-handler-search"
                      autoFocus
                      className="rounded-none border-0 pl-10 focus:ring-0"
                      disabled={
                        assignmentOptions.isPending || assignmentOptions.isError
                      }
                      onChange={(event) => setHandlerSearch(event.target.value)}
                      placeholder="Search by name or email…"
                      value={handlerSearch}
                    />
                  </div>
                  <div
                    aria-label="Eligible incident handlers"
                    aria-labelledby="handler-select-heading"
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
                            className={cn(
                              "focus-visible:outline-brand flex min-h-11 w-full items-center justify-between gap-3 rounded-lg px-3 text-left text-sm transition-colors focus-visible:outline-2",
                              selected
                                ? "border-brand bg-brand/5 border"
                                : "hover:bg-neutral-soft",
                            )}
                            key={user.id}
                            onClick={() =>
                              assignmentForm.setValue(
                                "assigneeUserId",
                                user.id,
                                {
                                  shouldDirty: true,
                                  shouldValidate: true,
                                },
                              )
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
                            <span
                              className={cn(
                                "grid size-4 shrink-0 place-items-center rounded-full border-2 transition-colors",
                                selected
                                  ? "border-brand bg-brand"
                                  : "border-border bg-surface",
                              )}
                            >
                              {selected ? (
                                <span className="size-1.5 rounded-full bg-white" />
                              ) : null}
                            </span>
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
                {assignmentForm.formState.errors.assigneeUserId ? (
                  <p className="text-danger text-xs" role="alert">
                    {assignmentForm.formState.errors.assigneeUserId.message}
                  </p>
                ) : null}
              </section>

              {/* Section 2 — Assignment note */}
              <section
                aria-labelledby="assignment-note-heading"
                className="space-y-3"
              >
                <div className="border-border flex items-start gap-2 border-b pb-2">
                  <FileText
                    aria-hidden="true"
                    className="text-brand mt-0.5 size-4 shrink-0"
                    strokeWidth={1.8}
                  />
                  <div>
                    <h3
                      id="assignment-note-heading"
                      className="text-foreground text-sm font-semibold"
                    >
                      Assignment note
                    </h3>
                    <p className="text-muted text-xs">
                      Optional context for the handler. Max 2,000 characters.
                    </p>
                  </div>
                </div>
                <Textarea
                  id="assignment-note"
                  aria-labelledby="assignment-note-heading"
                  className="min-h-28"
                  maxLength={2000}
                  placeholder="Explain why this handler is appropriate and any immediate response expectations."
                  {...assignmentForm.register("note")}
                />
                {assignmentForm.formState.errors.note ? (
                  <p className="text-danger text-xs" role="alert">
                    {assignmentForm.formState.errors.note.message}
                  </p>
                ) : null}
                <div className="border-border bg-neutral-soft/30 flex gap-2.5 rounded-xl border p-3.5">
                  <Info
                    aria-hidden="true"
                    className="text-muted mt-0.5 size-4 shrink-0"
                    strokeWidth={1.8}
                  />
                  <p className="text-muted text-xs">
                    Assignment changes the responsible Security Officer, not the
                    incident response phase. The handler, note and timestamp are
                    retained in incident history and the audit log.
                  </p>
                </div>
              </section>

              {/* Footer */}
              <div className="border-border flex items-center justify-between border-t pt-4">
                <div />
                <div className="flex items-center gap-3">
                  <Button
                    variant="secondary"
                    onClick={closeAssignment}
                    type="button"
                  >
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
                    {assignmentMutation.isPending ? (
                      <>
                        <Loader2
                          aria-hidden="true"
                          className="size-4 animate-spin"
                        />
                        Assigning…
                      </>
                    ) : (
                      <>
                        <UserPlus
                          aria-hidden="true"
                          className="size-4"
                          strokeWidth={1.8}
                        />
                        Assign handler
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        ) : null}
      </Dialog>
      <Dialog
        dialogRef={evidenceDialogRef}
        title="Incident evidence and logs"
        className="max-h-[calc(100dvh-2rem)] w-[min(44rem,calc(100%-2rem))] overflow-y-auto"
        onClose={closeEvidence}
      >
        {evidenceTarget ? (
          <div className="space-y-5">
            <div className="border-border bg-neutral-soft rounded-lg border p-4">
              <p className="text-muted text-xs font-medium tracking-wide uppercase">
                {evidenceTarget.incidentCode}
              </p>
              <p className="mt-1 font-semibold break-words">
                {evidenceTarget.title}
              </p>
            </div>
            <section aria-labelledby="incident-evidence-list-title">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3
                  id="incident-evidence-list-title"
                  className="text-sm font-semibold"
                >
                  Attached files
                </h3>
                <span className="text-muted text-xs">
                  {evidence.data?.pagination.total ?? 0} files
                </span>
              </div>
              {evidence.isPending ? (
                <div
                  className="bg-neutral-soft h-24 animate-pulse rounded-lg"
                  aria-label="Loading incident evidence"
                />
              ) : evidence.isError ? (
                <Alert>Unable to load incident evidence.</Alert>
              ) : evidence.data?.items.length ? (
                <ul className="border-border divide-border divide-y rounded-lg border">
                  {evidence.data.items.map((item) => (
                    <li
                      className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between"
                      key={item.id}
                    >
                      <span className="min-w-0">
                        <span className="block font-medium break-all">
                          {item.file.name}
                        </span>
                        <span className="text-muted mt-1 block text-xs">
                          {formatBytes(item.file.sizeBytes)} ·{" "}
                          {item.uploadedBy?.name ?? "Unknown user"} ·{" "}
                          {formatDate(item.createdAt)}
                        </span>
                        {item.description ? (
                          <span className="text-muted mt-1 block text-sm break-words">
                            {item.description}
                          </span>
                        ) : null}
                        <span className="text-muted mt-2 block text-xs break-all">
                          SHA-256: {item.file.checksum ?? "Unavailable"}
                        </span>
                      </span>
                      <span className="flex shrink-0 flex-wrap gap-2">
                        <a
                          className="border-border hover:bg-neutral-soft focus-visible:outline-brand inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2"
                          href={`/api/incidents/evidence/${item.id}/download`}
                        >
                          <Download
                            aria-hidden="true"
                            className="size-4"
                            strokeWidth={1.8}
                          />
                          Download
                        </a>
                        {evidenceTarget.status !== "closed" &&
                        (canAssign ||
                          evidenceTarget.currentAssignment?.assignee.id ===
                            session.data?.id) ? (
                          <Button
                            className="px-3"
                            variant="danger"
                            onClick={() => openRemoval(item)}
                          >
                            <Trash2
                              aria-hidden="true"
                              className="size-4"
                              strokeWidth={1.8}
                            />
                            Remove
                          </Button>
                        ) : null}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="border-border text-muted rounded-lg border border-dashed p-5 text-sm">
                  No evidence or logs have been attached.
                </div>
              )}
              {evidence.data && evidence.data.pagination.totalPages > 1 ? (
                <div className="border-border mt-3 border-t pt-3">
                  <Pagination
                    page={evidence.data.pagination.page}
                    pageCount={evidence.data.pagination.totalPages}
                    onPageChange={setEvidencePage}
                  />
                </div>
              ) : null}
            </section>
            {evidenceTarget.status !== "closed" &&
            (canAssign ||
              evidenceTarget.currentAssignment?.assignee.id ===
                session.data?.id) ? (
              <form
                className="border-border space-y-4 border-t pt-5"
                onSubmit={submitEvidence}
              >
                <h3 className="text-sm font-semibold">Attach a file</h3>
                {evidenceError ? (
                  <Alert className="border-danger/25 bg-danger-soft text-danger">
                    {evidenceError}
                  </Alert>
                ) : null}
                <FormField
                  id="incident-evidence-file"
                  label="Evidence or log file"
                >
                  <Input
                    id="incident-evidence-file"
                    key={`${evidenceTarget.id}-${evidenceMutation.data?.id ?? "new"}`}
                    type="file"
                    required
                    accept=".pdf,.png,.jpg,.jpeg,.txt,.log,.csv,.json"
                    className="file:mr-3"
                    onChange={(event) =>
                      setEvidenceFile(event.target.files?.[0])
                    }
                  />
                  <p className="text-muted text-xs">
                    PDF, PNG, JPEG, TXT, LOG, CSV or JSON; maximum 20 MB.
                  </p>
                </FormField>
                <FormField
                  id="incident-evidence-description"
                  label="Description (optional)"
                >
                  <Textarea
                    id="incident-evidence-description"
                    className="min-h-24"
                    maxLength={2000}
                    value={evidenceDescription}
                    onChange={(event) =>
                      setEvidenceDescription(event.target.value)
                    }
                    placeholder="Describe the source, collection time and relevance of this evidence."
                  />
                </FormField>
                <Alert>
                  Files are checksum-protected and retained with uploader and
                  audit information.
                </Alert>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={closeEvidence}
                  >
                    Close
                  </Button>
                  <Button
                    type="submit"
                    disabled={!evidenceFile || evidenceMutation.isPending}
                  >
                    <Paperclip
                      aria-hidden="true"
                      className="size-4"
                      strokeWidth={1.8}
                    />
                    {evidenceMutation.isPending ? "Uploading…" : "Attach file"}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <Alert>
                  {evidenceTarget.status === "closed"
                    ? "Closed incidents are read-only. Existing evidence remains available for download."
                    : "Only the active incident handler or an incident coordinator can attach files. Existing evidence remains available for download."}
                </Alert>
                <div className="flex justify-end">
                  <Button variant="secondary" onClick={closeEvidence}>
                    Close
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </Dialog>
      <Dialog
        dialogRef={removalDialogRef}
        title="Remove incorrect evidence"
        className="max-h-[calc(100dvh-2rem)] w-[min(36rem,calc(100%-2rem))] overflow-y-auto"
        onClose={closeRemoval}
      >
        {removalTarget && evidenceTarget ? (
          <form
            className="space-y-5"
            noValidate
            onSubmit={removalForm.handleSubmit(submitRemoval)}
          >
            <Alert className="border-danger/25 bg-danger-soft text-danger">
              This permanently removes the evidence record and stored file. The
              file metadata and your reason remain in the audit log.
            </Alert>
            <div className="border-border bg-neutral-soft rounded-lg border p-4">
              <p className="text-muted text-xs font-medium tracking-wide uppercase">
                {evidenceTarget.incidentCode}
              </p>
              <p className="mt-1 font-semibold break-all">
                {removalTarget.file.name}
              </p>
              <p className="text-muted mt-1 text-sm">
                {formatBytes(removalTarget.file.sizeBytes)} · uploaded by{" "}
                {removalTarget.uploadedBy?.name ?? "Unknown user"}
              </p>
            </div>
            {removalMutation.isError ? (
              <Alert className="border-danger/25 bg-danger-soft text-danger">
                {removalMutation.error instanceof Error
                  ? removalMutation.error.message
                  : "Unable to remove the evidence."}
              </Alert>
            ) : null}
            <FormField
              id="incident-evidence-removal-reason"
              label="Reason for removal"
              error={removalForm.formState.errors.reason?.message}
            >
              <Textarea
                id="incident-evidence-removal-reason"
                autoFocus
                className="min-h-28"
                maxLength={2000}
                placeholder="Explain why this file is incorrect or was attached to the wrong incident."
                {...removalForm.register("reason")}
              />
              <p className="text-muted text-xs">
                Required for audit purposes; minimum 10 characters.
              </p>
            </FormField>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="secondary" onClick={closeRemoval}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="danger"
                disabled={removalMutation.isPending}
              >
                <Trash2
                  aria-hidden="true"
                  className="size-4"
                  strokeWidth={1.8}
                />
                {removalMutation.isPending ? "Removing…" : "Remove evidence"}
              </Button>
            </div>
          </form>
        ) : null}
      </Dialog>
      <Dialog
        dialogRef={progressDialogRef}
        title="Incident handling phase"
        className="max-h-[calc(100dvh-2rem)] w-[min(44rem,calc(100%-2rem))] overflow-y-auto"
        onClose={closeProgress}
        onCancel={(event) => {
          if (progressMutation.isPending) event.preventDefault();
        }}
      >
        {progressTarget ? (
          <form
            className="space-y-5"
            noValidate
            onSubmit={progressForm.handleSubmit(submitProgress)}
          >
            {/* Context bar */}
            <div className="border-border bg-neutral-soft/30 rounded-lg border p-3.5 text-xs">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="text-muted font-mono font-semibold">
                  {progressTarget.incidentCode}
                </span>
                <span className="text-foreground font-semibold break-words">
                  {progressTarget.title}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-muted">Current phase:</span>
                <span
                  className={cn(
                    "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
                    incidentStatus(progressTarget.status).tone === "warning"
                      ? "bg-warning/10 text-warning"
                      : incidentStatus(progressTarget.status).tone === "danger"
                        ? "bg-danger/10 text-danger"
                        : incidentStatus(progressTarget.status).tone ===
                            "success"
                          ? "bg-success/10 text-success"
                          : incidentStatus(progressTarget.status).tone ===
                              "info"
                            ? "bg-info/10 text-info"
                            : "bg-neutral-soft text-muted",
                  )}
                >
                  {incidentStatus(progressTarget.status).label}
                </span>
              </div>
            </div>

            {/* Phase transition history (collapsible) */}
            <IncidentPhaseHistory
              key={progressTarget.id}
              incidentId={progressTarget.id}
            />

            {/* Error alert */}
            {progressMutation.isError ? (
              <Alert
                role="alert"
                className="border-danger/25 bg-danger-soft text-danger"
              >
                {progressMutation.error instanceof Error
                  ? progressMutation.error.message
                  : "Unable to update incident progress."}
              </Alert>
            ) : null}

            {progressOptions[progressTarget.status]?.length ? (
              <>
                {/* Section 1 — Next phase selection */}
                <section
                  aria-labelledby="phase-status-heading"
                  className="space-y-3"
                >
                  <div className="border-border flex items-start gap-2 border-b pb-2">
                    <GitBranch
                      aria-hidden="true"
                      className="text-brand mt-0.5 size-4 shrink-0"
                      strokeWidth={1.8}
                    />
                    <div>
                      <h3
                        id="phase-status-heading"
                        className="text-foreground text-sm font-semibold"
                      >
                        Next handling phase
                      </h3>
                      <p className="text-muted text-xs">
                        Select the phase this incident will advance to.
                      </p>
                    </div>
                  </div>
                  <ul
                    className="space-y-2"
                    role="radiogroup"
                    aria-labelledby="phase-status-heading"
                  >
                    {progressOptions[progressTarget.status]?.map((status) => {
                      const isSelected =
                        progressForm.watch("status") === status;
                      const presentation = incidentStatus(status);
                      return (
                        <li key={status}>
                          <button
                            type="button"
                            role="radio"
                            aria-checked={isSelected}
                            disabled={progressMutation.isPending}
                            onClick={() =>
                              progressForm.setValue("status", status, {
                                shouldValidate: true,
                              })
                            }
                            className={cn(
                              "border-border focus-visible:outline-brand w-full rounded-xl border p-3.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                              isSelected
                                ? "border-brand bg-brand/5 shadow-xs"
                                : "bg-surface hover:bg-neutral-soft/60",
                            )}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <p className="font-medium">
                                  {presentation.label}
                                </p>
                                <p className="text-muted mt-0.5 text-xs capitalize">
                                  {status.replaceAll("_", " ")}
                                </p>
                              </div>
                              <span
                                className={cn(
                                  "grid size-4 shrink-0 place-items-center rounded-full border-2 transition-colors",
                                  isSelected
                                    ? "border-brand bg-brand"
                                    : "border-border bg-surface",
                                )}
                              >
                                {isSelected ? (
                                  <span className="size-1.5 rounded-full bg-white" />
                                ) : null}
                              </span>
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                  {progressForm.formState.errors.status ? (
                    <p className="text-danger text-sm">
                      {progressForm.formState.errors.status.message}
                    </p>
                  ) : null}
                </section>

                {/* Section 2 — Transition note */}
                <section
                  aria-labelledby="phase-note-heading"
                  className="space-y-3"
                >
                  <div className="border-border flex items-start gap-2 border-b pb-2">
                    <FileText
                      aria-hidden="true"
                      className="text-brand mt-0.5 size-4 shrink-0"
                      strokeWidth={1.8}
                    />
                    <div>
                      <h3
                        id="phase-note-heading"
                        className="text-foreground text-sm font-semibold"
                      >
                        Transition assessment and results
                      </h3>
                      <p className="text-muted text-xs">
                        Min 10 characters. Retained in audit history.
                      </p>
                    </div>
                  </div>
                  <Textarea
                    id="incident-progress-note"
                    aria-labelledby="phase-note-heading"
                    className="min-h-28"
                    maxLength={2000}
                    disabled={progressMutation.isPending}
                    aria-invalid={Boolean(progressForm.formState.errors.note)}
                    placeholder="Explain why the incident is ready for the next phase, including results, remaining work and any validation performed."
                    {...progressForm.register("note")}
                  />
                  {progressForm.formState.errors.note ? (
                    <p className="text-danger text-sm">
                      {progressForm.formState.errors.note.message}
                    </p>
                  ) : null}
                  <p className="text-muted text-xs">
                    The system does not infer phase completion from the number
                    of recorded response actions.
                  </p>
                </section>

                {/* Section 3 — Emergency skip (optional) */}
                <section
                  aria-labelledby="phase-skip-heading"
                  className="space-y-3"
                >
                  <div className="border-border flex items-start gap-2 border-b pb-2">
                    <AlertTriangle
                      aria-hidden="true"
                      className="text-muted mt-0.5 size-4 shrink-0"
                      strokeWidth={1.8}
                    />
                    <div>
                      <h3
                        id="phase-skip-heading"
                        className="text-foreground text-sm font-semibold"
                      >
                        Emergency skip reason{" "}
                        <span className="text-muted font-normal">
                          (optional)
                        </span>
                      </h3>
                      <p className="text-muted text-xs">
                        Required when skipping phases. Recovery verification
                        cannot be skipped.
                      </p>
                    </div>
                  </div>
                  <Textarea
                    id="incident-skip-reason"
                    aria-labelledby="phase-skip-heading"
                    maxLength={2000}
                    rows={2}
                    disabled={progressMutation.isPending}
                    aria-invalid={Boolean(
                      progressForm.formState.errors.skipReason,
                    )}
                    placeholder="Explain the business or operational reason for skipping phases…"
                    {...progressForm.register("skipReason")}
                  />
                  {progressForm.formState.errors.skipReason ? (
                    <p className="text-danger text-sm">
                      {progressForm.formState.errors.skipReason.message}
                    </p>
                  ) : null}
                </section>

                {/* Section 4 — Confirm + info banner */}
                <section
                  aria-labelledby="phase-confirm-heading"
                  className="space-y-3"
                >
                  <div className="border-border flex items-start gap-2 border-b pb-2">
                    <ShieldCheck
                      aria-hidden="true"
                      className="text-brand mt-0.5 size-4 shrink-0"
                      strokeWidth={1.8}
                    />
                    <h3
                      id="phase-confirm-heading"
                      className="text-foreground text-sm font-semibold"
                    >
                      Confirm transition
                    </h3>
                  </div>
                  <label className="border-border bg-neutral-soft/30 hover:bg-neutral-soft/50 flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 text-sm transition-colors">
                    <Checkbox
                      id="incident-phase-confirm"
                      disabled={progressMutation.isPending}
                      aria-invalid={Boolean(
                        progressForm.formState.errors.confirmed,
                      )}
                      {...progressForm.register("confirmed")}
                    />
                    <span className="leading-relaxed">
                      I have assessed that the incident is ready for the
                      selected phase, with results or an emergency exception
                      documented above. When leaving Recovery, I confirm
                      affected systems/services are restored and validation
                      results are documented above.
                    </span>
                  </label>
                  {progressForm.formState.errors.confirmed ? (
                    <p className="text-danger text-sm">
                      {progressForm.formState.errors.confirmed.message}
                    </p>
                  ) : null}
                  <div className="border-border bg-neutral-soft/30 flex gap-2.5 rounded-xl border p-3.5">
                    <Info
                      aria-hidden="true"
                      className="text-muted mt-0.5 size-4 shrink-0"
                      strokeWidth={1.8}
                    />
                    <p className="text-muted text-xs">
                      Saving response actions, classification or handler
                      assignment does not change the handling phase. This is a
                      manual, audited assessment — not automated task
                      verification. This action never closes an incident.
                    </p>
                  </div>
                </section>

                {/* Footer */}
                <div className="border-border flex items-center justify-between border-t pt-4">
                  <div />
                  <div className="flex items-center gap-3">
                    <Button
                      variant="secondary"
                      onClick={closeProgress}
                      disabled={progressMutation.isPending}
                      type="button"
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={progressMutation.isPending}>
                      {progressMutation.isPending ? (
                        <>
                          <Loader2
                            aria-hidden="true"
                            className="size-4 animate-spin"
                          />
                          Saving…
                        </>
                      ) : (
                        <>
                          <GitBranch
                            aria-hidden="true"
                            className="size-4"
                            strokeWidth={1.8}
                          />
                          Save progress
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="border-border flex justify-end border-t pt-4">
                <Button
                  variant="secondary"
                  onClick={closeProgress}
                  type="button"
                >
                  Close
                </Button>
              </div>
            )}
          </form>
        ) : null}
      </Dialog>
      <Dialog
        dialogRef={classificationDialogRef}
        title="Classify incident severity"
        className="max-h-[calc(100dvh-2rem)] w-[min(44rem,calc(100%-2rem))] overflow-y-auto"
        onClose={closeClassification}
      >
        {classificationTarget ? (
          <div className="space-y-5">
            {/* Context bar */}
            <div className="border-border bg-neutral-soft/30 rounded-lg border p-3.5 text-xs">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="text-muted font-mono font-semibold">
                  {classificationTarget.incidentCode}
                </span>
                <span className="text-foreground font-semibold break-words">
                  {classificationTarget.title}
                </span>
              </div>
              {classificationTarget.description ? (
                <p className="text-muted mt-2 line-clamp-3 leading-relaxed break-words whitespace-pre-wrap">
                  {classificationTarget.description}
                </p>
              ) : null}
            </div>

            {/* Tab switcher */}
            <div
              role="tablist"
              aria-label="Incident severity views"
              className="border-border bg-surface inline-flex w-full items-center gap-1 rounded-xl border p-1 shadow-xs sm:w-auto"
            >
              {(["classification", "history"] as const).map((tab, idx) => {
                const TabIcon =
                  tab === "classification" ? ShieldAlert : History;
                return (
                  <button
                    key={tab}
                    id={`severity-${tab}-tab`}
                    type="button"
                    role="tab"
                    aria-selected={classificationTab === tab}
                    aria-controls={`severity-${tab}-panel`}
                    tabIndex={classificationTab === tab ? 0 : -1}
                    disabled={
                      tab === "classification" &&
                      classificationTarget.status === "closed"
                    }
                    className={cn(
                      "focus-visible:outline-brand inline-flex min-w-0 flex-1 items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors focus-visible:outline-2 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none",
                      classificationTab === tab
                        ? "bg-brand text-brand-contrast font-semibold shadow-xs"
                        : "text-muted hover:bg-neutral-soft hover:text-foreground",
                    )}
                    onClick={() => setClassificationTab(tab)}
                    onKeyDown={(event) => {
                      if (classificationTarget.status === "closed") return;
                      if (
                        ["ArrowLeft", "ArrowRight", "Home", "End"].includes(
                          event.key,
                        )
                      ) {
                        event.preventDefault();
                        const next =
                          event.key === "Home"
                            ? "classification"
                            : event.key === "End"
                              ? "history"
                              : tab === "history"
                                ? "classification"
                                : "history";
                        setClassificationTab(next);
                        event.currentTarget.parentElement
                          ?.querySelector<HTMLButtonElement>(
                            `#severity-${next}-tab`,
                          )
                          ?.focus();
                      }
                    }}
                  >
                    <TabIcon
                      aria-hidden="true"
                      className="size-4"
                      strokeWidth={idx === 0 ? 1.8 : 2}
                    />
                    {tab === "history" ? "History" : "Classification"}
                  </button>
                );
              })}
            </div>

            {/* History panel */}
            <div
              id="severity-history-panel"
              role="tabpanel"
              aria-labelledby="severity-history-tab"
              hidden={classificationTab !== "history"}
              className="space-y-5"
            >
              <ClassificationHistory
                key={classificationTarget.id}
                incidentId={classificationTarget.id}
              />
              <div className="border-border flex justify-end border-t pt-4">
                <Button
                  variant="secondary"
                  onClick={closeClassification}
                  type="button"
                >
                  Close
                </Button>
              </div>
            </div>

            {/* Classification panel */}
            <form
              id="severity-classification-panel"
              role="tabpanel"
              aria-labelledby="severity-classification-tab"
              hidden={classificationTab !== "classification"}
              className="space-y-6"
              noValidate
              onSubmit={classificationForm.handleSubmit(submitClassification)}
            >
              {/* Last classification info */}
              {classificationTarget.lastClassification ? (
                <div className="border-border bg-neutral-soft/30 rounded-xl border p-4">
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
                  <p className="text-muted mt-2 text-xs">
                    {classificationTarget.lastClassification.classifiedBy
                      ?.name ?? "Unknown user"}{" "}
                    ·{" "}
                    {formatDate(
                      classificationTarget.lastClassification.classifiedAt,
                    )}
                  </p>
                  {classificationTarget.lastClassification.rationale ? (
                    <p className="mt-2 text-sm leading-relaxed break-words whitespace-pre-wrap">
                      {classificationTarget.lastClassification.rationale}
                    </p>
                  ) : null}
                </div>
              ) : (
                <div className="border-border bg-neutral-soft/30 flex gap-2.5 rounded-xl border p-3.5">
                  <Info
                    aria-hidden="true"
                    className="text-muted mt-0.5 size-4 shrink-0"
                    strokeWidth={1.8}
                  />
                  <p className="text-muted text-xs">
                    Current severity:{" "}
                    <span className="text-foreground font-semibold capitalize">
                      {classificationTarget.severity}
                    </span>
                    . No separate classification rationale has been recorded
                    yet.
                  </p>
                </div>
              )}

              {/* Error alert */}
              {classificationMutation.isError ? (
                <Alert className="border-danger/25 bg-danger-soft text-danger">
                  {classificationMutation.error instanceof Error
                    ? classificationMutation.error.message
                    : "Unable to classify this incident. Review the values and try again."}
                  {classificationMutation.error instanceof ApiError &&
                  [403, 409].includes(classificationMutation.error.status)
                    ? " Close this dialog and reopen the incident from the refreshed list before trying again."
                    : null}
                </Alert>
              ) : null}

              {/* Section 1 — Severity */}
              <section
                aria-labelledby="severity-level-heading"
                className="space-y-3"
              >
                <div className="border-border flex items-start gap-2 border-b pb-2">
                  <ShieldAlert
                    aria-hidden="true"
                    className="text-brand mt-0.5 size-4 shrink-0"
                    strokeWidth={1.8}
                  />
                  <div>
                    <h3
                      id="severity-level-heading"
                      className="text-foreground text-sm font-semibold"
                    >
                      Severity level
                    </h3>
                    <p className="text-muted text-xs">
                      Select the severity that best reflects the observed impact
                      and urgency.
                    </p>
                  </div>
                </div>

                <div
                  className="grid grid-cols-2 gap-2"
                  role="radiogroup"
                  aria-labelledby="severity-level-heading"
                >
                  {(
                    [
                      {
                        value: "low",
                        label: "Low",
                        description: "Limited impact, routine response.",
                        tone: "text-success",
                        border: "border-success",
                        bg: "bg-success/5",
                      },
                      {
                        value: "medium",
                        label: "Medium",
                        description: "Contained but requires investigation.",
                        tone: "text-warning",
                        border: "border-warning",
                        bg: "bg-warning/5",
                      },
                      {
                        value: "high",
                        label: "High",
                        description: "Significant impact or active threat.",
                        tone: "text-danger",
                        border: "border-danger",
                        bg: "bg-danger/5",
                      },
                      {
                        value: "critical",
                        label: "Critical",
                        description: "Severe, widespread or urgent impact.",
                        tone: "text-danger",
                        border: "border-danger",
                        bg: "bg-danger/10",
                      },
                    ] as const
                  ).map((opt) => {
                    const isSelected =
                      classificationForm.watch("severity") === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        onClick={() =>
                          classificationForm.setValue("severity", opt.value, {
                            shouldValidate: true,
                          })
                        }
                        className={cn(
                          "focus-visible:outline-brand rounded-xl border p-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2",
                          isSelected
                            ? cn(opt.border, opt.bg, "shadow-xs")
                            : "border-border bg-surface hover:bg-neutral-soft/60",
                        )}
                      >
                        <span
                          className={cn(
                            "block text-sm font-semibold",
                            isSelected ? opt.tone : "text-foreground",
                          )}
                        >
                          {opt.label}
                        </span>
                        <span className="text-muted mt-1 block text-xs leading-snug">
                          {opt.description}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {classificationForm.formState.errors.severity ? (
                  <p className="text-danger text-sm">
                    {classificationForm.formState.errors.severity.message}
                  </p>
                ) : null}
              </section>

              {/* Section 2 — Rationale */}
              <section
                aria-labelledby="severity-rationale-heading"
                className="space-y-3"
              >
                <div className="border-border flex items-start gap-2 border-b pb-2">
                  <FileText
                    aria-hidden="true"
                    className="text-brand mt-0.5 size-4 shrink-0"
                    strokeWidth={1.8}
                  />
                  <div>
                    <h3
                      id="severity-rationale-heading"
                      className="text-foreground text-sm font-semibold"
                    >
                      Classification rationale
                    </h3>
                    <p className="text-muted text-xs">
                      Max 2,000 characters. Retained in audit history.
                    </p>
                  </div>
                </div>

                <Textarea
                  id="classification-rationale"
                  aria-labelledby="severity-rationale-heading"
                  className="min-h-28"
                  maxLength={2000}
                  placeholder="Describe the observed impact, scope, affected services and urgency supporting this severity."
                  aria-invalid={Boolean(
                    classificationForm.formState.errors.rationale,
                  )}
                  {...classificationForm.register("rationale")}
                />
                {classificationForm.formState.errors.rationale ? (
                  <p className="text-danger text-sm">
                    {classificationForm.formState.errors.rationale.message}
                  </p>
                ) : null}

                {/* Info banner */}
                <div className="border-border bg-neutral-soft/30 flex gap-2.5 rounded-xl border p-3.5">
                  <Info
                    aria-hidden="true"
                    className="text-muted mt-0.5 size-4 shrink-0"
                    strokeWidth={1.8}
                  />
                  <p className="text-muted text-xs">
                    Classification prioritizes response; it does not assign the
                    incident or change its workflow status.
                  </p>
                </div>
              </section>

              {/* Footer */}
              <div className="border-border flex items-center justify-between border-t pt-4">
                <div />
                <div className="flex items-center gap-3">
                  <Button
                    variant="secondary"
                    onClick={closeClassification}
                    type="button"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      classificationMutation.isPending ||
                      classificationTarget.status === "closed" ||
                      (classificationMutation.error instanceof ApiError &&
                        [403, 409].includes(
                          classificationMutation.error.status,
                        ))
                    }
                  >
                    {classificationMutation.isPending ? (
                      <>
                        <Loader2
                          aria-hidden="true"
                          className="size-4 animate-spin"
                        />
                        Saving…
                      </>
                    ) : (
                      <>
                        <ShieldAlert
                          aria-hidden="true"
                          className="size-4"
                          strokeWidth={1.8}
                        />
                        Save classification
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        ) : null}
      </Dialog>
      <Dialog
        dialogRef={detailDialogRef}
        title="Incident details"
        className="max-h-[calc(100dvh-2rem)] w-[min(52rem,calc(100%-2rem))] overflow-y-auto"
        onClose={() => setSelectedId(undefined)}
      >
        {detail.isPending ? (
          <div role="status" aria-busy="true" className="space-y-4">
            <span className="sr-only">Loading incident details</span>
            <div className="bg-neutral-soft/60 h-20 animate-pulse rounded-xl" />
            <div className="grid gap-3 sm:grid-cols-4">
              <div className="bg-neutral-soft/60 h-14 animate-pulse rounded-xl" />
              <div className="bg-neutral-soft/60 h-14 animate-pulse rounded-xl" />
              <div className="bg-neutral-soft/60 h-14 animate-pulse rounded-xl" />
              <div className="bg-neutral-soft/60 h-14 animate-pulse rounded-xl" />
            </div>
            <div className="bg-neutral-soft/60 h-32 animate-pulse rounded-xl" />
            <div className="bg-neutral-soft/60 h-24 animate-pulse rounded-xl" />
          </div>
        ) : detail.isError ? (
          <div className="space-y-5">
            <Alert className="border-danger/25 bg-danger-soft text-danger">
              Unable to load this incident report.
            </Alert>
            <div className="flex items-center justify-between border-t border-border pt-4">
              <div />
              <div className="flex items-center gap-3">
                <Button
                  variant="secondary"
                  onClick={() => void detail.refetch()}
                  type="button"
                >
                  Try again
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setSelectedId(undefined)}
                  type="button"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        ) : detail.data ? (
          <div className="space-y-6">
            {/* Context bar */}
            <div className="border-border bg-neutral-soft/30 rounded-lg border p-3.5 text-xs">
              <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="font-mono font-semibold text-muted">
                      {detail.data.incidentCode}
                    </span>
                    <span className="text-foreground font-semibold break-words text-sm">
                      {detail.data.title}
                    </span>
                  </div>
                </div>
                <StatusBadge tone={incidentStatus(detail.data.status).tone}>
                  {incidentStatus(detail.data.status).label}
                </StatusBadge>
              </div>
              <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1">
                <span className="text-muted">
                  Handler:{" "}
                  <span className="font-medium text-foreground">
                    {detail.data.currentAssignment?.assignee.name ?? "Unassigned"}
                  </span>
                </span>
                <span className="text-muted">
                  Reported:{" "}
                  <span className="font-medium text-foreground">
                    {formatDate(detail.data.createdAt)}
                  </span>
                </span>
                {detail.data.createdBy ? (
                  <span className="text-muted">
                    Reported by:{" "}
                    <span className="font-medium text-foreground">
                      {detail.data.createdBy.name}
                    </span>
                  </span>
                ) : null}
              </div>
            </div>

            {/* Key metrics strip */}
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="border-border bg-surface rounded-xl border p-3">
                <dt className="text-muted text-xs">Severity</dt>
                <dd className="mt-1 text-sm font-semibold capitalize">
                  {detail.data.severity ?? "Not set"}
                </dd>
              </div>
              <div className="border-border bg-surface rounded-xl border p-3">
                <dt className="text-muted text-xs">Occurred</dt>
                <dd className="mt-1 text-sm font-semibold">
                  {detail.data.occurredAt
                    ? formatDate(detail.data.occurredAt)
                    : "Not specified"}
                </dd>
              </div>
              <div className="border-border bg-surface rounded-xl border p-3">
                <dt className="text-muted text-xs">Detected</dt>
                <dd className="mt-1 text-sm font-semibold">
                  {detail.data.detectedAt
                    ? formatDate(detail.data.detectedAt)
                    : "Not recorded"}
                </dd>
              </div>
              <div className="border-border bg-surface rounded-xl border p-3">
                <dt className="text-muted text-xs">Phase</dt>
                <dd className="mt-1 text-sm font-semibold capitalize">
                  {incidentStatus(detail.data.status).label}
                </dd>
              </div>
            </dl>

            {/* Description */}
            <section aria-labelledby="detail-description-heading" className="space-y-3">
              <div className="flex items-start gap-2 border-b border-border pb-2">
                <FileText
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0 text-brand"
                  strokeWidth={1.8}
                />
                <h3
                  id="detail-description-heading"
                  className="text-sm font-semibold text-foreground"
                >
                  Description
                </h3>
              </div>
              <p className="text-muted leading-6 break-words whitespace-pre-wrap text-sm">
                {detail.data.description ?? "No description provided."}
              </p>
            </section>

            {/* Origin traceability */}
            {detail.data.source ? (
              <section aria-labelledby="detail-source-heading" className="space-y-3">
                <div className="flex items-start gap-2 border-b border-border pb-2">
                  <Link2
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 text-brand"
                    strokeWidth={1.8}
                  />
                  <h3
                    id="detail-source-heading"
                    className="text-sm font-semibold text-foreground"
                  >
                    Origin traceability
                  </h3>
                </div>
                <div className="border-border bg-neutral-soft/30 rounded-xl border p-3.5">
                  <p className="text-muted text-xs">
                    Finding{" "}
                    <span className="font-mono text-foreground">
                      {detail.data.source.findingId}
                    </span>{" "}
                    Â· Alert{" "}
                    <span className="font-mono text-foreground">
                      {detail.data.source.alertId}
                    </span>
                  </p>
                  <p className="mt-1 text-sm font-medium break-words">
                    {detail.data.source.title}
                  </p>
                </div>
              </section>
            ) : null}

            {/* Affected assets */}
            <section aria-labelledby="affected-assets-heading" className="space-y-3">
              <div className="flex items-start gap-2 border-b border-border pb-2">
                <ShieldAlert
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0 text-brand"
                  strokeWidth={1.8}
                />
                <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
                  <h3
                    id="affected-assets-heading"
                    className="text-sm font-semibold text-foreground"
                  >
                    Affected assets
                  </h3>
                  <span className="text-muted text-xs tabular-nums">
                    {detail.data.affectedAssets.length} linked
                  </span>
                </div>
              </div>
              {detail.data.affectedAssets.length ? (
                <ul className="space-y-2">
                  {detail.data.affectedAssets.map((asset) => (
                    <li
                      className="border-border bg-surface flex flex-col gap-2 rounded-xl border p-3.5 sm:flex-row sm:items-center sm:justify-between"
                      key={asset.id}
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium break-words">
                          {asset.name}
                        </p>
                        <p className="text-muted mt-0.5 text-xs break-words">
                          <span className="font-mono">{asset.assetCode}</span>{" "}
                          Â· {asset.assetType}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {asset.criticality ? (
                          <StatusBadge
                            tone={severityTone(asset.criticality.toLowerCase())}
                          >
                            {formatWorkflowLabel(
                              asset.criticality.toLowerCase(),
                            )}
                          </StatusBadge>
                        ) : null}
                        <span className="text-muted text-xs">
                          Linked {formatDate(asset.linkedAt)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="border-border bg-neutral-soft/30 rounded-xl border p-5 text-center">
                  <ShieldAlert
                    aria-hidden="true"
                    className="text-muted mx-auto mb-2 size-7"
                    strokeWidth={1.5}
                  />
                  <p className="text-sm font-medium text-foreground">
                    No affected assets
                  </p>
                  <p className="text-muted mt-0.5 text-xs">
                    No assets have been linked to this incident.
                  </p>
                </div>
              )}
            </section>

            {/* Investigation context */}
            <section
              aria-labelledby="linked-context-heading"
              className="space-y-3"
            >
              <div className="flex items-start gap-2 border-b border-border pb-2">
                <Eye
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0 text-brand"
                  strokeWidth={1.8}
                />
                <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
                  <h3
                    id="linked-context-heading"
                    className="text-sm font-semibold text-foreground"
                  >
                    Investigation context
                  </h3>
                  <span className="text-muted text-xs">Read-only</span>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <ContextList
                  title="Linked controls"
                  empty="No controls linked."
                  items={detail.data.linkedControls.map(
                    (item) => `${item.controlCode} Â· ${item.name}`,
                  )}
                />
                <ContextList
                  title="Linked risks"
                  empty="No existing risks linked."
                  items={detail.data.linkedRisks.map(
                    (item) => `${item.riskCode} Â· ${item.title}`,
                  )}
                />
                <ContextList
                  title="Control weaknesses"
                  empty="No control weaknesses recorded."
                  items={detail.data.controlWeaknesses.map(
                    (item) =>
                      `${item.control.control_code} Â· ${item.description}`,
                  )}
                />
                <ContextList
                  title="Risk reassessment requests"
                  empty="No reassessment requests recorded."
                  items={detail.data.riskReassessmentRequests.map(
                    (item) => `${item.risk.risk_code} Â· ${item.status}`,
                  )}
                />
              </div>
            </section>

            {/* Response actions */}
            <section aria-labelledby="response-actions-heading" className="space-y-3">
              <div className="flex items-start gap-2 border-b border-border pb-2">
                <GitBranch
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0 text-brand"
                  strokeWidth={1.8}
                />
                <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
                  <h3
                    id="response-actions-heading"
                    className="text-sm font-semibold text-foreground"
                  >
                    Response actions
                  </h3>
                  <span className="text-muted text-xs tabular-nums">
                    {detail.data.responseActions.length} recorded
                  </span>
                </div>
              </div>
              {detail.data.responseActions.length ? (
                <ol className="space-y-2">
                  {detail.data.responseActions.map((action) => (
                    <li
                      className="border-border bg-surface rounded-xl border p-3.5"
                      key={action.id}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <StatusBadge tone="info">
                          {formatWorkflowLabel(action.phase)}
                        </StatusBadge>
                        <time
                          className="text-muted text-xs"
                          dateTime={action.performedAt}
                        >
                          {formatDate(action.performedAt)}
                        </time>
                      </div>
                      <p className="mt-2.5 text-sm leading-6 break-words whitespace-pre-wrap">
                        {action.description}
                      </p>
                      <p className="text-muted mt-1.5 text-xs">
                        Performed by{" "}
                        <span className="font-medium text-foreground">
                          {action.performedBy?.name ?? "Unknown user"}
                        </span>
                      </p>
                    </li>
                  ))}
                </ol>
              ) : (
                <div className="border-border bg-neutral-soft/30 rounded-xl border p-5 text-center">
                  <GitBranch
                    aria-hidden="true"
                    className="text-muted mx-auto mb-2 size-7"
                    strokeWidth={1.5}
                  />
                  <p className="text-sm font-medium text-foreground">
                    No response actions yet
                  </p>
                  <p className="text-muted mt-0.5 text-xs">
                    Actions recorded during handling phases will appear here.
                  </p>
                </div>
              )}
            </section>

            {/* Handling history */}
            <section aria-labelledby="handling-history-heading" className="space-y-3">
              <div className="flex items-start gap-2 border-b border-border pb-2">
                <History
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0 text-brand"
                  strokeWidth={2}
                />
                <h3
                  id="handling-history-heading"
                  className="text-sm font-semibold text-foreground"
                >
                  Handling history
                </h3>
              </div>
              <ol className="border-border space-y-0 border-l pl-4">
                {detail.data.handlingHistory.map((event) => (
                  <li className="relative pb-4 last:pb-0" key={event.id}>
                    <span
                      aria-hidden="true"
                      className="border-surface bg-brand absolute top-1.5 -left-[1.3rem] size-2 rounded-full border-2"
                    />
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium break-words">
                          {event.description}
                        </p>
                        <p className="text-muted text-xs">
                          {event.phase
                            ? formatWorkflowLabel(event.phase)
                            : formatWorkflowLabel(event.type)}
                          {event.actor ? ` Â· ${event.actor.name}` : ""}
                        </p>
                      </div>
                      <time
                        className="text-muted shrink-0 text-xs"
                        dateTime={event.occurredAt}
                      >
                        {formatDate(event.occurredAt)}
                      </time>
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            {/* Related records */}
            <section aria-labelledby="related-records-heading" className="space-y-3">
              <div className="flex items-start gap-2 border-b border-border pb-2">
                <Paperclip
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0 text-brand"
                  strokeWidth={1.8}
                />
                <h3
                  id="related-records-heading"
                  className="text-sm font-semibold text-foreground"
                >
                  Related records
                </h3>
              </div>
              <dl className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                {Object.entries(detail.data.relatedCounts).map(
                  ([label, count]) => (
                    <div
                      className="border-border bg-surface rounded-xl border p-3"
                      key={label}
                    >
                      <dt className="text-muted text-xs capitalize">{label}</dt>
                      <dd className="mt-1 text-lg font-semibold tabular-nums">
                        {count}
                      </dd>
                    </div>
                  ),
                )}
              </dl>
            </section>

            {/* Footer */}
            <div className="flex justify-end border-t border-border pt-4">
              <Button
                variant="secondary"
                onClick={() => setSelectedId(undefined)}
                type="button"
              >
                Close
              </Button>
            </div>
          </div>
        ) : null}
      </Dialog>
      <LinkIncidentAssetDialog
        incident={assetLinkTarget}
        onClose={() => setAssetLinkTarget(undefined)}
      />
      <LinkIncidentControlDialog
        incident={controlLinkTarget}
        onClose={() => setControlLinkTarget(undefined)}
      />
      <LinkIncidentRiskDialog
        incident={riskLinkTarget}
        onClose={() => setRiskLinkTarget(undefined)}
      />
      <RecordControlWeaknessDialog
        incident={controlWeaknessTarget}
        onClose={() => setControlWeaknessTarget(undefined)}
      />
      <CreateRiskReassessmentRequestDialog
        incident={riskReassessmentTarget}
        onClose={() => setRiskReassessmentTarget(undefined)}
      />
      <RecordEradicationActionDialog
        incident={eradicationTarget}
        onClose={() => setEradicationTarget(undefined)}
      />
      <RecordRecoveryActionDialog
        incident={recoveryTarget}
        onClose={() => setRecoveryTarget(undefined)}
      />
      <RecordContainmentActionDialog
        incident={containmentTarget}
        onClose={() => setContainmentTarget(undefined)}
      />
      <RootCauseAnalysisDialog
        incident={rootCauseTarget}
        onClose={() => setRootCauseTarget(undefined)}
      />
      <CloseIncidentDialog
        incident={closeIncidentTarget}
        onClose={() => setCloseIncidentTarget(undefined)}
      />
    </>
  );
}
