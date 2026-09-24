"use client";

import { Building2, Search } from "lucide-react";
import { useRef, useState, type FormEvent } from "react";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/data-display/data-table";
import {
  ProductPageHeader,
  ProductPanel,
  StatusBadge,
} from "@/components/data-display/static-product";
import { EmptyState } from "@/components/feedback/empty-state";
import { Pagination } from "@/components/data-display/pagination";
import { useToast } from "@/components/feedback/toast";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useSessionUser } from "@/features/authentication-account";
import {
  useAssignPolicyDepartments,
  usePolicyDepartmentAssignments,
} from "../hooks/use-policy-department-assignments";
import type { PolicyDepartmentAssignment } from "../schemas/policy-department-assignment-schema";

export function PolicyDepartmentAssignmentManager({
  onBack,
}: {
  onBack?: () => void;
}) {
  const session = useSessionUser();
  const canAssign =
    session.data?.permissions.includes("policies.assign-department") ?? false;
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [queryText, setQueryText] = useState<string>();
  const query = usePolicyDepartmentAssignments(
    { page, limit: 20, ...(queryText ? { q: queryText } : {}) },
    canAssign,
  );
  const mutation = useAssignPolicyDepartments();
  const toast = useToast();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [selectedPolicy, setSelectedPolicy] =
    useState<PolicyDepartmentAssignment>();
  const [departmentIds, setDepartmentIds] = useState<string[]>([]);
  const [message, setMessage] = useState<string>();

  const openAssignment = (policy: PolicyDepartmentAssignment): void => {
    setSelectedPolicy(policy);
    setDepartmentIds(policy.departments.map((department) => department.id));
    setMessage(undefined);
    dialogRef.current?.showModal();
  };
  const close = (): void => {
    if (mutation.isPending) return;
    dialogRef.current?.close();
    setSelectedPolicy(undefined);
    setMessage(undefined);
  };
  const save = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!selectedPolicy) return;
    setMessage(undefined);
    try {
      const result = await mutation.mutateAsync({
        policyId: selectedPolicy.id,
        body: { departmentIds },
      });
      dialogRef.current?.close();
      setSelectedPolicy(undefined);
      toast.success(
        "Department assignments updated",
        `${result.policyCode} is assigned to ${result.departmentIds.length} department${result.departmentIds.length === 1 ? "" : "s"}.`,
      );
    } catch (error: unknown) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to update department assignments.",
      );
    }
  };

  const columns: readonly DataTableColumn<PolicyDepartmentAssignment>[] = [
    {
      key: "policy",
      header: "Policy",
      cell: (policy) => (
        <span className="block min-w-56">
          <strong className="block">{policy.title}</strong>
          <span className="text-muted text-xs">{policy.policyCode}</span>
        </span>
      ),
    },
    {
      key: "departments",
      header: "Assigned departments",
      cell: (policy) =>
        policy.departments.length === 0 ? (
          <span className="text-muted">Organization-wide / unassigned</span>
        ) : (
          <div className="flex max-w-xl flex-wrap gap-1.5">
            {policy.departments.map((department) => (
              <StatusBadge key={department.id} tone="neutral">
                {department.code}
              </StatusBadge>
            ))}
          </div>
        ),
    },
    {
      key: "action",
      header: "Action",
      cell: (policy) => (
        <Button
          className="min-h-10 px-3"
          onClick={() => openAssignment(policy)}
          variant="secondary"
        >
          <Building2 aria-hidden="true" className="size-4" strokeWidth={1.8} />
          Assign departments
        </Button>
      ),
    },
  ];

  if (session.isPending) {
    return (
      <div
        aria-label="Checking policy permissions"
        className="bg-neutral-soft h-56 animate-pulse rounded-xl"
      />
    );
  }
  if (!canAssign) {
    return (
      <Alert>
        <strong className="block">
          You do not have permission to assign policies
        </strong>
        <span>
          Contact an administrator to request policies.assign-department.
        </span>
      </Alert>
    );
  }

  return (
    <>
      <ProductPageHeader
        description="Assign published information security policies to the departments where they apply."
        showSampleNotice={false}
        title="Assign policies to departments"
        {...(onBack
          ? { secondaryAction: "Back to drafts", onSecondaryAction: onBack }
          : {})}
      />
      <ProductPanel
        description="Only published policies and active departments are available."
        title="Published policies"
      >
        <div className="space-y-4 p-5">
          <form
            className="flex flex-col gap-2 sm:flex-row"
            onSubmit={(event) => {
              event.preventDefault();
              setPage(1);
              setQueryText(search.trim() || undefined);
            }}
          >
            <div className="relative flex-1">
              <Search
                aria-hidden="true"
                className="text-muted pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
                strokeWidth={1.8}
              />
              <Input
                aria-label="Search policies"
                className="pl-9"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <Button type="submit">Search</Button>
          </form>
          {query.isPending ? (
            <div
              aria-label="Loading policy assignments"
              className="bg-neutral-soft h-56 animate-pulse rounded-xl"
            />
          ) : query.isError ? (
            <Alert>
              <strong className="block">
                Unable to load policy assignments
              </strong>
              <span>
                {query.error instanceof Error
                  ? query.error.message
                  : "Please try again."}
              </span>
            </Alert>
          ) : query.data.items.length === 0 ? (
            <EmptyState
              description="Publish a policy before assigning it to departments."
              title="No published policies found"
            />
          ) : (
            <>
              <DataTable
                columns={columns}
                rows={query.data.items}
                getRowKey={(policy) => policy.id}
              />
              <Pagination
                page={query.data.pagination.page}
                pageCount={query.data.pagination.totalPages}
                onPageChange={setPage}
              />
            </>
          )}
        </div>
      </ProductPanel>

      <Dialog
        className="max-h-[calc(100dvh-2rem)] w-[min(40rem,calc(100%-2rem))] overflow-y-auto"
        dialogRef={dialogRef}
        title={
          selectedPolicy
            ? `Assign ${selectedPolicy.policyCode}`
            : "Assign policy"
        }
        onCancel={(event) => {
          event.preventDefault();
          close();
        }}
        onClose={() => setSelectedPolicy(undefined)}
      >
        <form className="space-y-5" onSubmit={save}>
          {message ? (
            <Alert
              className="border-danger/25 bg-danger-soft text-danger"
              role="alert"
            >
              {message}
            </Alert>
          ) : null}
          {query.data?.departmentsTruncated ? (
            <Alert>Only the first 200 active departments are available.</Alert>
          ) : null}
          <fieldset className="space-y-2">
            <legend className="font-medium">Applicable departments</legend>
            <p className="text-muted text-sm">
              Clear every selection to make the policy organization-wide or
              unassigned.
            </p>
            <div className="border-border max-h-80 space-y-1 overflow-y-auto rounded-lg border p-2">
              {query.data?.departments.map((department) => {
                const checked = departmentIds.includes(department.id);
                return (
                  <label
                    className="hover:bg-neutral-soft flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-3 py-2"
                    key={department.id}
                  >
                    <Checkbox
                      checked={checked}
                      onChange={() =>
                        setDepartmentIds((current) =>
                          checked
                            ? current.filter((id) => id !== department.id)
                            : [...current, department.id],
                        )
                      }
                    />
                    <span className="min-w-0">
                      <strong className="block text-sm">
                        {department.name}
                      </strong>
                      <span className="text-muted text-xs">
                        {department.code}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
          <div className="border-border flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              disabled={mutation.isPending}
              onClick={close}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving assignments…" : "Save assignments"}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
