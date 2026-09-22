"use client";
import { Ban, Eye, ListChecks, Pencil, Search, X } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/data-display/data-table";
import { Pagination } from "@/components/data-display/pagination";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { useSessionUser } from "@/features/auth";
import { useRiskAssessments } from "../hooks/use-risk-assessments";
import {
  riskListQuerySchema,
  type RiskListItem,
  type RiskListQuery,
} from "../schemas/risk-list-schema";
import { RiskAssessmentDetailDialog } from "./risk-assessment-detail-dialog";
import { CreateRiskAssessmentDialog } from "./create-risk-assessment-dialog";
import { EditRiskAssessmentDialog } from "./edit-risk-assessment-dialog";
import { CancelRiskAssessmentDialog } from "./cancel-risk-assessment-dialog";

const levelLabels = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
} as const;
const statusLabels = {
  draft: "Draft",
  pending_approval: "Pending approval",
  approved: "Approved",
  in_treatment: "In treatment",
  closed: "Closed",
  rejected: "Rejected",
  cancelled: "Cancelled",
} as const;
const tone = {
  low: "bg-neutral-soft text-muted",
  medium: "bg-info-soft text-info",
  high: "bg-warning-soft text-warning",
  critical: "bg-danger-soft text-danger",
} as const;
const columns: readonly DataTableColumn<RiskListItem>[] = [
  {
    key: "risk",
    header: "Risk",
    cell: (risk) => (
      <span>
        <span className="block max-w-72 font-medium">{risk.title}</span>
        <span className="text-muted text-xs">{risk.riskCode}</span>
      </span>
    ),
  },
  {
    key: "target",
    header: "Target",
    cell: (risk) => (
      <span>
        <span className="block font-medium">{risk.target.name}</span>
        <span className="text-muted text-xs">
          {risk.target.code}
          {risk.target.type === "asset" && risk.target.deleted
            ? " · Deleted"
            : ""}
        </span>
      </span>
    ),
  },
  {
    key: "score",
    header: "Score",
    cell: (risk) => (
      <span
        className={`inline-flex min-w-9 justify-center rounded-lg px-2 py-1 font-semibold ${tone[risk.riskLevel]}`}
      >
        {risk.riskScore}
      </span>
    ),
  },
  {
    key: "level",
    header: "Level",
    cell: (risk) => levelLabels[risk.riskLevel],
  },
  {
    key: "status",
    header: "Status",
    cell: (risk) => (
      <span className="bg-neutral-soft rounded-full px-2.5 py-1 text-xs font-medium">
        {statusLabels[risk.status]}
      </span>
    ),
  },
  {
    key: "assessor",
    header: "Assessed by",
    cell: (risk) =>
      risk.assessedBy
        ? `${risk.assessedBy.fullName}${risk.assessedBy.deleted ? " (Inactive)" : ""}`
        : "Unassigned",
  },
  {
    key: "date",
    header: "Assessed",
    cell: (risk) =>
      risk.assessedAt
        ? new Intl.DateTimeFormat("en-GB").format(new Date(risk.assessedAt))
        : "Not assessed",
  },
  {
    key: "plan",
    header: "Treatment",
    cell: (risk) => (risk.hasTreatmentPlan ? "Plan created" : "No plan"),
  },
];

function fromParams(params: URLSearchParams): RiskListQuery {
  const parsed = riskListQuerySchema.safeParse(
    Object.fromEntries(params.entries()),
  );
  return parsed.success ? parsed.data : riskListQuerySchema.parse({});
}

