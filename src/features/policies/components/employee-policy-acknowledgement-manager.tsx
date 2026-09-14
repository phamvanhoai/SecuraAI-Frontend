"use client";
import { Eye, Search } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
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
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useSessionUser } from "@/features/auth";
import {
  useAcknowledgePolicy,
  useEmployeePolicies,
  useEmployeePolicy,
} from "../hooks/use-policy-acknowledgements";
import type {
  EmployeePolicy,
  EmployeePolicyQuery,
} from "../schemas/policy-acknowledgement-schema";
const initial: EmployeePolicyQuery = { page: 1, limit: 20, status: "all" };
export function EmployeePolicyAcknowledgementManager() {
  const session = useSessionUser();
  const allowed =
    session.data?.permissions.includes("policies.acknowledge") ?? false;
  const [query, setQuery] = useState(initial);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<{
    policyId: string;
    versionId: string;
  } | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const ref = useRef<HTMLDialogElement>(null);
  const list = useEmployeePolicies(query, allowed);
  const detail = useEmployeePolicy(
    selected?.policyId ?? null,
    selected?.versionId ?? null,
  );
  const mutation = useAcknowledgePolicy();
  const toast = useToast();
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (selected && !d.open) d.showModal();
    if (!selected && d.open) d.close();
  }, [selected]);
  const columns: readonly DataTableColumn<EmployeePolicy>[] = [
    {
      key: "policy",
      header: "Policy",
      cell: (p) => (
        <span>
          <strong className="block">{p.title}</strong>
          <span className="text-muted text-xs">{p.policyCode}</span>
        </span>
      ),
    },
    { key: "version", header: "Version", cell: (p) => `v${p.versionNumber}` },
    {
      key: "status",
      header: "Reading status",
      cell: (p) =>
        p.acknowledgedAt ? (
          <StatusBadge tone="success">Acknowledged</StatusBadge>
        ) : (
          <StatusBadge tone="warning">Reading required</StatusBadge>
        ),
    },
    {
      key: "action",
      header: "Action",
      cell: (p) => (
        <Button
          variant="secondary"
          onClick={() => {
            setConfirmed(false);
            setSelected({ policyId: p.policyId, versionId: p.versionId });
          }}
        >
          <Eye aria-hidden="true" className="size-4" />
          Read policy
        </Button>
      ),
    },
  ];
  function submit(e: FormEvent) {
    e.preventDefault();
    setQuery((current) => {
      const next = { ...current, page: 1 };
      const q = search.trim();
      if (q) next.q = q;
      else delete next.q;
      return next;
    });
  }
  async function confirm() {
    if (!selected || !confirmed) return;
    try {
      await mutation.mutateAsync(selected);
      toast.success(
        "Policy acknowledged",
        "Your confirmation has been recorded.",
      );
      setSelected(null);
    } catch (error) {
      toast.error(
        "Unable to confirm reading",
        error instanceof Error ? error.message : "Please try again.",
      );
    }
  }
  if (session.isPending)
    return (
      <div
        aria-label="Checking policy access"
        className="bg-neutral-soft h-56 animate-pulse rounded-xl"
      />
    );
  if (!allowed) return <Alert>Insufficient permissions</Alert>;
  return (
    <>
      <ProductPageHeader
        title="Policies requiring acknowledgement"
        description="Read policies applicable to your department and confirm your understanding."
        showSampleNotice={false}
      />
      <ProductPanel
        title="Applicable policies"
        description={
          list.data
            ? `${list.data.pagination.total} policies found`
            : "Published policies assigned to your department"
        }
      >
        <form
          className="border-border flex flex-col gap-2 border-b p-4 sm:flex-row"
          onSubmit={submit}
        >
          <label className="relative flex-1">
            <span className="sr-only">Search policies</span>
            <Search
              aria-hidden="true"
              className="text-muted absolute top-1/2 left-3 size-4 -translate-y-1/2"
            />
            <Input
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search policies"
            />
          </label>
          <Select
            aria-label="Reading status"
            value={query.status}
            onChange={(e) =>
              setQuery((c) => ({
                ...c,
                page: 1,
                status: e.target.value as EmployeePolicyQuery["status"],
              }))
            }
          >
            <option value="all">All statuses</option>
            <option value="pending">Reading required</option>
            <option value="acknowledged">Acknowledged</option>
          </Select>
          <Button type="submit">Search</Button>
        </form>
        <div className="p-4">
          {list.isPending ? (
            <div
              aria-label="Loading policies"
              className="bg-neutral-soft h-56 animate-pulse rounded-xl"
            />
          ) : list.isError ? (
            <Alert>Unable to load applicable policies.</Alert>
          ) : list.data?.items.length ? (
            <DataTable
              columns={columns}
              rows={list.data.items}
              getRowKey={(p) => p.versionId}
            />
          ) : (
            <EmptyState
              title="No applicable policies"
              description="No published policies match this view."
            />
          )}
        </div>
        {list.data ? (
          <div className="border-border border-t p-4">
            <Pagination
              page={query.page}
              pageCount={list.data.pagination.totalPages}
              onPageChange={(page) => setQuery((c) => ({ ...c, page }))}
            />
          </div>
        ) : null}
      </ProductPanel>
      <Dialog
        dialogRef={ref}
        title="Read and acknowledge policy"
        className="max-h-[calc(100dvh-2rem)] w-[min(48rem,calc(100%-2rem))] overflow-y-auto"
        onClose={() => setSelected(null)}
      >
        {detail.isPending ? (
          <div className="bg-neutral-soft h-64 animate-pulse rounded-xl" />
        ) : detail.isError ? (
          <Alert>Unable to load policy content.</Alert>
        ) : detail.data ? (
          <div className="space-y-5">
            <div>
              <p className="text-muted text-xs font-semibold uppercase">
                {detail.data.policyCode} · v{detail.data.version.versionNumber}
              </p>
              <h3 className="mt-1 text-lg font-semibold">
                {detail.data.title}
              </h3>
            </div>
            <section
              aria-label="Policy content"
              className="border-border bg-background max-h-80 overflow-y-auto rounded-lg border p-4 text-sm leading-6 whitespace-pre-wrap"
            >
              {detail.data.version.content}
            </section>
            {detail.data.acknowledgedAt ? (
              <Alert>Already acknowledged.</Alert>
            ) : (
              <label className="border-border flex cursor-pointer items-start gap-3 rounded-lg border p-4">
                <Checkbox
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                />
                <span>
                  <strong className="block text-sm">
                    I have read and understood this policy
                  </strong>
                  <span className="text-muted text-xs">
                    Your confirmation time and request IP will be recorded.
                  </span>
                </span>
              </label>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setSelected(null)}>
                Close
              </Button>
              {!detail.data.acknowledgedAt ? (
                <Button
                  disabled={!confirmed || mutation.isPending}
                  onClick={confirm}
                >
                  {mutation.isPending ? "Confirming…" : "Confirm reading"}
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}
      </Dialog>
    </>
  );
}
