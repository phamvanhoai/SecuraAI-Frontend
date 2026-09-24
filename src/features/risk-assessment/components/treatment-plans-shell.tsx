"use client";

import { ArrowLeft, CalendarClock, Eye, Plus, Search, X } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
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
import { DashboardLoadingSkeleton } from "@/components/feedback/loading-skeletons";
import { FormField } from "@/components/forms/form-field";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useSessionUser } from "@/features/authentication-account";
import { useTreatmentPlans } from "../hooks/use-treatment-plans";
import { CreateTreatmentPlanEntry } from "./create-treatment-plan-entry";
import {
  treatmentPlanListQuerySchema,
  type TreatmentPlanListItem,
  type TreatmentPlanListQuery,
} from "../schemas/treatment-plan-list-schema";

const strategyLabels = {
  avoid: "Avoid",
  mitigate: "Mitigate",
  transfer: "Transfer",
  accept: "Accept",
} as const;
const statusLabels = {
  draft: "Draft",
  pending_approval: "Pending approval",
  approved: "Approved",
  in_progress: "In progress",
  completed: "Completed",
  rejected: "Rejected",
  cancelled: "Cancelled",
} as const;
const statusTones = {
  draft: "neutral",
  pending_approval: "warning",
  approved: "info",
  in_progress: "info",
  completed: "success",
  rejected: "danger",
  cancelled: "neutral",
} as const;

const columns: readonly DataTableColumn<TreatmentPlanListItem>[] = [
  {
    key: "risk",
    header: "Risk",
    cell: (plan) => (
      <span className="block min-w-52">
        <span className="block max-w-72 font-medium">{plan.risk.title}</span>
        <span className="text-muted text-xs">{plan.risk.riskCode}</span>
      </span>
    ),
  },
  {
    key: "strategy",
    header: "Strategy",
    cell: (plan) => strategyLabels[plan.strategy],
  },
  {
    key: "owner",
    header: "Owner",
    cell: (plan) =>
      plan.owner
        ? `${plan.owner.fullName}${plan.owner.inactive ? " (Inactive)" : ""}`
        : "Unassigned",
  },
  {
    key: "status",
    header: "Status",
    cell: (plan) => (
      <StatusBadge tone={statusTones[plan.status]}>
        {statusLabels[plan.status]}
      </StatusBadge>
    ),
  },
  {
    key: "progress",
    header: "Progress",
    cell: (plan) =>
      plan.progressPercent === null ? (
        <span className="text-muted">Not applicable</span>
      ) : (
        <span className="block min-w-32">
          <span className="mb-1 flex justify-between gap-3 text-xs">
            <span>{plan.progressPercent}%</span>
            <span className="text-muted">
              {plan.completedActions}/{plan.totalActions} completed
            </span>
          </span>
          <span className="text-muted mb-1 block text-[11px]">
            {plan.inProgressActions} in progress · {plan.pendingActions} pending
          </span>
          <span
            aria-label={`${plan.progressPercent}% complete`}
            aria-valuemax={100}
            aria-valuemin={0}
            aria-valuenow={plan.progressPercent}
            className="bg-neutral-soft block h-1.5 overflow-hidden rounded-full"
            role="progressbar"
          >
            <span
              className="bg-brand block h-full rounded-full"
              style={{ width: `${plan.progressPercent}%` }}
            />
          </span>
        </span>
      ),
  },
  {
    key: "targetDate",
    header: "Target date",
    cell: (plan) => (
      <span>
        <span className="block">
          {plan.targetDate
            ? new Intl.DateTimeFormat("en-GB").format(new Date(plan.targetDate))
            : "Not set"}
        </span>
        {plan.isOverdue ? (
          <span className="text-danger text-xs font-medium">Overdue</span>
        ) : null}
        {plan.overdueActions > 0 ? (
          <span className="text-danger block text-xs font-medium">
            {plan.overdueActions} overdue action{plan.overdueActions === 1 ? "" : "s"}
          </span>
        ) : null}
      </span>
    ),
  },
  {
    key: "updatedAt",
    header: "Updated",
    cell: (plan) =>
      new Intl.DateTimeFormat("en-GB").format(new Date(plan.updatedAt)),
  },
  {
    key: "actions",
    header: "Actions",
    cell: (plan) => (
      <Link
        className="border-border hover:bg-neutral-soft inline-flex min-h-9 items-center gap-2 rounded-lg border px-3 text-sm font-medium"
        href={`/risks/treatment-plans/${plan.id}`}
      >
        <Eye className="size-4" aria-hidden="true" /> View
      </Link>
    ),
  },
];

