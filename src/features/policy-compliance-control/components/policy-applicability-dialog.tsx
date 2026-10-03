"use client";

import { useEffect, useRef, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/feedback/toast";
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
        parsed.error.issues[0]?.message ??
          "Review the applicability information.",
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
      {query.isPending ? (
        <div
          className="bg-neutral-soft h-72 animate-pulse rounded-xl motion-reduce:animate-none"
          aria-label="Loading applicability"
          role="status"
        />
      ) : null}
      {query.isError ? (
        <Alert>Unable to load applicability. {query.error.message}</Alert>
      ) : null}
      {query.data ? (
        <form
          className="space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          <p className="text-muted text-sm leading-6">
            Set who and which organizational areas are covered by{" "}
            <strong className="text-foreground">{query.data.policyCode}</strong>
            . At least one scope is required before submission.
          </p>
          {error ? (
            <Alert className="border-danger/25 bg-danger-soft text-danger">
              {error}
            </Alert>
          ) : null}
          <fieldset>
            <legend className="text-sm font-semibold">Departments</legend>
            <div className="border-border mt-2 grid max-h-44 gap-1 overflow-y-auto rounded-lg border p-2 sm:grid-cols-2">
              {query.data.options.departments.map((department) => (
                <label
                  className="hover:bg-neutral-soft flex min-h-10 cursor-pointer items-center gap-2 rounded-md px-2 text-sm"
                  key={department.id}
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
                  <span>
                    {department.name}{" "}
                    <span className="text-muted">({department.code})</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="text-sm font-semibold">Roles</legend>
            <div className="mt-2 grid gap-1 sm:grid-cols-2">
              {query.data.options.roles.map((role) => (
                <label
                  className="hover:bg-neutral-soft flex min-h-10 cursor-pointer items-center gap-2 rounded-md px-2 text-sm"
                  key={role}
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
                  {roleLabels[role]}
                </label>
              ))}
            </div>
          </fieldset>
          <label className="block text-sm font-medium">
            User groups
            <Input
              className="mt-1"
              value={groups}
              maxLength={2000}
              onChange={(event) => setGroups(event.target.value)}
              placeholder="Example: New hires, Remote workforce"
            />
            <span className="text-muted mt-1 block text-xs font-normal">
              Separate group names with commas.
            </span>
          </label>
          <label className="block text-sm font-medium">
            Organizational scope
            <Textarea
              className="mt-1"
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
          </label>
          <label className="block text-sm font-medium">
            Applicability rationale
            <Textarea
              className="mt-1"
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
            />
            <span className="text-muted mt-1 block text-xs font-normal">
              Explain why the selected audience and boundaries apply.
            </span>
          </label>
          <label className="block text-sm font-medium">
            Reference basis
            <Textarea
              className="mt-1"
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
            />
            <span className="text-muted mt-1 block text-xs font-normal">
              Cite the standard, regulation, contract, risk, or business
              requirement.
            </span>
          </label>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
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
              {mutation.isPending ? "Saving…" : "Save applicability"}
            </Button>
          </div>
        </form>
      ) : null}
    </Dialog>
  );
}
