"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  AlertTriangle,
  Info,
  Loader2,
  ShieldCheck,
  UserCog,
  Briefcase,
} from "lucide-react";
import { useToast } from "@/components/feedback/toast";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  useAccessAssignmentOptions,
  useAssignUserAccess,
  useUserAccessAssignment,
} from "../hooks/use-assign-user-roles";
import type { AccessAssignmentPayload } from "../api/assign-user-roles";

type RoleCode = AccessAssignmentPayload["role"];

export function AssignUserRolesDialog({
  userId,
  onClose,
}: {
  userId: string | null;
  onClose: () => void;
}) {
  return <AssignmentForm key={userId} userId={userId} onClose={onClose} />;
}

function AssignmentForm({
  userId,
  onClose,
}: {
  userId: string | null;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const assignment = useUserAccessAssignment(userId);
  const options = useAccessAssignmentOptions(
    userId !== null && assignment.isSuccess,
  );
  const mutation = useAssignUserAccess();
  const toast = useToast();
  const [draft, setDraft] = useState<{ role: RoleCode; codes: string[] }>();
  const [message, setMessage] = useState<string>();

  const role = draft?.role ?? assignment.data?.role ?? "EMPLOYEE";
  const selectedCodes =
    draft?.codes ??
    assignment.data?.scopes.map((scope) => scope.scopeCode) ??
    [];
  const counts = assignment.data?.ownershipSummary;

  const ownedCount = (code: string) =>
    code === "RISK_OWNER"
      ? (counts?.risks ?? 0)
      : code === "CONTROL_OWNER"
        ? (counts?.securityControls ?? 0)
        : code === "ASSET_OWNER"
          ? (counts?.assets ?? 0)
          : 0;

  const codes =
    role === "EMPLOYEE"
      ? [
          ...new Set([
            ...selectedCodes,
            ...["RISK_OWNER", "CONTROL_OWNER", "ASSET_OWNER"].filter(
              (code) => ownedCount(code) > 0,
            ),
          ]),
        ]
      : [];

  const loading = assignment.isPending || options.isPending;
  const failed = assignment.isError || options.isError;
  const employeeOwnsRecords =
    assignment.data?.role === "EMPLOYEE" &&
    Boolean(counts && counts.risks + counts.securityControls + counts.assets);

  const close = () => {
    if (!mutation.isPending) onClose();
  };

  useEffect(() => {
    const dialog = dialogRef.current;
    if (userId && !dialog?.open) dialog?.showModal();
    if (!userId && dialog?.open) dialog.close();
  }, [userId]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!userId || loading || failed || mutation.isPending) return;
    if (codes.length > 1) {
      setMessage(
        "Select only one responsibility. Transfer conflicting owned records first.",
      );
      return;
    }
    setMessage(undefined);
    try {
      const result = await mutation.mutateAsync({
        userId,
        payload: {
          role,
          scopes:
            role === "EMPLOYEE"
              ? codes.map((scopeCode) => ({
                  scopeCode,
                  targetType: "GLOBAL" as const,
                  expiresAt: null,
                }))
              : [],
        },
      });
      toast.success(
        "Responsibilities saved",
        result.changed
          ? "Role and business responsibilities updated."
          : "No changes were needed.",
      );
      onClose();
    } catch (error: unknown) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to save responsibilities.",
      );
      void assignment.refetch();
    }
  }

  return (
    <Dialog
      dialogRef={dialogRef}
      title="Assign role, scope &amp; ownership"
      onClose={close}
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      className="max-h-[calc(100dvh-2rem)] w-[min(44rem,calc(100%-2rem))] overflow-y-auto"
    >
      <form onSubmit={(event) => void submit(event)} className="space-y-5">
        {/* ── Context bar ── */}
        <div className="border-border bg-neutral-soft/30 flex flex-wrap items-center gap-3 rounded-lg border p-3.5 text-xs">
          <UserCog className="size-4 shrink-0 text-brand" strokeWidth={1.8} />
          <div className="min-w-0 flex-1">
            <div className="text-foreground truncate text-sm font-semibold">
              {loading ? (
                <Skeleton className="h-4 w-40" />
              ) : (
                (assignment.data?.user.fullName ?? "User access")
              )}
            </div>
            <div className="text-muted mt-0.5 truncate">
              {loading ? (
                <Skeleton className="mt-1 h-3 w-56" />
              ) : (
                (assignment.data?.user.email ?? "")
              )}
            </div>
          </div>
          {!loading && assignment.data?.role ? (
            <span className="bg-neutral-soft border-border inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium">
              {assignment.data.role}
            </span>
          ) : null}
        </div>

        {/* ── Error state ── */}
        {failed ? (
          <div className="border-border bg-neutral-soft/30 flex gap-2.5 rounded-xl border p-3.5">
            <AlertTriangle
              className="mt-0.5 size-4 shrink-0 text-warning"
              strokeWidth={1.8}
            />
            <div className="min-w-0 flex-1 text-sm">
              <p className="font-medium">Failed to load responsibilities</p>
              <p className="text-muted mt-0.5 text-xs">
                Check your connection and try again.
              </p>
              <Button
                type="button"
                variant="secondary"
                className="mt-2"
                onClick={() => {
                  void assignment.refetch();
                  void options.refetch();
                }}
              >
                Try again
              </Button>
            </div>
          </div>
        ) : null}

        {/* ── Loading skeleton ── */}
        {loading ? (
          <div
            role="status"
            aria-label="Loading responsibilities"
            className="space-y-4"
          >
            {/* Role section skeleton */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-11 w-full rounded-lg" />
            </div>
            {/* Responsibilities section skeleton */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-48" />
              <div className="border-border divide-border overflow-hidden rounded-xl border divide-y">
                <div className="flex items-start gap-3 p-3.5">
                  <Skeleton className="mt-0.5 size-4 rounded" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3.5">
                  <Skeleton className="mt-0.5 size-4 rounded" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3.5">
                  <Skeleton className="mt-0.5 size-4 rounded" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* ── Main form ── */}
        {!loading && !failed && assignment.data && options.data ? (
          <>
            {/* Section: System Role */}
            <div className="space-y-3">
              <div className="flex items-start gap-2 border-b border-border pb-2">
                <ShieldCheck
                  className="mt-0.5 size-4 shrink-0 text-brand"
                  strokeWidth={1.8}
                />
                <h3 className="text-sm font-semibold">System role</h3>
              </div>
              <div className="border-border bg-neutral-soft/30 rounded-xl border p-4 space-y-3">
                <div className="space-y-1.5">
                  <label
                    htmlFor="assignment-role"
                    className="block text-xs font-medium uppercase tracking-wide text-muted"
                  >
                    Assigned role
                  </label>
                  <Select
                    id="assignment-role"
                    value={role}
                    disabled={mutation.isPending || employeeOwnsRecords}
                    onChange={(event) =>
                      setDraft({
                        role: event.target.value as RoleCode,
                        codes: [],
                      })
                    }
                  >
                    {options.data.roles.map((item) => (
                      <option value={item.code} key={item.code}>
                        {item.name}
                      </option>
                    ))}
                  </Select>
                </div>
                {employeeOwnsRecords ? (
                  <div className="flex gap-2.5">
                    <AlertTriangle
                      className="mt-0.5 size-4 shrink-0 text-warning"
                      strokeWidth={1.8}
                    />
                    <p className="text-xs text-muted">
                      Transfer all owned records before changing this
                      Employee&apos;s system role.
                    </p>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Section: Business Responsibility */}
            <fieldset
              disabled={mutation.isPending || role !== "EMPLOYEE"}
              className="space-y-3"
            >
              <div className="flex items-start gap-2 border-b border-border pb-2">
                <Briefcase
                  className="mt-0.5 size-4 shrink-0 text-brand"
                  strokeWidth={1.8}
                />
                <div className="min-w-0 flex-1">
                  <legend className="text-sm font-semibold">
                    Business responsibility
                  </legend>
                  <p className="text-muted mt-0.5 text-xs">
                    Select at most one contextual responsibility for this
                    Employee. Individual records are assigned within their
                    respective modules.
                  </p>
                </div>
              </div>

              {role !== "EMPLOYEE" ? (
                <div className="border-border bg-neutral-soft/30 flex gap-2.5 rounded-xl border p-3.5">
                  <Info
                    className="mt-0.5 size-4 shrink-0 text-brand"
                    strokeWidth={1.8}
                  />
                  <p className="text-xs">
                    Business responsibilities apply only to Employees. Other
                    system roles retain their existing workflow rules.
                  </p>
                </div>
              ) : null}

              {codes.length > 1 ? (
                <div className="border-border bg-neutral-soft/30 flex gap-2.5 rounded-xl border p-3.5">
                  <AlertTriangle
                    className="mt-0.5 size-4 shrink-0 text-warning"
                    strokeWidth={1.8}
                  />
                  <p className="text-xs">
                    Select only one responsibility. Transfer records belonging
                    to other responsibilities before saving.
                  </p>
                </div>
              ) : null}

              <div className="border-border divide-border overflow-hidden rounded-xl border divide-y">
                {options.data.scopeCodes.map((item) => {
                  const count = role === "EMPLOYEE" ? ownedCount(item.code) : 0;
                  const isChecked =
                    role === "EMPLOYEE" && codes.includes(item.code);
                  const isLocked =
                    count > 0 ||
                    (employeeOwnsRecords &&
                      ["RISK_OWNER", "CONTROL_OWNER", "ASSET_OWNER"].some(
                        (code) =>
                          code !== item.code && ownedCount(code) > 0,
                      ));
                  return (
                    <label
                      key={item.code}
                      className={cn(
                        "flex min-h-[3rem] cursor-pointer items-start gap-3 p-3.5 transition-colors",
                        isChecked
                          ? "bg-brand/5"
                          : "hover:bg-neutral-soft/50",
                        isLocked && "cursor-not-allowed opacity-60",
                      )}
                    >
                      <input
                        type="checkbox"
                        className="mt-0.5 size-4 accent-brand"
                        checked={isChecked}
                        disabled={isLocked}
                        onChange={() =>
                          setDraft({
                            role,
                            codes: codes.includes(item.code)
                              ? []
                              : [item.code],
                          })
                        }
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium">
                          {item.name}
                        </span>
                        <span className="text-muted block text-xs mt-0.5">
                          {count > 0
                            ? count + " owned record" + (count !== 1 ? "s" : "") + " — transfer before removing."
                            : "No owned records"}
                        </span>
                      </span>
                      {isChecked ? (
                        <span className="bg-brand/10 text-brand mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                          Active
                        </span>
                      ) : null}
                    </label>
                  );
                })}
              </div>
            </fieldset>

            {/* Info banner */}
            <div className="border-border bg-neutral-soft/30 flex gap-2.5 rounded-xl border p-3.5">
              <Info
                className="mt-0.5 size-4 shrink-0 text-brand"
                strokeWidth={1.8}
              />
              <p className="text-xs">
                All business responsibilities retain the Employee system role.
                Authorized Approver eligibility still requires assignment within
                the relevant approval workflow and does not grant global approval
                access.
              </p>
            </div>
          </>
        ) : null}

        {/* ── Inline submit error ── */}
        {message ? (
          <div className="border-border bg-neutral-soft/30 flex gap-2.5 rounded-xl border p-3.5">
            <AlertTriangle
              className="mt-0.5 size-4 shrink-0 text-danger"
              strokeWidth={1.8}
            />
            <p className="text-xs">{message}</p>
          </div>
        ) : null}

        {/* ── Footer ── */}
        <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
          <Button
            type="button"
            variant="secondary"
            disabled={mutation.isPending}
            onClick={close}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading || failed || mutation.isPending}
          >
            {mutation.isPending ? (
              <>
                <Loader2
                  className="mr-1.5 size-3.5 animate-spin"
                  strokeWidth={2}
                />
                Saving…
              </>
            ) : (
              "Save assignment"
            )}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
