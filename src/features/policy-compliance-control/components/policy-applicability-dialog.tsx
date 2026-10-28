"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  BookOpen,
  Building2,
  FileText,
  Info,
  Loader2,
  Tag,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/feedback/toast";
import { cn } from "@/lib/utils";
import type { OwnedPolicyDraft } from "../schemas/policy-draft-schema";
import {
  definePolicyApplicabilitySchema,
  type DefinePolicyApplicability,
} from "../schemas/policy-applicability-schema";
import {
  useDefinePolicyApplicability,
  usePolicyApplicability,
} from "../hooks/use-policy-applicability";

const roleLabels = {
  ADMIN: "Admin",
  SECURITY_OFFICER: "Security Officer",
  EXECUTIVE: "Executive",
  EMPLOYEE: "Employee",
} as const;

export function PolicyApplicabilityDialog({
  draft,
  onClose,
}: {
  draft: OwnedPolicyDraft | null;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const toast = useToast();
  const query = usePolicyApplicability(
    draft?.policyId ?? null,
    draft?.version.id ?? null,
  );
  const mutation = useDefinePolicyApplicability(
    draft?.policyId ?? "",
    draft?.version.id ?? "",
  );
  const [form, setForm] = useState<DefinePolicyApplicability>({
    departmentIds: [],
    roleCodes: [],
    userGroups: [],
    organizationalScope: null,
    rationale: "",
    referenceBasis: "",
  });
  const [groups, setGroups] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (draft && !dialog.open) dialog.showModal();
    if (!draft && dialog.open) dialog.close();
  }, [draft]);

  useEffect(() => {
    const value = query.data?.applicability;
    if (!query.data) return;
    const task = window.setTimeout(() => {
      setForm(
        value
          ? {
              departmentIds: value.departmentIds,
              roleCodes: value.roleCodes,
              userGroups: value.userGroups,
              organizationalScope: value.organizationalScope,
              rationale: value.rationale,
              referenceBasis: value.referenceBasis,
            }
          : {
              departmentIds: [],
              roleCodes: [],
              userGroups: [],
              organizationalScope: null,
              rationale: "",
              referenceBasis: "",
            },
      );
      setGroups(value?.userGroups.join(", ") ?? "");
    }, 0);
    return () => window.clearTimeout(task);
  }, [query.data]);

  const toggle = <T extends string>(values: T[], value: T): T[] =>
    values.includes(value)
      ? values.filter((item) => item !== value)
      : [...values, value];

  const submit = async (): Promise<void> => {
    setError("");
    const candidate = {
      ...form,
      userGroups: groups
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      organizationalScope: form.organizationalScope?.trim() || null,
    };
    const parsed = definePolicyApplicabilitySchema.safeParse(candidate);
    if (!parsed.success)
      return setError(
        parsed.error.issues[0]?.message ?? "Review the applicability information.",
      );
    try {
      await mutation.mutateAsync(parsed.data);
      toast.success(
        "Applicability saved",
        "The scope and its basis are recorded for this draft version.",
      );
      onClose();
    } catch (reason: unknown) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Unable to save policy applicability.",
      );
    }
  };

  return (
    <Dialog
      dialogRef={ref}
      title="Define policy applicability"
      className="max-h-[calc(100dvh-2rem)] w-[min(48rem,calc(100%-2rem))] overflow-y-auto"
      onCancel={(event) => {
        event.preventDefault();
        if (!mutation.isPending) onClose();
      }}
      onClose={onClose}
    >
      {/* ── Loading skeleton ── */}
      {query.isPending ? (
        <div className="space-y-5" role="status" aria-label="Loading applicability">
          {/* Context bar */}
          <Skeleton className="h-11 w-full rounded-lg" />
          {/* Info hint */}
          <Skeleton className="h-12 w-full rounded-xl" />
          {/* Departments */}
          <div className="space-y-2">
            <Skeleton className="h-5 w-28 rounded" />
            <Skeleton className="h-44 w-full rounded-xl" />
          </div>
          {/* Roles */}
          <div className="space-y-2">
            <Skeleton className="h-5 w-20 rounded" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
          {/* Text fields */}
          <div className="space-y-2">
            <Skeleton className="h-5 w-24 rounded" />
            <Skeleton className="h-9 w-full rounded-lg" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-5 w-32 rounded" />
            <Skeleton className="h-20 w-full rounded-lg" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-5 w-36 rounded" />
            <Skeleton className="h-20 w-full rounded-lg" />
          </div>
          {/* Footer */}
          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Skeleton className="h-9 w-20 rounded-lg" />
            <Skeleton className="h-9 w-32 rounded-lg" />
          </div>
        </div>
      ) : null}

      {/* ── Query error ── */}
      {query.isError ? (
        <div className="border-border bg-neutral-soft/30 flex gap-2.5 rounded-xl border p-3.5">
          <AlertTriangle
            className="mt-0.5 size-4 shrink-0 text-danger"
            strokeWidth={1.8}
          />
          <p className="text-sm">
            Unable to load applicability.{" "}
            <span className="text-muted">{query.error.message}</span>
          </p>
        </div>
      ) : null}

      {/* ── Main form ── */}
      {query.data ? (
        <form
          className="space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          {/* Context bar */}
          <div className="border-border bg-neutral-soft/30 flex flex-wrap items-center gap-3 rounded-lg border p-3.5 text-xs">
            <span className="flex items-center gap-1.5 font-medium">
              <FileText className="size-3.5 text-brand" strokeWidth={1.8} />
              {query.data.policyCode}
            </span>
            <span className="text-border">·</span>
            <span className="text-muted">
              v{draft?.version.versionNumber ?? "—"}
            </span>
            <span className="text-border">·</span>
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-medium",
                query.data.editable
                  ? "bg-success/10 text-success"
                  : "bg-neutral-soft text-muted",
              )}
            >
              {query.data.editable ? "Editable" : "Read-only"}
            </span>
          </div>

          {/* Not-editable warning */}
          {!query.data.editable ? (
            <div className="border-border bg-neutral-soft/30 flex gap-2.5 rounded-xl border p-3.5">
              <AlertTriangle
                className="mt-0.5 size-4 shrink-0 text-warning"
                strokeWidth={1.8}
              />
              <p className="text-sm">
                This version is no longer editable. Applicability settings are
                shown in read-only mode.
              </p>
            </div>
          ) : null}

          {/* Info hint */}
          <div className="border-border bg-neutral-soft/30 flex gap-2.5 rounded-xl border p-3.5">
            <Info className="mt-0.5 size-4 shrink-0 text-brand" strokeWidth={1.8} />
            <p className="text-sm text-muted leading-relaxed">
              Set who and which organizational areas are covered by{" "}
              <strong className="text-foreground">{query.data.policyCode}</strong>.
              At least one scope is required before submission.
            </p>
          </div>

          {/* Error banner */}
          {error ? (
            <div className="border-border bg-neutral-soft/30 flex gap-2.5 rounded-xl border p-3.5">
              <AlertTriangle
                className="mt-0.5 size-4 shrink-0 text-danger"
                strokeWidth={1.8}
              />
              <p className="text-sm text-danger">{error}</p>
            </div>
          ) : null}

          <fieldset disabled={mutation.isPending} className="space-y-5 border-none p-0">
            {/* ── Departments ── */}
            <div className="space-y-3">
              <div className="flex items-start gap-2 border-b border-border pb-2">
                <Building2
                  className="mt-0.5 size-4 shrink-0 text-brand"
                  strokeWidth={1.8}
                />
                <h3 className="text-sm font-semibold">Departments</h3>
              </div>
              {query.data.options.departments.length === 0 ? (
                <div className="py-8 text-center">
                  <Building2 className="mx-auto size-8 stroke-1 text-muted" />
                  <p className="mt-2 text-sm text-muted">No departments available.</p>
                </div>
              ) : (
                <div className="border-border overflow-hidden rounded-xl border">
                  <div className="divide-y divide-border max-h-44 overflow-y-auto">
                    {query.data.options.departments.map((department) => (
                      <label
                        key={department.id}
                        className={cn(
                          "flex cursor-pointer items-center gap-2.5 px-3 py-2.5 text-xs hover:bg-neutral-soft/60",
                          form.departmentIds.includes(department.id) &&
                            "bg-brand/5",
                        )}
                      >
                        <Checkbox
                          checked={form.departmentIds.includes(department.id)}
                          onChange={() =>
                            setForm((current) => ({
                              ...current,
                              departmentIds: toggle(
                                current.departmentIds,
                                department.id,
                              ),
                            }))
                          }
                        />
                        <span className="font-medium">{department.name}</span>
                        <span className="text-muted">({department.code})</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── Roles ── */}
            <div className="space-y-3">
              <div className="flex items-start gap-2 border-b border-border pb-2">
                <Users
                  className="mt-0.5 size-4 shrink-0 text-brand"
                  strokeWidth={1.8}
                />
                <h3 className="text-sm font-semibold">Roles</h3>
              </div>
              <div className="border-border overflow-hidden rounded-xl border">
                <div className="divide-y divide-border">
                  {query.data.options.roles.map((role) => (
                    <label
                      key={role}
                      className={cn(
                        "flex cursor-pointer items-center gap-2.5 px-3 py-2.5 text-xs hover:bg-neutral-soft/60",
                        form.roleCodes.includes(role) && "bg-brand/5",
                      )}
                    >
                      <Checkbox
                        checked={form.roleCodes.includes(role)}
                        onChange={() =>
                          setForm((current) => ({
                            ...current,
                            roleCodes: toggle(current.roleCodes, role),
                          }))
                        }
                      />
                      <span className="font-medium">{roleLabels[role]}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* ── User groups ── */}
            <div className="space-y-3">
              <div className="flex items-start gap-2 border-b border-border pb-2">
                <Tag
                  className="mt-0.5 size-4 shrink-0 text-brand"
                  strokeWidth={1.8}
                />
                <h3 className="text-sm font-semibold">User groups</h3>
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-muted uppercase tracking-wide" htmlFor="policy-app-groups">
                  Group names
                </label>
                <Input
                  id="policy-app-groups"
                  value={groups}
                  maxLength={2000}
                  onChange={(event) => setGroups(event.target.value)}
                  placeholder="e.g. New hires, Remote workforce"
                />
                <p className="text-muted text-xs">
                  Separate group names with commas.
                </p>
              </div>
            </div>

            {/* ── Organizational scope ── */}
            <div className="space-y-3">
              <div className="flex items-start gap-2 border-b border-border pb-2">
                <Building2
                  className="mt-0.5 size-4 shrink-0 text-brand"
                  strokeWidth={1.8}
                />
                <h3 className="text-sm font-semibold">Organizational scope</h3>
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-muted uppercase tracking-wide" htmlFor="policy-app-org-scope">
                  Scope description
                </label>
                <Textarea
                  id="policy-app-org-scope"
                  value={form.organizationalScope ?? ""}
                  maxLength={2000}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      organizationalScope: event.target.value,
                    }))
                  }
                  placeholder="Describe locations, subsidiaries, business units, or other boundaries."
                />
              </div>
            </div>

            {/* ── Applicability rationale ── */}
            <div className="space-y-3">
              <div className="flex items-start gap-2 border-b border-border pb-2">
                <FileText
                  className="mt-0.5 size-4 shrink-0 text-brand"
                  strokeWidth={1.8}
                />
                <h3 className="text-sm font-semibold">
                  Applicability rationale{" "}
                  <span className="text-danger">*</span>
                </h3>
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-muted uppercase tracking-wide" htmlFor="policy-app-rationale">
                  Rationale
                </label>
                <Textarea
                  id="policy-app-rationale"
                  required
                  minLength={20}
                  maxLength={2000}
                  value={form.rationale}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      rationale: event.target.value,
                    }))
                  }
                  placeholder="Explain why the selected audience and boundaries apply…"
                />
                <p className="text-muted text-xs">
                  Explain why the selected audience and boundaries apply.
                </p>
              </div>
            </div>

            {/* ── Reference basis ── */}
            <div className="space-y-3">
              <div className="flex items-start gap-2 border-b border-border pb-2">
                <BookOpen
                  className="mt-0.5 size-4 shrink-0 text-brand"
                  strokeWidth={1.8}
                />
                <h3 className="text-sm font-semibold">
                  Reference basis{" "}
                  <span className="text-danger">*</span>
                </h3>
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-muted uppercase tracking-wide" htmlFor="policy-app-ref-basis">
                  Reference
                </label>
                <Textarea
                  id="policy-app-ref-basis"
                  required
                  minLength={5}
                  maxLength={2000}
                  value={form.referenceBasis}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      referenceBasis: event.target.value,
                    }))
                  }
                  placeholder="Cite the standard, regulation, contract, risk, or business requirement…"
                />
                <p className="text-muted text-xs">
                  Cite the standard, regulation, contract, risk, or business
                  requirement.
                </p>
              </div>
            </div>
          </fieldset>

          {/* ── Footer ── */}
          <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
            <Button
              type="button"
              variant="secondary"
              disabled={mutation.isPending}
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending || !query.data.editable}
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="mr-1.5 size-3.5 animate-spin" strokeWidth={2} />
                  Saving…
                </>
              ) : (
                "Save applicability"
              )}
            </Button>
          </div>
        </form>
      ) : null}
    </Dialog>
  );
}
