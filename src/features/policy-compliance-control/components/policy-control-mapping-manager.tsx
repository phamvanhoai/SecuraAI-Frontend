"use client";

import {
  AlertTriangle,
  FileText,
  Info,
  Link2,
  Loader2,
  Search,
  Shield,
} from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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
  hideHeader = false,
}: {
  onBack?: () => void;
  hideHeader?: boolean;
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
      {!hideHeader && (
        <ProductPageHeader
          title="Map controls to standard frameworks"
          description="Connect published policy versions to ISO, NIST, or other compliance framework controls."
          showSampleNotice={false}
          {...(onBack
            ? { secondaryAction: "Back to policies", onSecondaryAction: onBack }
            : {})}
        />
      )}
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
          {/* Context bar */}
          {selectedPolicy ? (
            <div className="border-border bg-neutral-soft/30 flex flex-wrap items-center gap-3 rounded-lg border p-3.5 text-xs">
              <span className="flex items-center gap-1.5 font-medium">
                <FileText className="size-3.5 text-brand" strokeWidth={1.8} />
                {selectedPolicy.policyCode}
              </span>
              <span className="text-border">·</span>
              <span className="text-muted">v{selectedPolicy.versionNumber}</span>
            </div>
          ) : null}

          {/* Error banner */}
          {message ? (
            <div className="border-border bg-neutral-soft/30 flex gap-2.5 rounded-xl border p-3.5" role="alert">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-danger" strokeWidth={1.8} />
              <p className="text-sm text-danger">{message}</p>
            </div>
          ) : null}

          {/* Frameworks error */}
          {frameworks.isError ? (
            <div className="border-border bg-neutral-soft/30 flex gap-2.5 rounded-xl border p-3.5">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-danger" strokeWidth={1.8} />
              <p className="text-sm">Unable to load compliance frameworks.</p>
            </div>
          ) : null}

          {/* No frameworks hint */}
          {frameworks.data?.length === 0 ? (
            <div className="border-border bg-neutral-soft/30 flex gap-2.5 rounded-xl border p-3.5">
              <Info className="mt-0.5 size-4 shrink-0 text-brand" strokeWidth={1.8} />
              <p className="text-sm text-muted">
                No compliance frameworks are available. Import a framework and its
                controls before creating mappings.
              </p>
            </div>
          ) : null}

          {/* Framework selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-muted uppercase tracking-wide" htmlFor="ctrl-framework-select">
              Standard framework
            </label>
            <select
              id="ctrl-framework-select"
              className="border-border bg-background focus:ring-brand/30 w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
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
            </select>
          </div>

          {/* Framework controls */}
          {frameworkId ? (
            <div className="space-y-3">
              <div className="flex items-start gap-2 border-b border-border pb-2">
                <Shield className="mt-0.5 size-4 shrink-0 text-brand" strokeWidth={1.8} />
                <h3 className="text-sm font-semibold">Framework controls</h3>
              </div>

              {/* Control search */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search
                    aria-hidden="true"
                    className="text-muted pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
                    strokeWidth={1.8}
                  />
                  <Input
                    aria-label="Search framework controls"
                    className="pl-9"
                    value={controlSearch}
                    onChange={(event) => setControlSearch(event.target.value)}
                  />
                </div>
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

              {/* Controls list */}
              {controls.isPending ? (
                <div className="space-y-2" aria-label="Loading framework controls" role="status">
                  <Skeleton className="h-14 w-full rounded-lg" />
                  <Skeleton className="h-14 w-full rounded-lg" />
                  <Skeleton className="h-14 w-full rounded-lg" />
                </div>
              ) : controls.isError ? (
                <div className="border-border bg-neutral-soft/30 flex gap-2.5 rounded-xl border p-3.5">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-danger" strokeWidth={1.8} />
                  <p className="text-sm">Unable to load framework controls.</p>
                </div>
              ) : controls.data?.items.length === 0 ? (
                <div className="py-8 text-center">
                  <Shield className="mx-auto size-8 stroke-1 text-muted" />
                  <h4 className="mt-3 text-sm font-medium">No controls found</h4>
                  <p className="text-muted mt-1 text-xs">This framework has no matching controls.</p>
                </div>
              ) : (
                <div className="border-border overflow-hidden rounded-xl border">
                  <div className="divide-y divide-border max-h-96 overflow-y-auto">
                    {controls.data?.items.map((control) => {
                      const selected = selectedMappings.find(
                        (mapping) => mapping.controlId === control.id,
                      );
                      return (
                        <div key={control.id} className="px-3 py-2.5 hover:bg-neutral-soft/60">
                          <label className="flex cursor-pointer items-start gap-2.5 text-xs">
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
                              <strong className="block font-medium">
                                {control.code} — {control.title}
                              </strong>
                              {control.description ? (
                                <span className="text-muted block mt-0.5">
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
                </div>
              )}
              {controls.data ? (
                <Pagination
                  page={controls.data.pagination.page}
                  pageCount={controls.data.pagination.totalPages}
                  onPageChange={setControlPage}
                />
              ) : null}
              <p className="text-muted text-xs">
                {selectedMappings.length} controls selected. Saving replaces
                mappings only for this framework.
              </p>
            </div>
          ) : null}

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
            <Button
              type="button"
              variant="secondary"
              disabled={mutation.isPending}
              onClick={close}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!frameworkId || mutation.isPending}>
              {mutation.isPending ? (
                <>
                  <Loader2 className="mr-1.5 size-3.5 animate-spin" strokeWidth={2} />
                  Saving…
                </>
              ) : (
                "Save mappings"
              )}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