function queryFromParams(parameters: URLSearchParams): TreatmentPlanListQuery {
  const parsed = treatmentPlanListQuerySchema.safeParse(
    Object.fromEntries(parameters.entries()),
  );
  return parsed.success ? parsed.data : treatmentPlanListQuerySchema.parse({});
}

export function TreatmentPlansShell() {
  const router = useRouter();
  const parameters = useSearchParams();
  const query = useMemo(() => queryFromParams(parameters), [parameters]);
  const session = useSessionUser();
  const canRead =
    session.data?.permissions.includes("risk-treatment-plans.read") ?? false;
  const canCreate =
    session.data?.permissions.includes("risk-treatment-plans.create") ?? false;
  const plans = useTreatmentPlans(query, canRead);
  const [search, setSearch] = useState(query.q ?? "");
  const [status, setStatus] = useState(query.status ?? "");
  const [strategy, setStrategy] = useState(query.strategy ?? "");
  const [ownership, setOwnership] = useState(query.ownerId ? "mine" : "");
  const [overdue, setOverdue] = useState(query.overdue ?? "");
  const [targetFrom, setTargetFrom] = useState(query.targetFrom ?? "");
  const [targetTo, setTargetTo] = useState(query.targetTo ?? "");
  const [sort, setSort] = useState(`${query.sortBy}:${query.sortOrder}`);
  const [dateError, setDateError] = useState("");
  const [creating, setCreating] = useState(false);

  const navigate = (next: Partial<TreatmentPlanListQuery>): void => {
    const nextParameters = new URLSearchParams();
    Object.entries({ ...query, ...next }).forEach(([key, value]) => {
      if (value !== undefined && value !== "")
        nextParameters.set(key, String(value));
    });
    router.push(`/risks/treatment-plans?${nextParameters.toString()}`);
  };
  const submit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (targetFrom && targetTo && targetFrom > targetTo) {
      setDateError("From date must be on or before to date.");
      return;
    }
    setDateError("");
    const [sortBy, sortOrder] = sort.split(":");
    navigate({
      page: 1,
      q: search.trim() || undefined,
      status: status ? (status as TreatmentPlanListQuery["status"]) : undefined,
      strategy: strategy
        ? (strategy as TreatmentPlanListQuery["strategy"])
        : undefined,
      ownerId:
        ownership === "mine" && session.data?.id ? session.data.id : undefined,
      overdue: overdue
        ? (overdue as TreatmentPlanListQuery["overdue"])
        : undefined,
      targetFrom: targetFrom || undefined,
      targetTo: targetTo || undefined,
      sortBy: sortBy as TreatmentPlanListQuery["sortBy"],
      sortOrder: sortOrder as TreatmentPlanListQuery["sortOrder"],
    });
  };
  const clear = (): void => {
    setSearch("");
    setStatus("");
    setStrategy("");
    setOwnership("");
    setOverdue("");
    setTargetFrom("");
    setTargetTo("");
    setSort("updatedAt:desc");
    setDateError("");
    router.push("/risks/treatment-plans");
  };

  if (session.isPending) return <DashboardLoadingSkeleton variant="table" />;
  if (!canRead)
    return (
      <Alert>
        <strong className="block">
          You do not have permission to view treatment plans
        </strong>
        <span>
          Contact an administrator if you need the risk-treatment-plans.read
          permission.
        </span>
      </Alert>
    );

  return (
    <>
      <ProductPageHeader
        title="Risk Treatment Plans"
        description="Review treatment ownership, deadlines, approval state, and action progress."
        showSampleNotice={false}
        additionalActions={
          <div className="flex flex-wrap gap-2">
            {canCreate ? (
              <Button type="button" onClick={() => setCreating(true)}>
                <Plus className="size-4" aria-hidden="true" /> Create treatment plan
              </Button>
            ) : null}
            <Link
              className="border-border bg-surface hover:bg-neutral-soft focus-visible:outline-brand inline-flex min-h-10 items-center gap-2 rounded-lg border px-3.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
              href="/risks"
            >
              <ArrowLeft className="size-4" strokeWidth={1.8} aria-hidden="true" /> Risk assessments
            </Link>
          </div>
        }
      />
      <CreateTreatmentPlanEntry open={creating} onClose={() => setCreating(false)} />
      <ProductPanel
        title="Treatment Plan Register"
        description={
          plans.data
            ? `${plans.data.pagination.total} matching treatment plans`
            : "Search and filter treatment plans"
        }
      >
        <form
          aria-label="Treatment plan filters"
          className="border-border grid gap-4 border-b p-4 md:grid-cols-2 xl:grid-cols-4"
          onSubmit={submit}
        >
          <div className="relative md:col-span-2">
            <FormField id="treatment-search" label="Search">
              <Search
                className="text-muted absolute top-10 left-3 size-4"
                aria-hidden="true"
              />
              <Input
                id="treatment-search"
                className="pr-10 pl-9"
                maxLength={100}
                placeholder="Risk code, title, or owner"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              {search ? (
                <button
                  type="button"
                  aria-label="Clear treatment plan search"
                  className="text-muted hover:bg-neutral-soft focus-visible:outline-brand absolute top-8 right-1 grid size-10 place-items-center rounded-md focus-visible:outline-2"
                  onClick={() => setSearch("")}
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              ) : null}
            </FormField>
          </div>
          <FormField id="treatment-status" label="Status">
            <Select
              id="treatment-status"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="">All statuses</option>
              {Object.entries(statusLabels).map(([value, label]) => (
                <option value={value} key={value}>
                  {label}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField id="treatment-strategy" label="Strategy">
            <Select
              id="treatment-strategy"
              value={strategy}
              onChange={(event) => setStrategy(event.target.value)}
            >
              <option value="">All strategies</option>
              {Object.entries(strategyLabels).map(([value, label]) => (
                <option value={value} key={value}>
                  {label}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField id="treatment-owner" label="Owner">
            <Select
              id="treatment-owner"
              value={ownership}
              onChange={(event) => setOwnership(event.target.value)}
            >
              <option value="">All owners</option>
              <option value="mine">My treatment plans</option>
            </Select>
          </FormField>
          <FormField id="treatment-overdue" label="Deadline status">
            <Select
              id="treatment-overdue"
              value={overdue}
              onChange={(event) => setOverdue(event.target.value)}
            >
              <option value="">Any deadline status</option>
              <option value="true">Overdue</option>
              <option value="false">Not overdue</option>
            </Select>
          </FormField>
          <FormField
            id="treatment-from"
            label="Target from"
            error={dateError || undefined}
          >
            <Input
              id="treatment-from"
              className="dark:[color-scheme:dark]"
              type="date"
              value={targetFrom}
              aria-invalid={Boolean(dateError)}
              onChange={(event) => setTargetFrom(event.target.value)}
            />
          </FormField>
          <FormField id="treatment-to" label="Target to">
            <Input
              id="treatment-to"
              className="dark:[color-scheme:dark]"
              type="date"
              value={targetTo}
              aria-invalid={Boolean(dateError)}
              onChange={(event) => setTargetTo(event.target.value)}
            />
          </FormField>
          <FormField id="treatment-sort" label="Sort">
            <Select
              id="treatment-sort"
              value={sort}
              onChange={(event) => setSort(event.target.value)}
            >
              <option value="updatedAt:desc">Recently updated</option>
              <option value="targetDate:asc">Earliest target date</option>
              <option value="targetDate:desc">Latest target date</option>
              <option value="riskCode:asc">Risk code A-Z</option>
              <option value="status:asc">Status A-Z</option>
            </Select>
          </FormField>
          <div className="flex flex-wrap items-end gap-2 md:col-span-2 xl:col-span-3 xl:justify-end">
            <Button type="submit">Apply filters</Button>
            <Button type="button" variant="secondary" onClick={clear}>
              <X className="size-4" aria-hidden="true" />
              Clear
            </Button>
          </div>
        </form>
        {plans.isPending ? (
          <div className="p-5">
            <DashboardLoadingSkeleton variant="table" />
          </div>
        ) : plans.isError ? (
          <div className="space-y-3 p-5">
            <Alert>
              <strong className="block">Unable to load treatment plans</strong>
              <span>Check the backend connection and try again.</span>
            </Alert>
            <Button
              type="button"
              variant="secondary"
              onClick={() => void plans.refetch()}
            >
              Retry
            </Button>
          </div>
        ) : plans.data.items.length === 0 ? (
          <div className="p-5">
            <EmptyState
              title="No matching treatment plans"
              description="Clear the filters or create a treatment plan for an approved risk assessment."
            />
          </div>
        ) : (
          <div
            aria-label="Treatment plan results"
            className="p-4 [&_table]:min-w-[1040px]"
          >
            <DataTable
              columns={columns}
              rows={plans.data.items}
              getRowKey={(plan) => plan.id}
            />
          </div>
        )}
        {plans.data && !plans.isError ? (
          <div className="border-border border-t p-4">
            <Pagination
              page={plans.data.pagination.page}
              pageCount={plans.data.pagination.totalPages}
              onPageChange={(page) => navigate({ page })}
            />
          </div>
        ) : null}
      </ProductPanel>
      <p className="text-muted mt-3 flex items-center gap-2 text-xs">
        <CalendarClock className="size-4" aria-hidden="true" /> Progress
        excludes cancelled actions. Deadline warnings include overdue plans or
        active actions; completed and cancelled items are excluded.
      </p>
    </>
  );
}
