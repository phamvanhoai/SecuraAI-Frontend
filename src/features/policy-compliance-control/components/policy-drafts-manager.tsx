"use client";

import {
  Building2,
  Ellipsis,
  Eye,
  FilePenLine,
  Pencil,
  Search,
  Send,
  Link2,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type MouseEvent,
} from "react";
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
import { useToast } from "@/components/feedback/toast";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useSessionUser } from "@/features/authentication-account";
import {
  usePolicyDraft,
  usePolicyDrafts,
  useSubmitPolicyForReview,
} from "../hooks/use-policy-drafts";
import {
  policyDraftQuerySchema,
  type OwnedPolicyDraft,
  type PolicyDraftQuery,
} from "../schemas/policy-draft-schema";
import { useRejectedPolicies } from "../hooks/use-policy-publication";
import type {
  RejectedPolicyListItem,
  RejectedPolicyQuery,
} from "../schemas/policy-publication-schema";
import { PolicyDraftFormDialog } from "./policy-draft-form-dialog";

function queryFromParams(params: URLSearchParams): PolicyDraftQuery {
  const parsed = policyDraftQuerySchema.safeParse(
    Object.fromEntries(params.entries()),
  );
  return parsed.success ? parsed.data : policyDraftQuerySchema.parse({});
}

const overviewQuery = policyDraftQuerySchema.parse({});
const initialRejectedQuery: RejectedPolicyQuery = {
  page: 1,
  limit: 20,
  sortOrder: "desc",
};

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

const rejectedColumns: readonly DataTableColumn<RejectedPolicyListItem>[] = [
  {
    key: "policy",
    header: "Policy",
    cell: (item) => (
      <span className="block min-w-56">
        <strong className="block">{item.title}</strong>
        <span className="text-muted text-xs">{item.policyCode}</span>
      </span>
    ),
  },
  { key: "version", header: "Version", cell: (item) => `v${item.version.versionNumber}` },
  { key: "status", header: "Status", cell: () => <StatusBadge tone="danger">Rejected</StatusBadge> },
  {
    key: "reason",
    header: "Reason",
    cell: (item) => <span className="block max-w-md whitespace-normal">{item.rejection.reason}</span>,
  },
  {
    key: "decision",
    header: "Rejected by",
    cell: (item) => (
      <span>
        <span className="block">{item.rejection.rejectedByName}</span>
        <span className="text-muted text-xs">{formatDate(item.rejection.rejectedAt)}</span>
      </span>
    ),
  },
];

