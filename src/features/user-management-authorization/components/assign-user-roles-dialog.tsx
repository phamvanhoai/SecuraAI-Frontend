"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  AlertTriangle,
  Info,
  Loader2,
  Lock,
  Plus,
  Shield,
  Trash2,
  User,
} from "lucide-react";
import { useToast } from "@/components/feedback/toast";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAccessAssignmentOptions,
  useAssignUserAccess,
  useUserAccessAssignment,
} from "../hooks/use-assign-user-roles";
import type {
  AccessAssignmentPayload,
  AccessScopeInput,
} from "../api/assign-user-roles";

type RoleCode = AccessAssignmentPayload["role"];
type DraftScope = AccessScopeInput & { key: string };

const ownershipLabels = {
  businessServices: "Business services",
  assets: "Assets",
  risks: "Risks",
  treatmentPlans: "Treatment plans",
  treatmentActions: "Treatment actions",
  securityControls: "Security controls",
  evidenceItems: "Evidence items",
  policies: "Policies",
} as const;

const toDatetimeLocal = (value: string | null): string =>
  value ? value.slice(0, 16) : "";

export function AssignUserRolesDialog({
  userId,
  onClose,
}: {
  userId: string | null;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const initializedUserId = useRef<string | null>(null);
  const assignment = useUserAccessAssignment(userId);
  // Load these requests sequentially. Both BFF calls may need to rotate the same
  // refresh token, so starting them together can invalidate the user's session.
  const options = useAccessAssignmentOptions(
    userId !== null && assignment.isSuccess,
  );
  const mutation = useAssignUserAccess();
  const toast = useToast();
  const [role, setRole] = useState<RoleCode>("EMPLOYEE");
  const [scopes, setScopes] = useState<DraftScope[]>([]);
  const [message, setMessage] = useState<string>();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (userId && !dialog?.open) dialog?.showModal();
    if (!userId && dialog?.open) dialog.close();
  }, [userId]);

  useEffect(() => {
    if (
      !assignment.data ||
      initializedUserId.current === assignment.data.user.id
    )
      return;
    initializedUserId.current = assignment.data.user.id;
    setRole(assignment.data.role);
    setScopes(
      assignment.data.scopes.map((scope) => ({
        key: scope.id,
        scopeCode: scope.scopeCode,
        targetType: scope.targetType,
        ...(scope.targetId ? { targetId: scope.targetId } : {}),
        ...(scope.expiresAt
          ? { expiresAt: toDatetimeLocal(scope.expiresAt) }
          : {}),
      })),
    );
  }, [assignment.data]);

  function close(): void {
    if (mutation.isPending) return;
    initializedUserId.current = null;
    setMessage(undefined);
    mutation.reset();
    onClose();
  }

  function updateScope(key: string, patch: Partial<DraftScope>): void {
    setScopes((current) =>
      current.map((scope) =>
        scope.key === key ? { ...scope, ...patch } : scope,
      ),
    );
  }

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!userId || mutation.isPending) return;
    if (
      scopes.some(
        (scope) =>
          !scope.scopeCode ||
          (scope.targetType !== "GLOBAL" && !scope.targetId),
      )
    ) {
      setMessage(
        "Choose a permission code and target for every access scope.",
      );
      return;
    }
    const payloadScopes: AccessScopeInput[] = scopes.map((scope) => ({
      scopeCode: scope.scopeCode,
      targetType: scope.targetType,
      ...(scope.targetType !== "GLOBAL" && scope.targetId
        ? { targetId: scope.targetId }
        : {}),
      expiresAt: scope.expiresAt
        ? new Date(scope.expiresAt).toISOString()
        : null,
    }));
    try {
      const result = await mutation.mutateAsync({
        userId,
        payload: { role, scopes: payloadScopes },
      });
      toast.success(
        "Access assignment saved",
        result.changed
          ? "Role and supplemental access scopes were updated."
          : "No access changes were needed.",
      );
      close();
    } catch (error: unknown) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to save access assignment.",
      );
    }
  }

  const loading = assignment.isPending || options.isPending;
  const failed = assignment.isError || options.isError;

  return (
    <Dialog
      dialogRef={dialogRef}
      title="Assign role, scope & ownership"
      onClose={close}
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      className="max-h-[calc(100dvh-2rem)] w-[min(52rem,calc(100%-2rem))] overflow-y-auto"
    >
      {userId ? (
        <form
          className="space-y-5"
          onSubmit={(event) => void submit(event)}
        >
          {/* Context bar — user identity */}
          <div className="border-border bg-neutral-soft/30 flex flex-wrap items-center gap-3 rounded-lg border p-3.5 text-xs">
            <User className="size-4 shrink-0 text-brand" strokeWidth={1.8} />
            {assignment.data ? (
              <>
                <span className="font-medium text-foreground">
                  {assignment.data.user.fullName}
                </span>
                <span className="text-border">·</span>
                <span className="font-mono text-muted">
                  {assignment.data.user.email}
                </span>
              </>
            ) : (
              <Skeleton className="h-4 w-48 rounded" />
            )}
          </div>

          {/* Load error */}
          {failed ? (
            <div className="border-border bg-neutral-soft/30 flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3.5">
              <div className="flex gap-2.5">
                <AlertTriangle
                  className="mt-0.5 size-4 shrink-0 text-danger"
                  strokeWidth={1.8}
                />
                <div>
                  <p className="text-sm font-medium text-danger">
                    Unable to load access settings
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    Refresh the page or try again.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="secondary"
                className="min-h-8 shrink-0 gap-1.5 px-2.5 text-xs font-medium"
                onClick={() => {
                  void assignment.refetch();
                  void options.refetch();
                }}
              >
                Try again
              </Button>
            </div>
          ) : null}

          {/* Loading skeleton */}
          {loading ? (
            <div
              className="space-y-5"
              role="status"
              aria-label="Loading access settings"
            >
              <div className="space-y-3">
                <Skeleton className="h-5 w-16 rounded" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
              <div className="space-y-3">
                <Skeleton className="h-5 w-40 rounded" />
                <Skeleton className="h-20 w-full rounded-xl" />
              </div>
              <div className="space-y-3">
                <Skeleton className="h-5 w-36 rounded" />
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-xl" />
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2 border-t border-border pt-4">
                <Skeleton className="h-9 w-20 rounded-lg" />
                <Skeleton className="h-9 w-16 rounded-lg" />
              </div>
            </div>
          ) : null}

          {!loading && !failed && options.data && assignment.data ? (
            <>
              {/* ── Role ─────────────────────────────────────────────── */}
              <div className="space-y-3">
                <div className="flex items-start gap-2 border-b border-border pb-2">
                  <Shield
                    className="mt-0.5 size-4 shrink-0 text-brand"
                    strokeWidth={1.8}
                  />
                  <h3 className="text-sm font-semibold">Role</h3>
                </div>
                <Select
                  aria-label="Role"
                  value={role}
                  onChange={(event) =>
                    setRole(event.target.value as RoleCode)
                  }
                >
                  {options.data.roles.map((item) => (
                    <option key={item.code} value={item.code}>
                      {item.name}
                    </option>
                  ))}
                </Select>
                {role === "ADMIN" ? (
                  <div className="border-border bg-neutral-soft/30 flex gap-2.5 rounded-xl border p-3.5">
                    <AlertTriangle
                      className="mt-0.5 size-4 shrink-0 text-warning"
                      strokeWidth={1.8}
                    />
                    <p className="text-xs text-muted">
                      Administrator grants broad system access including sensitive
                      configuration, user management and audit capabilities.
                    </p>
                  </div>
                ) : null}
              </div>

              {/* ── Supplemental access scopes ───────────────────────── */}
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3 border-b border-border pb-2">
                  <div className="flex items-start gap-2">
                    <Lock
                      className="mt-0.5 size-4 shrink-0 text-brand"
                      strokeWidth={1.8}
                    />
                    <div>
                      <h3 className="text-sm font-semibold">
                        Supplemental access scopes
                      </h3>
                      <p className="mt-0.5 text-xs text-muted">
                        Each scope grants one allow-listed permission globally or
                        for one business service or asset.
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    className="min-h-8 shrink-0 gap-1.5 px-2.5 text-xs font-medium"
                    onClick={() =>
                      setScopes((current) => [
                        ...current,
                        {
                          key: crypto.randomUUID(),
                          scopeCode:
                            options.data!.scopeCodes[0]?.code ?? "",
                          targetType: "GLOBAL",
                        },
                      ])
                    }
                  >
                    <Plus className="size-3.5" strokeWidth={2} />
                    Add scope
                  </Button>
                </div>

                {scopes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-neutral-soft/20 py-10 text-center">
                    <Lock
                      className="size-10 stroke-1 text-muted/50"
                    />
                    <h4 className="mt-3 text-sm font-semibold text-foreground">
                      No supplemental scopes
                    </h4>
                    <p className="mt-1 text-xs text-muted">
                      This user&apos;s access is determined solely by their role.
                    </p>
                    <Button
                      type="button"
                      variant="secondary"
                      className="mt-4 min-h-8 gap-1.5 px-2.5 text-xs font-medium"
                      onClick={() =>
                        setScopes((current) => [
                          ...current,
                          {
                            key: crypto.randomUUID(),
                            scopeCode:
                              options.data!.scopeCodes[0]?.code ?? "",
                            targetType: "GLOBAL",
                          },
                        ])
                      }
                    >
                      <Plus className="size-3.5" strokeWidth={2} />
                      Add first scope
                    </Button>
                  </div>
                ) : (
                  <div className="border-border overflow-hidden rounded-xl border">
                    <div className="divide-y divide-border">
                      {scopes.map((scope, index) => (
                        <div
                          key={scope.key}
                          className="grid gap-3 p-3.5 md:grid-cols-[1.4fr_1fr_1.4fr_1fr_auto]"
                        >
                          <label>
                            <span className="mb-1.5 block text-xs font-medium text-muted uppercase tracking-wide">
                              Permission
                            </span>
                            <Select
                              aria-label={"Permission scope " + String(index + 1)}
                              value={scope.scopeCode}
                              onChange={(event) =>
                                updateScope(scope.key, {
                                  scopeCode: event.target.value,
                                })
                              }
                            >
                              {options.data.scopeCodes.map((item) => (
                                <option key={item.code} value={item.code}>
                                  {item.name} ({item.code})
                                </option>
                              ))}
                            </Select>
                          </label>
                          <label>
                            <span className="mb-1.5 block text-xs font-medium text-muted uppercase tracking-wide">
                              Target type
                            </span>
                            <Select
                              aria-label={"Target type scope " + String(index + 1)}
                              value={scope.targetType}
                              onChange={(event) =>
                                updateScope(scope.key, {
                                  targetType: event.target
                                    .value as DraftScope["targetType"],
                                  targetId: undefined,
                                })
                              }
                            >
                              <option value="GLOBAL">Global</option>
                              <option value="BUSINESS_SERVICE">
                                Business service
                              </option>
                              <option value="ASSET">Asset</option>
                            </Select>
                          </label>
                          <label>
                            <span className="mb-1.5 block text-xs font-medium text-muted uppercase tracking-wide">
                              Target
                            </span>
                            <Select
                              aria-label={"Target scope " + String(index + 1)}
                              value={scope.targetId ?? ""}
                              disabled={scope.targetType === "GLOBAL"}
                              onChange={(event) =>
                                updateScope(scope.key, {
                                  targetId:
                                    event.target.value || undefined,
                                })
                              }
                            >
                              <option value="">
                                {scope.targetType === "GLOBAL"
                                  ? "Whole organization"
                                  : "Select target"}
                              </option>
                              {scope.targetType === "BUSINESS_SERVICE"
                                ? options.data.businessServices.map(
                                    (item) => (
                                      <option key={item.id} value={item.id}>
                                        {item.name}
                                      </option>
                                    ),
                                  )
                                : null}
                              {scope.targetType === "ASSET"
                                ? options.data.assets.map((item) => (
                                    <option key={item.id} value={item.id}>
                                      {item.code} — {item.name}
                                    </option>
                                  ))
                                : null}
                            </Select>
                          </label>
                          <label>
                            <span className="mb-1.5 block text-xs font-medium text-muted uppercase tracking-wide">
                              Expires
                            </span>
                            <Input
                              aria-label={"Expiry scope " + String(index + 1)}
                              type="datetime-local"
                              value={scope.expiresAt ?? ""}
                              onChange={(event) =>
                                updateScope(scope.key, {
                                  expiresAt: event.target.value || null,
                                })
                              }
                            />
                          </label>
                          <div className="flex items-end">
                            <Button
                              type="button"
                              variant="secondary"
                              aria-label={"Remove scope " + scope.scopeCode}
                              className="min-h-8 gap-1.5 px-2.5 text-xs font-medium"
                              onClick={() =>
                                setScopes((current) =>
                                  current.filter(
                                    (item) => item.key !== scope.key,
                                  ),
                                )
                              }
                            >
                              <Trash2 className="size-3.5" strokeWidth={1.8} />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* ── Ownership overview ───────────────────────────────── */}
              <div className="space-y-3">
                <div className="flex items-start gap-2 border-b border-border pb-2">
                  <User
                    className="mt-0.5 size-4 shrink-0 text-brand"
                    strokeWidth={1.8}
                  />
                  <div>
                    <h3 className="text-sm font-semibold">
                      Ownership overview
                    </h3>
                    <p className="mt-0.5 text-xs text-muted">
                      Ownership is managed in each responsible module to protect
                      business workflows. This panel shows current totals only.
                    </p>
                  </div>
                </div>

                <div className="border-border bg-neutral-soft/30 flex gap-2.5 rounded-xl border p-3.5">
                  <Info
                    className="mt-0.5 size-4 shrink-0 text-brand"
                    strokeWidth={1.8}
                  />
                  <p className="text-xs text-muted">
                    To transfer ownership of individual records, open the
                    relevant module and use the reassign action.
                  </p>
                </div>

                <dl className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {Object.entries(ownershipLabels).map(([key, label]) => (
                    <div
                      className="border-border bg-neutral-soft/30 rounded-xl border p-3.5"
                      key={key}
                    >
                      <dt className="text-xs font-medium text-muted uppercase tracking-wide">
                        {label}
                      </dt>
                      <dd className="mt-1.5 text-2xl font-semibold text-foreground">
                        {
                          assignment.data.ownershipSummary[
                            key as keyof typeof ownershipLabels
                          ]
                        }
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>

              {/* Validation / submit error */}
              {message ? (
                <div className="border-border bg-neutral-soft/30 flex gap-2.5 rounded-xl border p-3.5">
                  <AlertTriangle
                    className="mt-0.5 size-4 shrink-0 text-danger"
                    strokeWidth={1.8}
                  />
                  <p className="text-sm text-danger">{message}</p>
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
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? (
                    <>
                      <Loader2
                        className="mr-1.5 size-3.5 animate-spin"
                        strokeWidth={2}
                      />
                      Saving…
                    </>
                  ) : (
                    "Save"
                  )}
                </Button>
              </div>
            </>
          ) : null}
        </form>
      ) : null}
    </Dialog>
  );
}
