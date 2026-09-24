"use client";

import { Link2, Search } from "lucide-react";
import { useRef, useState, type FormEvent } from "react";
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
import { useSessionUser } from "@/features/authentication-account";
import {
  useComplianceFrameworks,
  useFrameworkControls,
  usePolicyControlMappings,
  useReplacePolicyControlMappings,
} from "../hooks/use-policy-control-mappings";
import type { PolicyControlMappingItem } from "../schemas/policy-control-mapping-schema";

type SelectedMapping = { controlId: string; notes: string };

export function PolicyControlMappingManager({
  onBack,
}: {
  onBack?: () => void;
}) {
  const session = useSessionUser();
  const allowed =
    session.data?.permissions.includes("compliance.map-controls") ?? false;
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [queryText, setQueryText] = useState<string>();
  const [selectedPolicy, setSelectedPolicy] =
    useState<PolicyControlMappingItem>();
  const [frameworkId, setFrameworkId] = useState<string>();
  const [controlSearch, setControlSearch] = useState("");
  const [controlQuery, setControlQuery] = useState<string>();
  const [controlPage, setControlPage] = useState(1);
  const [selectedMappings, setSelectedMappings] = useState<SelectedMapping[]>(
    [],
  );
  const [message, setMessage] = useState<string>();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const list = usePolicyControlMappings(
    { page, limit: 20, ...(queryText ? { q: queryText } : {}) },
    allowed,
  );
  const frameworks = useComplianceFrameworks(allowed);
  const controls = useFrameworkControls(frameworkId, {
    page: controlPage,
    limit: 50,
    ...(controlQuery ? { q: controlQuery } : {}),
  });
  const mutation = useReplacePolicyControlMappings();
  const toast = useToast();

  const selectFramework = (
    nextFrameworkId: string,
    policy = selectedPolicy,
  ): void => {
    setFrameworkId(nextFrameworkId || undefined);
    setControlPage(1);
    setControlSearch("");
    setControlQuery(undefined);
    setSelectedMappings(
      policy?.mappings
        .filter((mapping) => mapping.framework.id === nextFrameworkId)
        .map((mapping) => ({
          controlId: mapping.controlId,
          notes: mapping.notes ?? "",
        })) ?? [],
    );
  };

  const open = (policy: PolicyControlMappingItem): void => {
    const initialFrameworkId = frameworks.data?.[0]?.id;
    setSelectedPolicy(policy);
    setMessage(undefined);
    selectFramework(initialFrameworkId ?? "", policy);
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
    if (!selectedPolicy || !frameworkId) return;
    try {
      await mutation.mutateAsync({
        policyId: selectedPolicy.policyId,
        versionId: selectedPolicy.versionId,
        frameworkId,
        body: {
          mappings: selectedMappings.map((mapping) => ({
            controlId: mapping.controlId,
            notes: mapping.notes.trim() || null,
          })),
        },
      });
      close();
      toast.success(
        "Control mappings updated",
        `${selectedPolicy.policyCode} is mapped to ${selectedMappings.length} controls in the selected framework.`,
      );
    } catch (error: unknown) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to save control mappings.",
      );
    }
  };

  const columns: readonly DataTableColumn<PolicyControlMappingItem>[] = [
    {
      key: "policy",
      header: "Published policy version",
      cell: (policy) => (
        <span className="block min-w-56">
          <strong className="block">{policy.title}</strong>
          <span className="text-muted text-xs">
            {policy.policyCode} · v{policy.versionNumber}
          </span>
        </span>
      ),
    },
    {
      key: "frameworks",
      header: "Mapped frameworks",
      cell: (policy) => {
        const unique = Array.from(
          new Map(
            policy.mappings.map((mapping) => [
              mapping.framework.id,
              mapping.framework,
            ]),
          ).values(),
        );
        return unique.length ? (
          <div className="flex max-w-xl flex-wrap gap-1.5">
            {unique.map((framework) => (
              <StatusBadge key={framework.id} tone="neutral">
                {framework.code}
                {framework.version ? ` ${framework.version}` : ""}
              </StatusBadge>
            ))}
          </div>
        ) : (
          <span className="text-muted">Not mapped</span>
        );
      },
    },
    {
      key: "coverage",
      header: "Mapped controls",
      cell: (policy) => (
        <span className="tabular-nums">{policy.mappings.length}</span>
      ),
    },
    {
      key: "action",
      header: "Action",
      cell: (policy) => (
        <Button
          className="min-h-10"
          variant="secondary"
          onClick={() => open(policy)}
        >
          <Link2 aria-hidden="true" className="size-4" strokeWidth={1.8} />
          Map controls
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
  if (!allowed) {
    return (
      <Alert>
        Contact an administrator to request compliance.map-controls.
      </Alert>
    );
  }

  return (
    <>
      <ProductPageHeader
        title="Map controls to standard frameworks"
        description="Connect published policy versions to ISO, NIST, or other compliance framework controls."
        showSampleNotice={false}
        {...(onBack
          ? { secondaryAction: "Back to policies", onSecondaryAction: onBack }
          : {})}
      />
      <ProductPanel
        title="Published policy versions"
        description="Mappings are maintained separately for each framework."
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
              />
              <Input
                aria-label="Search published policies"
                className="pl-9"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <Button type="submit">Search</Button>
          </form>
          {list.isPending ? (
            <div
              aria-label="Loading policy control mappings"
              className="bg-neutral-soft h-56 animate-pulse rounded-xl"
            />
          ) : list.isError ? (
            <Alert>
              Unable to load policy control mappings. Please try again.
            </Alert>
          ) : list.data.items.length === 0 ? (
            <EmptyState
              title="No published policy versions"
              description="Publish a policy version before mapping framework controls."
            />
          ) : (
            <>
              <DataTable
                columns={columns}
                rows={list.data.items}
                getRowKey={(policy) => policy.versionId}
              />
              <Pagination
                page={list.data.pagination.page}
                pageCount={list.data.pagination.totalPages}
                onPageChange={setPage}
              />
            </>
          )}
        </div>
      </ProductPanel>

      <Dialog
        className="max-h-[calc(100dvh-2rem)] w-[min(52rem,calc(100%-2rem))] overflow-y-auto"
        dialogRef={dialogRef}
        title={
          selectedPolicy
            ? `Map ${selectedPolicy.policyCode} v${selectedPolicy.versionNumber}`
            : "Map controls"
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
          {frameworks.isError ? (
            <Alert>Unable to load compliance frameworks.</Alert>
          ) : null}
          {frameworks.data?.length === 0 ? (
            <Alert>
              No compliance frameworks are available. Import a framework and its
              controls before creating mappings.
            </Alert>
          ) : null}
          <label className="block space-y-2">
            <span className="text-sm font-medium">Standard framework</span>
            <Select
              value={frameworkId ?? ""}
              onChange={(event) => selectFramework(event.target.value)}
              required
            >
              <option value="">Select a framework</option>
              {frameworks.data?.map((framework) => (
                <option key={framework.id} value={framework.id}>
                  {framework.name}
                  {framework.version ? ` (${framework.version})` : ""} ·{" "}
                  {framework.controlCount} controls
                </option>
              ))}
            </Select>
          </label>
          {frameworkId ? (
            <fieldset className="space-y-3">
              <legend className="font-medium">Framework controls</legend>
              <div className="flex gap-2">
                <Input
                  aria-label="Search framework controls"
                  value={controlSearch}
                  onChange={(event) => setControlSearch(event.target.value)}
                />
                <Button
                  type="button"
                  onClick={() => {
                    setControlPage(1);
                    setControlQuery(controlSearch.trim() || undefined);
                  }}
                >
                  Search
                </Button>
              </div>
              {controls.isPending ? (
                <div
                  aria-label="Loading framework controls"
                  className="bg-neutral-soft h-48 animate-pulse rounded-xl"
                />
              ) : controls.isError ? (
                <Alert>Unable to load framework controls.</Alert>
              ) : controls.data?.items.length === 0 ? (
                <EmptyState
                  title="No controls found"
                  description="This framework has no matching controls."
                />
              ) : (
                <div className="border-border max-h-96 space-y-1 overflow-y-auto rounded-lg border p-2">
                  {controls.data?.items.map((control) => {
                    const selected = selectedMappings.find(
                      (mapping) => mapping.controlId === control.id,
                    );
                    return (
                      <div
                        className="hover:bg-neutral-soft rounded-lg p-3"
                        key={control.id}
                      >
                        <label className="flex min-h-10 cursor-pointer items-start gap-3">
                          <Checkbox
                            checked={Boolean(selected)}
                            onChange={() =>
                              setSelectedMappings((current) =>
                                selected
                                  ? current.filter(
                                      (mapping) =>
                                        mapping.controlId !== control.id,
                                    )
                                  : [
                                      ...current,
                                      { controlId: control.id, notes: "" },
                                    ],
                              )
                            }
                          />
                          <span className="min-w-0">
                            <strong className="block text-sm">
                              {control.code} — {control.title}
                            </strong>
                            {control.description ? (
                              <span className="text-muted block text-xs">
                                {control.description}
                              </span>
                            ) : null}
                          </span>
                        </label>
                        {selected ? (
                          <Input
                            aria-label={`Mapping notes for ${control.code}`}
                            className="mt-2"
                            maxLength={1000}
                            placeholder="Optional mapping notes"
                            value={selected.notes}
                            onChange={(event) =>
                              setSelectedMappings((current) =>
                                current.map((mapping) =>
                                  mapping.controlId === control.id
                                    ? { ...mapping, notes: event.target.value }
                                    : mapping,
                                ),
                              )
                            }
                          />
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
              {controls.data ? (
                <Pagination
                  page={controls.data.pagination.page}
                  pageCount={controls.data.pagination.totalPages}
                  onPageChange={setControlPage}
                />
              ) : null}
              <p className="text-muted text-sm">
                {selectedMappings.length} controls selected. Saving replaces
                mappings only for this framework.
              </p>
            </fieldset>
          ) : null}
          <div className="border-border flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              disabled={mutation.isPending}
              onClick={close}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!frameworkId || mutation.isPending}>
              {mutation.isPending ? "Saving mappings…" : "Save mappings"}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