export function PolicyDraftsManager({
  onAssignDepartments,
  onCreateNewVersion,
  onMapControls,
}: {
  onAssignDepartments?: () => void;
  onCreateNewVersion?: () => void;
  onMapControls?: () => void;
} = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = useMemo(() => queryFromParams(searchParams), [searchParams]);
  const session = useSessionUser();
  const toast = useToast();
  const canManageDrafts =
    session.data?.permissions.includes("policies.create") ?? false;
  const canSubmitDrafts =
    session.data?.permissions.includes("policies.submit") ?? false;
  const drafts = usePolicyDrafts(query, canManageDrafts);
  const metricDrafts = usePolicyDrafts(overviewQuery, canManageDrafts);
  const [search, setSearch] = useState(query.q ?? "");
  const [activeTab, setActiveTab] = useState<"drafts" | "rejected">("drafts");
  const [rejectedQuery, setRejectedQuery] = useState(initialRejectedQuery);
  const [rejectedSearch, setRejectedSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState<{
    policyId: string;
    versionId: string;
  } | null>(null);
  const [editing, setEditing] = useState<OwnedPolicyDraft | null>(null);
  const [submitting, setSubmitting] = useState<OwnedPolicyDraft | null>(null);
  const submitMutation = useSubmitPolicyForReview();
  const rejectedPolicies = useRejectedPolicies(rejectedQuery, canManageDrafts);
  const detail = usePolicyDraft(
    selected?.policyId ?? null,
    selected?.versionId ?? null,
  );
  const metricItems = metricDrafts.data?.items ?? [];
  const describedCount = metricItems.filter(
    (draft) => draft.description,
  ).length;
  const documentedChangesCount = metricItems.filter(
    (draft) => draft.version.changeSummary,
  ).length;

  const navigate = (next: Partial<PolicyDraftQuery>): void => {
    const parameters = new URLSearchParams();
    Object.entries({ ...query, ...next }).forEach(([key, value]) => {
      if (value !== undefined && value !== "")
        parameters.set(key, String(value));
    });
    router.push(`${pathname}?${parameters.toString()}`);
  };
  const submitSearch = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    navigate({
      page: 1,
      ...(search.trim() ? { q: search.trim() } : { q: undefined }),
    });
  };
  const submitRejectedSearch = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const q = rejectedSearch.trim();
    setRejectedQuery((current) => {
      if (q) return { ...current, page: 1, q };
      const next = { ...current };
      delete next.q;
      return { ...next, page: 1 };
    });
  };
  const closeActionMenu = (event: MouseEvent<HTMLButtonElement>): void => {
    event.currentTarget.closest("details")?.removeAttribute("open");
  };
  const columns = useMemo<readonly DataTableColumn<OwnedPolicyDraft>[]>(
    () => [
      {
        key: "policy",
        header: "Policy",
        cell: (draft) => (
          <span className="block min-w-56">
            <strong className="block">{draft.title}</strong>
            <span className="text-muted text-xs">{draft.policyCode}</span>
          </span>
        ),
      },
      {
        key: "version",
        header: "Version",
        cell: (draft) => (
          <span className="tabular-nums">v{draft.version.versionNumber}</span>
        ),
      },
      {
        key: "status",
        header: "Status",
        cell: () => <StatusBadge tone="neutral">Draft</StatusBadge>,
      },
      {
        key: "updated",
        header: "Updated",
        cell: (draft) => (
          <span className="whitespace-nowrap">
            {formatDate(draft.updatedAt)}
          </span>
        ),
      },
      {
        key: "actions",
        header: "Actions",
        cell: (draft) => (
          <DropdownMenu
            className="w-fit"
            label={
              <span className="grid size-6 place-items-center">
                <span className="sr-only">Actions for {draft.title}</span>
                <Ellipsis
                  className="size-5"
                  strokeWidth={1.8}
                  aria-hidden="true"
                />
              </span>
            }
          >
            <button
              className="hover:bg-neutral-soft focus-visible:outline-brand flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-left text-sm transition-colors focus-visible:outline-2"
              onClick={(event) => {
                closeActionMenu(event);
                setSelected({
                  policyId: draft.policyId,
                  versionId: draft.version.id,
                });
              }}
              type="button"
            >
              <Eye className="size-4" strokeWidth={1.8} aria-hidden="true" />
              View details
            </button>
            <button
              className="hover:bg-neutral-soft focus-visible:outline-brand flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-left text-sm transition-colors focus-visible:outline-2"
              onClick={(event) => {
                closeActionMenu(event);
                setEditing(draft);
              }}
              type="button"
            >
              <Pencil className="size-4" strokeWidth={1.8} aria-hidden="true" />
              Edit
            </button>
            {canSubmitDrafts ? (
              <button
                className="hover:bg-neutral-soft focus-visible:outline-brand flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-left text-sm transition-colors focus-visible:outline-2"
                onClick={(event) => {
                  closeActionMenu(event);
                  setSubmitting(draft);
                }}
                type="button"
              >
                <Send className="size-4" strokeWidth={1.8} aria-hidden="true" />
                Submit for review
              </button>
            ) : null}
          </DropdownMenu>
        ),
      },
    ],
    [canSubmitDrafts],
  );

  if (session.isPending)
    return (
      <p className="text-muted py-10 text-center">
        Checking access permissions…
      </p>
    );
  if (!canManageDrafts) {
    return (
      <Alert>
        <strong className="block">
          You do not have permission to manage policy drafts
        </strong>
        <span>
          Contact an administrator to request the policies.create permission.
        </span>
      </Alert>
    );
  }

  return (
    <>
      <ProductPageHeader
        {...(onAssignDepartments || onMapControls
          ? {
              additionalActions: (
                <>
                  {onMapControls ? (
                    <Button
                      className="min-h-10 px-3.5 font-medium"
                      onClick={onMapControls}
                      variant="secondary"
                    >
                      <Link2
                        aria-hidden="true"
                        className="size-4"
                        strokeWidth={1.8}
                      />
                      Map controls
                    </Button>
                  ) : null}
                  {onAssignDepartments ? (
                    <Button
                      className="min-h-10 px-3.5 font-medium"
                      onClick={onAssignDepartments}
                      variant="secondary"
                    >
                      <Building2
                        aria-hidden="true"
                        className="size-4"
                        strokeWidth={1.8}
                      />
                      Assign departments
                    </Button>
                  ) : null}
                </>
              ),
            }
          : {})}
        description="Create and update the policies you own before they are submitted for publication."
        onPrimaryAction={() => setCreateOpen(true)}
        primaryAction="Create draft"
        showSampleNotice={false}
        title="Information Security Policy Drafts"
        {...(onCreateNewVersion
          ? {
              onSecondaryAction: onCreateNewVersion,
              secondaryAction: "Create new version",
              secondaryActionIcon: (
                <FilePenLine
                  aria-hidden="true"
                  className="size-4"
                  strokeWidth={1.8}
                />
              ),
            }
          : {})}
      />
      <MetricStrip
        ariaLabel="Policy draft metrics"
        metrics={[
          {
            label: "Total drafts",
            value: metricDrafts.data
              ? String(metricDrafts.data.pagination.total)
              : "—",
            detail: "Returned by the backend",
            tone: "brand",
          },
          {
            label: "On this page",
            value: metricDrafts.data ? String(metricItems.length) : "—",
            detail: `Up to ${overviewQuery.limit} unfiltered drafts`,
            tone: "neutral",
          },
          {
            label: "With description",
            value: metricDrafts.data ? String(describedCount) : "—",
            detail: "On the unfiltered overview",
            tone: "neutral",
          },
          {
            label: "With change summary",
            value: metricDrafts.data ? String(documentedChangesCount) : "—",
            detail: "On the unfiltered overview",
            tone: "neutral",
          },
        ]}
      />
      <ProductPanel
        description={
          activeTab === "drafts"
            ? drafts.data
              ? `${drafts.data.pagination.total} drafts found`
              : "Loading backend data"
            : rejectedPolicies.data
              ? `${rejectedPolicies.data.pagination.total} rejected policies found`
              : "Loading backend data"
        }
        title="Policy drafts"
      >
        <div
          aria-label="Policy draft views"
          className="border-border flex overflow-x-auto border-b px-4"
          role="tablist"
        >
          {([
            {
              id: "drafts" as const,
              label: "Drafts",
              count: drafts.data?.pagination.total,
            },
            {
              id: "rejected" as const,
              label: "Rejected",
              count: rejectedPolicies.data?.pagination.total,
            },
          ]).map((tab) => (
            <button
              aria-controls={`${tab.id}-policies-panel`}
              aria-selected={activeTab === tab.id}
              className={cn(
                "focus-visible:outline-brand flex min-h-11 items-center gap-2 border-b-2 px-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px]",
                activeTab === tab.id
                  ? "border-brand text-foreground"
                  : "text-muted hover:text-foreground border-transparent",
              )}
              id={`${tab.id}-policies-tab`}
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              role="tab"
              type="button"
            >
              {tab.label}
              {tab.count !== undefined ? (
                <span className="bg-neutral-soft rounded-full px-2 py-0.5 text-xs tabular-nums">
                  {tab.count}
                </span>
              ) : null}
            </button>
          ))}
        </div>
        {activeTab === "drafts" ? (
          <div
            aria-labelledby="drafts-policies-tab"
            id="drafts-policies-panel"
            role="tabpanel"
          >
            <form
              aria-label="Draft filters"
              className="border-border flex flex-col gap-2 border-b p-4 sm:flex-row"
              onSubmit={submitSearch}
            >
              <label className="relative block w-full sm:max-w-md">
                <span className="sr-only">Search by policy code or title</span>
                <Search
                  className="text-muted absolute top-1/2 left-3 size-4 -translate-y-1/2"
                  strokeWidth={1.8}
                  aria-hidden="true"
                />
                <Input
                  className="bg-background min-h-10 pl-9"
                  maxLength={100}
                  placeholder="Search by policy code or title"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </label>
              <Select
                aria-label="Updated date order"
                className="min-h-10 sm:w-48"
                value={query.sortOrder}
                onChange={(event) =>
                  navigate({
                    page: 1,
                    sortOrder: event.target.value === "asc" ? "asc" : "desc",
                  })
                }
              >
                <option value="desc">Recently updated first</option>
                <option value="asc">Oldest updated first</option>
              </Select>
              <Button className="min-h-10" type="submit">
                Search
              </Button>
            </form>
            <div className="p-4">
              {drafts.isPending ? <DraftTableSkeleton /> : null}
              {drafts.isError ? (
                <Alert className="border-danger/25 bg-danger-soft text-danger">
                  <strong className="block">Unable to load policy drafts</strong>
                  <span>
                    {drafts.error instanceof Error
                      ? drafts.error.message
                      : "Check the backend connection and try again."}
                  </span>
                  <Button
                    className="mt-3"
                    variant="secondary"
                    onClick={() => void drafts.refetch()}
                  >
                    Try again
                  </Button>
                </Alert>
              ) : null}
              {drafts.data && drafts.data.items.length === 0 ? (
                <p className="text-muted py-10 text-center">
                  No policy drafts found.
                </p>
              ) : null}
              {drafts.data && drafts.data.items.length > 0 ? (
                <DataTable
                  columns={columns}
                  rows={drafts.data.items}
                  getRowKey={(draft) => draft.version.id}
                />
              ) : null}
            </div>
            {drafts.data ? (
              <div className="border-border border-t p-4">
                <Pagination
                  page={drafts.data.pagination.page}
                  pageCount={drafts.data.pagination.totalPages}
                  onPageChange={(page) => navigate({ page })}
                />
              </div>
            ) : null}
          </div>
        ) : (
          <div
            aria-labelledby="rejected-policies-tab"
            id="rejected-policies-panel"
            role="tabpanel"
          >
            <form
              aria-label="Rejected policy filters"
              className="border-border flex flex-col gap-2 border-b p-4 sm:flex-row"
              onSubmit={submitRejectedSearch}
            >
              <label className="relative block w-full sm:max-w-md">
                <span className="sr-only">
                  Search rejected policies by code or title
                </span>
                <Search
                  aria-hidden="true"
                  className="text-muted absolute top-1/2 left-3 size-4 -translate-y-1/2"
                  strokeWidth={1.8}
                />
                <Input
                  className="bg-background min-h-10 pl-9"
                  maxLength={100}
                  placeholder="Search rejected policies"
                  value={rejectedSearch}
                  onChange={(event) => setRejectedSearch(event.target.value)}
                />
              </label>
              <Button className="min-h-10" type="submit">
                Search
              </Button>
            </form>
            <div className="p-4">
              {rejectedPolicies.isPending ? (
                <DraftTableSkeleton label="Loading rejected policies" />
              ) : null}
              {rejectedPolicies.isError ? (
                <Alert className="border-danger/25 bg-danger-soft text-danger">
                  <strong className="block">
                    Unable to load rejected policies
                  </strong>
                  <span>
                    {rejectedPolicies.error instanceof Error
                      ? rejectedPolicies.error.message
                      : "Check the backend connection and try again."}
                  </span>
                  <Button
                    className="mt-3"
                    variant="secondary"
                    onClick={() => void rejectedPolicies.refetch()}
                  >
                    Try again
                  </Button>
                </Alert>
              ) : null}
              {rejectedPolicies.data &&
              rejectedPolicies.data.items.length === 0 ? (
                <p className="text-muted py-10 text-center">
                  No rejected policies found.
                </p>
              ) : null}
              {rejectedPolicies.data &&
              rejectedPolicies.data.items.length > 0 ? (
                <DataTable
                  columns={rejectedColumns}
                  rows={rejectedPolicies.data.items}
                  getRowKey={(item) => item.version.id}
                />
              ) : null}
            </div>
            {rejectedPolicies.data ? (
              <div className="border-border border-t p-4">
                <Pagination
                  page={rejectedPolicies.data.pagination.page}
                  pageCount={rejectedPolicies.data.pagination.totalPages}
                  onPageChange={(page) =>
                    setRejectedQuery((current) => ({ ...current, page }))
                  }
                />
              </div>
            ) : null}
          </div>
        )}
      </ProductPanel>

      <PolicyDraftFormDialog
        open={createOpen}
        draft={null}
        onClose={() => setCreateOpen(false)}
      />
      <PolicyDraftFormDialog
        open={editing !== null}
        draft={editing}
        onClose={() => setEditing(null)}
      />
      <PolicyDraftDetailDialog
        draft={detail.data ?? null}
        pending={detail.isPending}
        error={detail.isError ? detail.error : null}
        open={selected !== null}
        onEdit={(draft) => {
          setSelected(null);
          setEditing(draft);
        }}
        onClose={() => setSelected(null)}
      />
      <SubmitPolicyDraftDialog
        draft={submitting}
        pending={submitMutation.isPending}
        onClose={() => setSubmitting(null)}
        onSubmit={async (draft) => {
          try {
            await submitMutation.mutateAsync({
              policyId: draft.policyId,
              versionId: draft.version.id,
            });
            setSubmitting(null);
            toast.success(
              "Policy submitted for review",
              `${draft.policyCode} is now available to Admin reviewers.`,
            );
          } catch (reason: unknown) {
            toast.error(
              "Unable to submit policy",
              reason instanceof Error
                ? reason.message
                : "Review the draft and try again.",
            );
          }
        }}
      />
    </>
  );
}

