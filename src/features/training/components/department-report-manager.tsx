"use client";
import { useState, type ReactNode } from "react";
import { useSessionUser } from "@/features/auth";
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
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { TableSkeleton } from "@/components/ui/skeleton";
import { useDepartmentReport } from "../hooks/use-department-report";
import type {
  DepartmentProgressFilter,
  DepartmentReportRow,
} from "../schemas/department-report-schema";
import { TrainingSectionNavigation } from "./training-section-navigation";

const headers = [
  "Department",
  "Employees",
  "Training coverage",
  "Assignments",
  "Completed",
  "Overdue",
  "Assignment completion",
];
const columns: readonly DataTableColumn<DepartmentReportRow>[] = [
  {
    key: "name",
    header: "Department",
    cell: (row) => (
      <div>
        <strong className="block">{row.name}</strong>
        <span className="text-muted text-xs">{row.code}</span>
      </div>
    ),
  },
  { key: "employees", header: "Employees", cell: (row) => row.employees },
  {
    key: "coverage",
    header: "Training coverage",
    cell: (row) => (
      <div className="tabular-nums">
        <span className="block font-medium">
          {row.assignedEmployees}/{row.employees}
        </span>
        <span className="text-muted text-xs">{row.coverageRate}%</span>
      </div>
    ),
  },
  { key: "assigned", header: "Assignments", cell: (row) => row.assigned },
  { key: "completed", header: "Completed", cell: (row) => row.completed },
  { key: "overdue", header: "Overdue", cell: (row) => row.overdue },
  {
    key: "rate",
    header: "Assignment completion",
    cell: (row) => (
      <span className="tabular-nums">
        {row.assigned ? `${row.completionRate}%` : "Not assigned"}
      </span>
    ),
  },
];

export function DepartmentReportManager({
  sectionNavigation,
}: {
  sectionNavigation?: ReactNode;
} = {}) {
  const session = useSessionUser();
  if (session.isPending)
    return (
      <TableSkeleton headers={headers} rows={5} label="Loading report access" />
    );
  if (session.isError)
    return (
      <Alert>
        Unable to load report access.{" "}
        <Button variant="secondary" onClick={() => void session.refetch()}>
          Retry
        </Button>
      </Alert>
    );
  if (!session.data?.permissions.includes("training-department-reports.read"))
    return (
      <Alert>
        You do not have permission to view department training reports. Contact
        your administrator.
      </Alert>
    );
  const primaryLabel = session.data.permissions.includes(
    "training-courses.read",
  )
    ? "Courses"
    : session.data.permissions.includes("training-completion.read")
      ? "Training progress"
      : undefined;
  return (
    <DepartmentReportContent
      primaryLabel={primaryLabel}
      sectionNavigation={sectionNavigation}
    />
  );
}

function DepartmentReportContent({
  primaryLabel,
  sectionNavigation,
}: {
  primaryLabel: "Courses" | "Training progress" | undefined;
  sectionNavigation: ReactNode | undefined;
}) {
  const [page, setPage] = useState(1);
  const [draft, setDraft] = useState("");
  const [q, setQuery] = useState("");
  const [draftProgress, setDraftProgress] =
    useState<DepartmentProgressFilter>("all");
  const [progress, setProgress] = useState<DepartmentProgressFilter>("all");
  const report = useDepartmentReport(page, q, progress);
  const summary = report.data?.summary;
  return (
    <div className="space-y-5">
      <ProductPageHeader
        title="Department training completion report"
        description="Review training completion across departments. Employees use their current department; each campaign assignment is counted separately. Withdrawn assignments are excluded. Overdue dates use UTC."
        showSampleNotice={false}
      />
      {sectionNavigation ??
        (primaryLabel ? (
          <TrainingSectionNavigation
            active="department-report"
            primaryLabel={primaryLabel}
          />
        ) : null)}
      <MetricStrip
        ariaLabel="Organization training summary"
        metrics={[
          {
            label: "Employees",
            loading: report.isPending,
            value: summary ? String(summary.employees) : "—",
            detail: "Active and locked accounts",
          },
          {
            label: "Assigned employees",
            loading: report.isPending,
            value: summary ? String(summary.assignedEmployees) : "—",
            detail: "Unique employees with training",
          },
          {
            label: "Training coverage",
            loading: report.isPending,
            value: summary ? `${summary.coverageRate}%` : "—",
            detail: "Assigned employees / employees",
          },
          {
            label: "Assignment completion",
            loading: report.isPending,
            value: summary ? `${summary.completionRate}%` : "—",
            detail: "Completed / assignments",
          },
          {
            label: "Overdue",
            loading: report.isPending,
            value: summary ? String(summary.overdue) : "—",
            detail: "Incomplete past due date",
          },
        ]}
      />
      <ProductPanel
        title="Departments"
        description={
          report.data
            ? `${report.data.pagination.total} departments found`
            : "Department-level training progress"
        }
      >
        <form
          className="border-border flex flex-wrap items-end gap-2 border-b p-4"
          onSubmit={(event) => {
            event.preventDefault();
            setQuery(draft.trim());
            setProgress(draftProgress);
            setPage(1);
          }}
        >
          <label className="block w-full max-w-md">
            <span className="mb-1 block text-sm">Search departments</span>
            <Input
              value={draft}
              maxLength={100}
              placeholder="Department name or code"
              onChange={(event) => setDraft(event.target.value)}
            />
          </label>
          <label className="block w-full sm:w-48">
            <span className="mb-1 block text-sm">Progress</span>
            <Select
              value={draftProgress}
              onChange={(event) =>
                setDraftProgress(event.target.value as DepartmentProgressFilter)
              }
            >
              <option value="all">All progress</option>
              <option value="overdue">Has overdue training</option>
              <option value="completed">All assignments completed</option>
              <option value="no_assignments">No assignments</option>
            </Select>
          </label>
          <Button type="submit">Search</Button>
        </form>
        <div className="p-4">
          {report.isPending ? (
            <TableSkeleton
              headers={headers}
              rows={5}
              label="Loading department training report"
            />
          ) : report.isError ? (
            <Alert>
              Unable to load the department report.{" "}
              <Button variant="secondary" onClick={() => void report.refetch()}>
                Retry
              </Button>
            </Alert>
          ) : !report.data?.items.length ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <p className="text-muted max-w-md text-sm">
                No departments match your search and progress filter. Clear the
                filters or ask your administrator to configure departments.
              </p>
              {q || progress !== "all" ? (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setDraft("");
                    setQuery("");
                    setDraftProgress("all");
                    setProgress("all");
                    setPage(1);
                  }}
                >
                  Clear filters
                </Button>
              ) : null}
            </div>
          ) : (
            <DataTable
              columns={columns}
              rows={report.data.items}
              getRowKey={(row) => row.id}
            />
          )}
        </div>
        {report.data ? (
          <div className="border-border border-t p-4">
            <Pagination
              page={page}
              pageCount={report.data.pagination.totalPages}
              onPageChange={setPage}
            />
          </div>
        ) : null}
      </ProductPanel>
    </div>
  );
}