export function RiskAssessmentsShell() {
  const router = useRouter();
  const params = useSearchParams();
  const query = useMemo(() => fromParams(params), [params]);
  const session = useSessionUser();
  const canRead = session.data?.permissions.includes("risks.read") ?? false;
  const canCreate = session.data?.permissions.includes("risks.create") ?? false;
  const canUpdate = session.data?.permissions.includes("risks.update") ?? false;
  const canCancel = session.data?.permissions.includes("risks.cancel") ?? false;
  const isAdmin =
    session.data?.roles.some(({ code }) => code === "ADMIN") ?? false;
  const risks = useRiskAssessments(query, canRead);
  const [search, setSearch] = useState(query.q ?? "");
  const [riskLevel, setRiskLevel] = useState(query.riskLevel ?? "");
  const [status, setStatus] = useState(query.status ?? "");
  const [targetType, setTargetType] = useState(query.targetType ?? "");
  const [treatment, setTreatment] = useState(query.hasTreatmentPlan ?? "");
  const [from, setFrom] = useState(query.assessedFrom ?? "");
  const [to, setTo] = useState(query.assessedTo ?? "");
  const [sort, setSort] = useState(`${query.sortBy}:${query.sortOrder}`);
  const [dateError, setDateError] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [cancellingRisk, setCancellingRisk] = useState<RiskListItem | null>(
    null,
  );
  const tableColumns = useMemo<readonly DataTableColumn<RiskListItem>[]>(
    () => [
      ...columns,
      {
        key: "actions",
        header: "Actions",
        cell: (risk) => (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              aria-label={`View ${risk.riskCode} details`}
              onClick={() => setSelectedId(risk.id)}
            >
              <Eye className="size-4" aria-hidden="true" />
              View
            </Button>
            {canUpdate &&
            (isAdmin || risk.assessedBy?.id === session.data?.id) &&
            ["draft", "rejected"].includes(risk.status) ? (
              <Button
                type="button"
                variant="secondary"
                aria-label={`Edit ${risk.riskCode}`}
                onClick={() => setEditingId(risk.id)}
              >
                <Pencil className="size-4" aria-hidden="true" />
                Edit
              </Button>
            ) : null}
            {canCancel &&
            !risk.hasTreatmentPlan &&
            (isAdmin || risk.assessedBy?.id === session.data?.id) &&
            ["draft", "rejected"].includes(risk.status) ? (
              <Button
                type="button"
                variant="danger"
                aria-label={`Cancel ${risk.riskCode}`}
                onClick={() => setCancellingRisk(risk)}
              >
                <Ban className="size-4" aria-hidden="true" />
                Cancel
              </Button>
            ) : null}
          </div>
        ),
      },
    ],
    [canCancel, canUpdate, isAdmin, session.data?.id],
  );
  const navigate = (next: Partial<RiskListQuery>): void => {
    const nextParams = new URLSearchParams();
    Object.entries({ ...query, ...next }).forEach(([key, value]) => {
      if (value !== undefined && value !== "")
        nextParams.set(key, String(value));
    });
    router.push(`/risks?${nextParams.toString()}`);
  };
  const submit = (event: FormEvent): void => {
    event.preventDefault();
    if (from && to && from > to) {
      setDateError("From date must be on or before to date.");
      return;
    }
    setDateError("");
    navigate({
      page: 1,
      q: search.trim() || undefined,
      riskLevel: riskLevel
        ? (riskLevel as RiskListQuery["riskLevel"])
        : undefined,
      status: status ? (status as RiskListQuery["status"]) : undefined,
      targetType: targetType
        ? (targetType as RiskListQuery["targetType"])
        : undefined,
      hasTreatmentPlan: treatment ? (treatment as "true" | "false") : undefined,
      assessedFrom: from || undefined,
      assessedTo: to || undefined,
      sortBy: sort.split(":")[0] as RiskListQuery["sortBy"],
      sortOrder: sort.split(":")[1] as RiskListQuery["sortOrder"],
    });
  };
  const clear = (): void => {
    setSearch("");
    setRiskLevel("");
    setStatus("");
    setTargetType("");
    setTreatment("");
    setFrom("");
    setTo("");
    setSort("updatedAt:desc");
    setDateError("");
    router.push("/risks");
  };
  if (session.isPending)
    return (
      <p className="text-muted py-10 text-center">
        Checking access permissions…
      </p>
    );
  if (!canRead)
    return (
      <Alert>
        <strong className="block">
          You do not have permission to view risk assessments
        </strong>
        <span>
          Contact an administrator if you need the risks.read permission.
        </span>
      </Alert>
    );
  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-[-0.025em] sm:text-3xl">
              Risk Assessments
            </h1>
            <p className="text-muted mt-1 text-sm">
              Review inherent risk, assessment ownership, and treatment
              coverage.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {(session.data?.permissions.includes("risk-treatment-plans.read") ??
          false) ? (
            <Link
              className="border-border bg-surface hover:bg-neutral-soft focus-visible:outline-brand inline-flex min-h-10 items-center gap-2 rounded-lg border px-3.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
              href="/risks/treatment-plans"
            >
              <ListChecks
                className="size-4"
                strokeWidth={1.8}
                aria-hidden="true"
              />{" "}
              Treatment plans
            </Link>
          ) : null}
          {canCreate ? <CreateRiskAssessmentDialog /> : null}
        </div>
      </header>
      <section className="border-border bg-surface overflow-hidden rounded-xl border">
        <div className="border-border border-b px-5 py-4">
          <h2 className="font-semibold">Risk Register</h2>
          <p className="text-muted mt-1 text-sm">
            {risks.data
              ? `${risks.data.pagination.total} matching assessments`
              : "Loading data"}
          </p>
        </div>
        <form
          aria-label="Risk assessment filters"
          className="border-border grid gap-3 border-b p-4 lg:grid-cols-4"
          onSubmit={submit}
        >
          <div className="relative lg:col-span-2">
            <label className="sr-only" htmlFor="risk-search">
              Search risks
            </label>
            <Search
              className="text-muted absolute top-3 left-3 size-4"
              aria-hidden="true"
            />
            <input
              id="risk-search"
              className="border-border bg-background min-h-10 w-full rounded-lg border pr-10 pl-9 text-sm"
              maxLength={100}
              placeholder="Risk code, title, target, or assessor"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            {search ? (
              <button
                type="button"
                aria-label="Clear search"
                className="text-muted absolute top-1 right-1 grid size-8 place-items-center"
                onClick={() => setSearch("")}
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            ) : null}
          </div>
          <Select
            aria-label="Risk level"
            value={riskLevel}
            onChange={(event) => setRiskLevel(event.target.value)}
          >
            <option value="">All risk levels</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </Select>
          <Select
            aria-label="Status"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="">All statuses</option>
            <option value="draft">Draft</option>
            <option value="pending_approval">Pending approval</option>
            <option value="approved">Approved</option>
            <option value="in_treatment">In treatment</option>
            <option value="closed">Closed</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </Select>
          <Select
            aria-label="Target type"
            value={targetType}
            onChange={(event) => setTargetType(event.target.value)}
          >
            <option value="">All target types</option>
            <option value="asset">Asset</option>
            <option value="business_process">Business process</option>
          </Select>
          <Select
            aria-label="Treatment plan"
            value={treatment}
            onChange={(event) => setTreatment(event.target.value)}
          >
            <option value="">Any treatment status</option>
            <option value="true">Has treatment plan</option>
            <option value="false">No treatment plan</option>
          </Select>
          <input
            aria-label="Assessed from"
            className="border-border bg-background min-h-10 rounded-lg border px-3 text-sm"
            type="date"
            value={from}
            onChange={(event) => setFrom(event.target.value)}
          />
          <input
            aria-label="Assessed to"
            className="border-border bg-background min-h-10 rounded-lg border px-3 text-sm"
            type="date"
            value={to}
            onChange={(event) => setTo(event.target.value)}
          />
          <Select
            aria-label="Sort risk assessments"
            value={sort}
            onChange={(event) => setSort(event.target.value)}
          >
            <option value="updatedAt:desc">Recently updated</option>
            <option value="assessedAt:desc">Newest assessments</option>
            <option value="riskScore:desc">Highest score</option>
            <option value="riskScore:asc">Lowest score</option>
            <option value="riskCode:asc">Risk code A–Z</option>
          </Select>
          <div className="flex gap-2 lg:col-span-4 lg:justify-end">
            <Button type="submit">Apply filters</Button>
            <Button type="button" variant="secondary" onClick={clear}>
              <X className="size-4" aria-hidden="true" />
              Clear
            </Button>
          </div>
          {dateError ? (
            <p className="text-danger text-sm lg:col-span-4" role="alert">
              {dateError}
            </p>
          ) : null}
        </form>
        <div className="p-4">
          {risks.isPending ? (
            <p className="text-muted py-10 text-center">
              Loading risk assessments…
            </p>
          ) : null}
          {risks.isError ? (
            <Alert>
              <strong className="block">Unable to load risk assessments</strong>
              <span>
                Check your login and backend connection, then try again.
              </span>
            </Alert>
          ) : null}
          {risks.data ? (
            <DataTable
              columns={tableColumns}
              rows={risks.data.items}
              getRowKey={(risk) => risk.id}
            />
          ) : null}
        </div>
        {risks.data ? (
          <div className="border-border border-t p-4">
            <Pagination
              page={risks.data.pagination.page}
              pageCount={risks.data.pagination.totalPages}
              onPageChange={(page) => navigate({ page })}
            />
          </div>
        ) : null}
      </section>
      <RiskAssessmentDetailDialog
        id={selectedId}
        onClose={() => setSelectedId(null)}
      />
      <EditRiskAssessmentDialog
        id={editingId}
        onClose={() => setEditingId(null)}
      />
      <CancelRiskAssessmentDialog
        risk={cancellingRisk}
        onClose={() => setCancellingRisk(null)}
      />
    </div>
  );
}