function SubmitPolicyDraftDialog({
  draft,
  pending,
  onClose,
  onSubmit,
}: {
  draft: OwnedPolicyDraft | null;
  pending: boolean;
  onClose: () => void;
  onSubmit: (draft: OwnedPolicyDraft) => Promise<void>;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (draft && !dialog.open) dialog.showModal();
    if (!draft && dialog.open) dialog.close();
  }, [draft]);

  return (
    <Dialog
      dialogRef={dialogRef}
      title="Submit policy for review"
      onCancel={(event) => {
        event.preventDefault();
        if (!pending) onClose();
      }}
      onClose={onClose}
    >
      {draft ? (
        <div className="space-y-5">
          <p className="text-muted text-sm leading-6">
            Submit <strong className="text-foreground">{draft.title}</strong>{" "}
            (v{draft.version.versionNumber}) to Admin for review. The draft can
            no longer be edited after submission.
          </p>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" disabled={pending} onClick={onClose}>
              Cancel
            </Button>
            <Button
              disabled={pending}
              onClick={() => void onSubmit(draft)}
            >
              <Send className="size-4" strokeWidth={1.8} aria-hidden="true" />
              {pending ? "Submitting…" : "Submit for review"}
            </Button>
          </div>
        </div>
      ) : null}
    </Dialog>
  );
}

