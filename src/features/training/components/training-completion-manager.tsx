"use client";

import {
  Award,
  ArrowLeft,
  ClipboardList,
  Eye,
  Search,
  UserMinus,
} from "lucide-react";
import { TrainingCertificatePanel } from "./training-certificate-panel";
import { useCertificateIssuancePending } from "../hooks/use-certificate";
import { useEffect, useRef, useState, type ReactNode } from "react";
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
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { TableSkeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/feedback/toast";
import { useSessionUser } from "@/features/authentication-account";
import {
  useCompletionCampaign,
  useCompletionCampaigns,
  useWithdrawEnrollment,
} from "../hooks/use-completion";
import type {
  CompletionCampaign,
  CompletionStatus,
} from "../schemas/completion-schema";

const date = (value: string) =>
  new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(
    new Date(value),
  );

export function TrainingCompletionManager({
  onViewCourses,
  course,
  onAssessments,
  headerActions,
}: {
  onViewCourses?: () => void;
  course?: { id: string; title: string };
  onAssessments?: () => void;
  headerActions?: ReactNode;
}) {
  const [page, setPage] = useState(1);
  const [draftQuery, setDraftQuery] = useState("");
  const [query, setQuery] = useState("");
  const [campaignId, setCampaignId] = useState<string>();
  const campaigns = useCompletionCampaigns(page, query, true, course?.id);
  const pageItems = campaigns.data?.items ?? [];
  const columns: readonly DataTableColumn<CompletionCampaign>[] = [
    {
      key: "campaign",
      header: "Campaign",
      cell: (item) => (
        <span>
          <strong className="block">{item.title}</strong>
          {!course ? (
            <span className="text-muted text-xs">{item.courseTitle}</span>
          ) : null}
        </span>
      ),
    },
    {
      key: "period",
      header: "Period",
      cell: (item) => `${date(item.startDate)} – ${date(item.dueDate)}`,
    },
    {
      key: "status",
      header: "Status",
      cell: (item) => (
        <StatusBadge tone={item.status === "active" ? "success" : "neutral"}>
          {item.status}
        </StatusBadge>
      ),
    },
    { key: "assigned", header: "Assigned", cell: (item) => item.assigned },
    {
      key: "completion",
      header: "Completion",
      cell: (item) => (
        <div className="min-w-32">
          <div className="mb-1 flex justify-between text-xs">
            <span>
              {item.completed}/{item.assigned}
            </span>
            <strong>{item.completionRate}%</strong>
          </div>
          <div className="bg-neutral-soft h-2 overflow-hidden rounded-full">
            <div
              className="bg-brand h-full"
              style={{ width: `${item.completionRate}%` }}
            />
          </div>
        </div>
      ),
    },
    { key: "overdue", header: "Overdue", cell: (item) => item.overdue },
    {
      key: "actions",
      header: "Actions",
      cell: (item) => (
        <Button
          className="min-h-10 px-3"
          variant="secondary"
          onClick={() => setCampaignId(item.id)}
        >
          <Eye className="size-4" aria-hidden="true" strokeWidth={1.8} />
          View employees
        </Button>
      ),
    },
  ];
  const totalAssigned = pageItems.reduce((sum, item) => sum + item.assigned, 0);
  const totalCompleted = pageItems.reduce(
    (sum, item) => sum + item.completed,
    0,
  );

  return (
    <>
      <ProductPageHeader
        title="Training progress"
        description={
          course
            ? `Course: ${course.title}. Select an assignment campaign to review employee completion and issue certificates.`
            : "Select an assignment campaign to review employee completion and completion certificates."
        }
        showSampleNotice={false}
        {...(onAssessments
          ? {
              secondaryAction: "My assessments",
              secondaryActionIcon: (
                <ClipboardList
                  aria-hidden="true"
                  className="size-4"
                  strokeWidth={1.8}
                />
              ),
              onSecondaryAction: onAssessments,
            }
          : {})}
        {...(onViewCourses
          ? {
              secondaryAction: "Back to courses",
              secondaryActionIcon: (
                <ArrowLeft
                  aria-hidden="true"
                  className="size-4"
                  strokeWidth={1.8}
                />
              ),
              onSecondaryAction: onViewCourses,
            }
          : {})}
      />
      {headerActions}
      <MetricStrip
        ariaLabel="Training completion summary"
        metrics={[
          {
            label: "Campaigns",
            value: String(campaigns.data?.pagination.total ?? 0),
            detail: "Returned by the backend",
          },
          {
            label: "Assigned employees",
            value: String(totalAssigned),
            detail: "On this page",
          },
          {
            label: "Completed",
            value: String(totalCompleted),
            detail: "On this page",
            tone: "brand",
          },
          {
            label: "Completion rate",
            value: `${totalAssigned ? Math.round((totalCompleted / totalAssigned) * 100) : 0}%`,
            detail: "On this page",
          },
        ]}
      />
      <ProductPanel
        title="Assignment campaigns"
        description={
          campaigns.data
            ? `${campaigns.data.pagination.total} campaigns found`
            : "Campaign completion returned by the backend"
        }
      >
        <form
          className="border-border flex flex-wrap gap-2 border-b p-4"
          onSubmit={(event) => {
            event.preventDefault();
            setQuery(draftQuery.trim());
            setPage(1);
          }}
        >
          <label className="relative block w-full max-w-md">
            <span className="sr-only">Search campaigns</span>
            <Search
              className="text-muted absolute top-1/2 left-3 size-4 -translate-y-1/2"
              aria-hidden="true"
            />
            <Input
              className="pl-9"
              maxLength={100}
              placeholder="Search campaigns or courses"
              value={draftQuery}
              onChange={(event) => setDraftQuery(event.target.value)}
            />
          </label>
          <Button type="submit">Search</Button>
        </form>
        <div className="p-4">
          {campaigns.isPending ? (
            <TableSkeleton
              headers={[
                "Campaign",
                "Period",
                "Status",
                "Assigned",
                "Completion",
                "Overdue",
                "Actions",
              ]}
              rows={5}
              label="Loading training completion"
            />
          ) : campaigns.isError ? (
            <Alert>Unable to load training completion data.</Alert>
          ) : pageItems.length === 0 ? (
            <p className="text-muted py-10 text-center text-sm">
              {course
                ? "No assignment campaigns for this course match your search. Assign the course to employees before tracking completion."
                : "No training campaigns match your search."}
            </p>
          ) : (
            <DataTable
              columns={columns}
              rows={pageItems}
              getRowKey={(item) => item.id}
            />
          )}
        </div>
        {campaigns.data ? (
          <div className="border-border border-t p-4">
            <Pagination
              page={campaigns.data.pagination.page}
              pageCount={campaigns.data.pagination.totalPages}
              onPageChange={setPage}
            />
          </div>
        ) : null}
      </ProductPanel>
      <CompletionDetailDialog
        campaignId={campaignId}
        onClose={() => setCampaignId(undefined)}
      />
    </>
  );
}

function CompletionDetailDialog({
  campaignId,
  onClose,
}: {
  campaignId: string | undefined;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [certificateId, setCertificateId] = useState<string>();
  const certificateTrigger = useRef<HTMLButtonElement>(null);
  const issuingCertificate = useCertificateIssuancePending();
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [draftQuery, setDraftQuery] = useState("");
  const [status, setStatus] = useState<CompletionStatus>("all");
  const [draftStatus, setDraftStatus] = useState<CompletionStatus>("all");
  const detail = useCompletionCampaign(campaignId, page, query, status);
  const session = useSessionUser();
  const canWithdraw =
    session.data?.permissions.includes("training-courses.assign") ?? false;
  const canIssue =
    session.data?.permissions.includes("training-certificates.issue") ?? false;
  const withdraw = useWithdrawEnrollment();
  const toast = useToast();
  const [withdrawTarget, setWithdrawTarget] = useState<{
    id: string;
    name: string;
  }>();
  const [reason, setReason] = useState("");
  const [withdrawError, setWithdrawError] = useState("");
  useEffect(() => {
    const dialog = dialogRef.current;
    if (campaignId && dialog && !dialog.open) dialog.showModal();
  }, [campaignId]);
  useEffect(() => {
    if (!certificateId) certificateTrigger.current?.focus();
  }, [certificateId]);
  const close = () => {
    if (withdraw.isPending || issuingCertificate) return;
    setWithdrawTarget(undefined);
    setCertificateId(undefined);
    setReason("");
    setWithdrawError("");
    dialogRef.current?.close();
    setPage(1);
    setQuery("");
    setDraftQuery("");
    setStatus("all");
    setDraftStatus("all");
    onClose();
  };
  const rows = detail.data?.items ?? [];

  return (
    <Dialog
      className="max-h-[calc(100dvh-2rem)] w-[min(72rem,calc(100%-2rem))] overflow-y-auto"
      dialogRef={dialogRef}
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onClose={() => {
        if (campaignId) onClose();
      }}
      title={detail.data?.campaign.title ?? "Campaign completion details"}
    >
      {certificateId ? (
        <TrainingCertificatePanel
          key={certificateId}
          enrollmentId={certificateId}
          onClose={() => {
            setCertificateId(undefined);
          }}
        />
      ) : null}
      <div hidden={Boolean(certificateId)}>
        {detail.data ? (
          <>
            <p className="text-muted mb-4 text-sm">
              {detail.data.campaign.courseTitle} ·{" "}
              {date(detail.data.campaign.startDate)} –{" "}
              {date(detail.data.campaign.dueDate)} ·{" "}
              {detail.data.campaign.requiredLessonCount} required lessons
              {detail.data.campaign.hasFinalAssessment
                ? " · Final assessment required"
                : " · No final assessment"}
            </p>
            <MetricStrip
              ariaLabel="Campaign completion summary"
              metrics={[
                {
                  label: "Assigned",
                  value: String(detail.data.summary.assigned),
                  detail: `${detail.data.summary.inProgress} in progress`,
                },
                {
                  label: "Completed",
                  value: String(detail.data.summary.completed),
                  detail: `${detail.data.summary.completionRate}% completion rate`,
                  tone: "brand",
                },
                {
                  label: "Average progress",
                  value: `${detail.data.summary.averageProgress}%`,
                  detail: "Across active assignments",
                },
                {
                  label: "Overdue",
                  value: String(detail.data.summary.overdue),
                  detail: `${detail.data.summary.withdrawn} withdrawn`,
                  tone: detail.data.summary.overdue > 0 ? "danger" : "neutral",
                },
              ]}
            />
          </>
        ) : detail.isPending ? (
          <MetricStrip
            ariaLabel="Loading campaign completion summary"
            metrics={[
              { label: "Assigned", value: "", detail: "", loading: true },
              { label: "Completed", value: "", detail: "", loading: true },
              {
                label: "Average progress",
                value: "",
                detail: "",
                loading: true,
              },
              { label: "Overdue", value: "", detail: "", loading: true },
            ]}
          />
        ) : null}
        {withdrawTarget ? (
          <form
            className="border-border mb-4 space-y-3 rounded-lg border p-4"
            onSubmit={async (event) => {
              event.preventDefault();
              if (reason.trim().length < 3) {
                setWithdrawError("Enter at least 3 characters for the reason.");
                return;
              }
              try {
                await withdraw.mutateAsync({
                  id: withdrawTarget.id,
                  reason: reason.trim(),
                });
                setWithdrawTarget(undefined);
                setReason("");
                setWithdrawError("");
                toast.success(
                  "Assignment withdrawn",
                  "Assessment access is blocked. History and results are preserved.",
                );
              } catch {
                setWithdrawError(
                  "Unable to withdraw this assignment. Refresh and try again.",
                );
              }
            }}
          >
            <h3 className="font-semibold">
              Withdraw assignment: {withdrawTarget.name}
            </h3>
            <p className="text-muted text-sm">
              This employee will no longer be able to take the assessment.
              Existing history and results will remain.
            </p>
            <label className="block text-sm" htmlFor="withdraw-reason">
              Reason for withdrawal
            </label>
            <Textarea
              id="withdraw-reason"
              value={reason}
              maxLength={500}
              onChange={(event) => setReason(event.target.value)}
            />
            {withdrawError ? <Alert>{withdrawError}</Alert> : null}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                disabled={withdraw.isPending}
                onClick={() => {
                  setWithdrawTarget(undefined);
                  setReason("");
                  setWithdrawError("");
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="danger"
                disabled={withdraw.isPending}
              >
                {withdraw.isPending ? "Withdrawing…" : "Confirm withdrawal"}
              </Button>
            </div>
          </form>
        ) : null}
        <form
          className="mb-4 flex flex-col gap-2 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault();
            setQuery(draftQuery.trim());
            setStatus(draftStatus);
            setPage(1);
          }}
        >
          <Input
            aria-label="Search employees"
            placeholder="Search employee name, email, or code"
            value={draftQuery}
            onChange={(event) => setDraftQuery(event.target.value)}
          />
          <Select
            aria-label="Filter completion status"
            value={draftStatus}
            onChange={(event) => {
              setDraftStatus(event.target.value as CompletionStatus);
            }}
          >
            <option value="all">All statuses</option>
            <option value="assigned">Not started</option>
            <option value="in_progress">In progress</option>
            <option value="completed">Completed</option>
            <option value="overdue">Overdue</option>
            <option value="withdrawn">Withdrawn</option>
          </Select>
          <Button type="submit">Search</Button>
        </form>
        {detail.isPending ? (
          <TableSkeleton
            headers={[
              "Employee",
              "Status",
              "Overall progress",
              "Required lessons",
              "Final assessment",
              "Last activity",
              "Certificate",
              ...(canWithdraw ? ["Actions"] : []),
            ]}
            rows={5}
            label="Loading employee completion"
          />
        ) : detail.isError ? (
          <Alert>Unable to load campaign details.</Alert>
        ) : rows.length === 0 ? (
          <p className="text-muted py-10 text-center text-sm">
            No employees match these filters.
          </p>
        ) : (
          <DataTable
            rows={rows}
            getRowKey={(item) => item.id}
            columns={[
              {
                key: "employee",
                header: "Employee",
                cell: (item) => (
                  <span>
                    <strong className="block">{item.user.name}</strong>
                    <span className="text-muted text-xs">
                      {item.user.email}
                      {item.user.employeeCode
                        ? ` · ${item.user.employeeCode}`
                        : ""}
                    </span>
                  </span>
                ),
              },
              {
                key: "status",
                header: "Status",
                cell: (item) => (
                  <StatusBadge
                    tone={
                      item.status === "completed"
                        ? "success"
                        : item.status === "overdue"
                          ? "danger"
                          : "neutral"
                    }
                  >
                    {item.status.replace("_", " ")}
                  </StatusBadge>
                ),
              },
              {
                key: "progress",
                header: "Overall progress",
                cell: (item) => (
                  <div className="min-w-28">
                    <div className="mb-1 flex justify-between text-xs tabular-nums">
                      <span>{item.progressPercent}%</span>
                    </div>
                    <div
                      aria-label={`${item.user.name} overall progress`}
                      aria-valuemax={100}
                      aria-valuemin={0}
                      aria-valuenow={item.progressPercent}
                      className="bg-neutral-soft h-2 overflow-hidden rounded-full"
                      role="progressbar"
                    >
                      <div
                        className="bg-brand h-full"
                        style={{ width: `${item.progressPercent}%` }}
                      />
                    </div>
                  </div>
                ),
              },
              {
                key: "lessons",
                header: "Required lessons",
                cell: (item) =>
                  item.requiredLessons.total > 0 ? (
                    <span className="tabular-nums">
                      {item.requiredLessons.completed}/
                      {item.requiredLessons.total}
                    </span>
                  ) : (
                    <span className="text-muted">None</span>
                  ),
              },
              {
                key: "assessment",
                header: "Final assessment",
                cell: (item) => {
                  if (!item.finalAssessment.required)
                    return <span className="text-muted">Not required</span>;
                  if (item.finalAssessment.latestScore === null)
                    return (
                      <StatusBadge tone="neutral">Not attempted</StatusBadge>
                    );
                  return (
                    <span className="flex flex-col gap-1">
                      <StatusBadge
                        tone={
                          item.finalAssessment.passed ? "success" : "warning"
                        }
                      >
                        {item.finalAssessment.passed ? "Passed" : "Not passed"}
                      </StatusBadge>
                      <span className="text-muted text-xs tabular-nums">
                        Latest: {item.finalAssessment.latestScore}%
                      </span>
                    </span>
                  );
                },
              },
              {
                key: "activity",
                header: "Last activity",
                cell: (item) =>
                  item.lastAccessedAt ? date(item.lastAccessedAt) : "Never",
              },
              {
                key: "certificate",
                header: "Certificate",
                cell: (item) =>
                  item.certificateNumber ||
                  (item.status === "completed" && canIssue) ? (
                    <Button
                      variant={item.certificateNumber ? "secondary" : "primary"}
                      onClick={(event) => {
                        certificateTrigger.current = event.currentTarget;
                        setCertificateId(item.id);
                      }}
                      disabled={issuingCertificate}
                    >
                      {item.certificateNumber ? (
                        <Eye
                          aria-hidden="true"
                          className="size-4"
                          strokeWidth={1.8}
                        />
                      ) : (
                        <Award
                          aria-hidden="true"
                          className="size-4"
                          strokeWidth={1.8}
                        />
                      )}
                      {item.certificateNumber
                        ? "View certificate"
                        : "Issue certificate"}
                    </Button>
                  ) : (
                    <span className="text-muted">
                      {item.status === "completed"
                        ? "Not issued"
                        : "Not eligible"}
                    </span>
                  ),
              },
              ...(canWithdraw
                ? [
                    {
                      key: "actions",
                      header: "Actions",
                      cell: (item: (typeof rows)[number]) =>
                        item.status !== "completed" &&
                        item.status !== "withdrawn" ? (
                          <Button
                            variant="danger"
                            disabled={withdraw.isPending}
                            onClick={() => {
                              setWithdrawTarget({
                                id: item.id,
                                name: item.user.name,
                              });
                              setReason("");
                              setWithdrawError("");
                            }}
                          >
                            <UserMinus
                              aria-hidden="true"
                              className="size-4"
                              strokeWidth={1.8}
                            />
                            Withdraw
                          </Button>
                        ) : null,
                    },
                  ]
                : []),
            ]}
          />
        )}
        {detail.data ? (
          <div className="border-border mt-4 border-t pt-4">
            <Pagination
              page={detail.data.pagination.page}
              pageCount={detail.data.pagination.totalPages}
              onPageChange={setPage}
            />
          </div>
        ) : null}
      </div>
      <div className="mt-5 flex justify-end">
        <Button
          variant="secondary"
          disabled={issuingCertificate || withdraw.isPending}
          onClick={close}
        >
          Close
        </Button>
      </div>
    </Dialog>
  );
}