function DraftTableSkeleton({
  label = "Loading policy drafts",
}: {
  label?: string;
}) {
  return (
    <div aria-label={label} className="space-y-3" role="status">
      {[1, 2, 3].map((row) => (
        <div
          className="bg-neutral-soft h-14 animate-pulse rounded-lg motion-reduce:animate-none"
          key={row}
        />
      ))}
    </div>
  );
}

function PolicyDraftDetailDialog({
  draft,
  pending,
  error,
  open,
  onEdit,
  onClose,
}: {
  draft: OwnedPolicyDraft | null;
  pending: boolean;
  error: unknown;
  open: boolean;
  onEdit: (draft: OwnedPolicyDraft) => void;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);
  return (
    <Dialog
      dialogRef={dialogRef}
      className="max-h-[calc(100dvh-2rem)] w-[min(44rem,calc(100%-2rem))] overflow-y-auto"
      title="Draft details"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClose={onClose}
    >
      {pending ? (
        <p className="text-muted py-10 text-center">Loading content…</p>
      ) : null}
      {error ? (
        <Alert className="border-danger/25 bg-danger-soft text-danger mt-4">
          {error instanceof Error
            ? error.message
            : "Unable to load the policy draft."}
        </Alert>
      ) : null}
      {draft ? (
        <div className="space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h3 className="text-xl font-semibold">{draft.title}</h3>
              <p className="text-muted mt-1 text-sm break-all">
                {draft.policyCode}
              </p>
            </div>
            <StatusBadge tone="neutral">Draft</StatusBadge>
          </div>
          <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
            <Detail label="Policy code" value={draft.policyCode} />
            <Detail label="Version" value={`v${draft.version.versionNumber}`} />
            <Detail label="Created" value={formatDate(draft.createdAt)} />
            <Detail label="Updated" value={formatDate(draft.updatedAt)} />
          </dl>
          <div>
            <p className="text-muted text-xs font-semibold uppercase">
              Description
            </p>
            <p className="mt-1 text-sm leading-6">
              {draft.description || "No description"}
            </p>
          </div>
          <div>
            <p className="text-muted text-xs font-semibold uppercase">
              Content
            </p>
            <pre className="border-border bg-background mt-2 max-h-80 overflow-auto rounded-lg border p-4 font-sans text-sm leading-6 whitespace-pre-wrap">
              {draft.version.content}
            </pre>
          </div>
        </div>
      ) : null}
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
        {draft ? (
          <Button onClick={() => onEdit(draft)}>
            <Pencil className="size-4" aria-hidden="true" />
            Edit
          </Button>
        ) : null}
      </div>
    </Dialog>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-muted text-xs font-medium tracking-wide uppercase">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium">{value}</dd>
    </div>
  );
}
