"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/feedback/toast";
import { ApiError } from "@/lib/api/api-error";
import {
  useConfigureUserPermissions,
  usePermissions,
  useUserPermissions,
} from "../hooks/use-roles";
import { configureUserPermissionsSchema } from "../schemas/role-schema";
import type { Permission } from "../schemas/role-schema";

type PermissionEffect = "INHERIT" | "ALLOW" | "DENY";

export function UserPermissionsDialog({
  userId,
  onClose,
}: {
  userId: string | null;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const toast = useToast();
  const assignment = useUserPermissions(userId);
  const catalog = usePermissions();
  const mutation = useConfigureUserPermissions();
  const [overrides, setOverrides] = useState<Record<string, PermissionEffect>>(
    {},
  );
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const catalogItems = catalog.data?.items;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (userId && !dialog.open) dialog.showModal();
    if (!userId && dialog.open) dialog.close();
  }, [userId]);

  const initialEffects = useMemo<Record<string, PermissionEffect>>(
    () =>
      Object.fromEntries([
        ...(assignment.data?.allow ?? []).map(
          (code) => [code, "ALLOW"] as const,
        ),
        ...(assignment.data?.deny ?? []).map((code) => [code, "DENY"] as const),
      ]),
    [assignment.data?.allow, assignment.data?.deny],
  );

  const groups = useMemo(() => {
    const result = new Map<string, Permission[]>();
    for (const permission of catalogItems ?? []) {
      const items = result.get(permission.module) ?? [];
      items.push(permission);
      result.set(permission.module, items);
    }
    return [...result.entries()].sort(([left], [right]) =>
      left.localeCompare(right),
    );
  }, [catalogItems]);

  async function save(): Promise<void> {
    if (!userId || !catalog.data) return;
    const allow = catalog.data.items
      .filter(
        ({ code }) =>
          assignment.data?.allowablePermissions.includes(code) &&
          (overrides[code] ?? initialEffects[code]) === "ALLOW",
      )
      .map(({ id }) => id);
    const deny = catalog.data.items
      .filter(
        ({ code }) =>
          assignment.data?.allowablePermissions.includes(code) &&
          (overrides[code] ?? initialEffects[code]) === "DENY",
      )
      .map(({ id }) => id);
    const parsed = configureUserPermissionsSchema.safeParse({
      allow,
      deny,
      reason,
    });
    if (!parsed.success) {
      setError(
        parsed.error.issues[0]?.message ?? "Review the permission overrides.",
      );
      return;
    }
    setError(null);
    try {
      await mutation.mutateAsync({ userId, input: parsed.data });
      toast.success(
        "Permissions updated",
        "The user must sign in again before the new effective permissions apply.",
      );
      onClose();
    } catch (requestError: unknown) {
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : "Unable to save detailed permissions. Please try again.",
      );
    }
  }

  const loading = assignment.isPending || catalog.isPending;
  const failed = assignment.isError || catalog.isError;

  return (
    <Dialog
      className="max-h-[calc(100dvh-2rem)] w-[min(54rem,calc(100%-2rem))] overflow-y-auto"
      dialogRef={dialogRef}
      onCancel={(event) => {
        event.preventDefault();
        if (!mutation.isPending) onClose();
      }}
      onClose={onClose}
      title="Configure detailed permissions"
    >
      {loading ? (
        <p className="text-muted py-8 text-center">
          Loading permission configuration...
        </p>
      ) : failed || !assignment.data ? (
        <Alert className="border-danger/25 bg-danger-soft text-danger">
          Unable to load this user&apos;s permission configuration.
        </Alert>
      ) : (
        <div className="space-y-5">
          <div className="bg-neutral-soft rounded-lg p-4">
            <p className="font-semibold">{assignment.data.user.fullName}</p>
            <p className="text-muted text-sm">{assignment.data.user.email}</p>
            <p className="text-muted mt-1 text-xs">
              Base role: {assignment.data.user.role}. Choose Inherit to keep the
              role setting, Allow to add access, or Deny to explicitly remove
              access for this user.
            </p>
          </div>
          {!assignment.data.editable ? (
            <Alert>
              Administrator permissions are fixed and cannot be overridden for
              an individual account.
            </Alert>
          ) : null}
          {error ? (
            <Alert
              className="border-danger/25 bg-danger-soft text-danger"
              role="alert"
            >
              {error}
            </Alert>
          ) : null}
          <div className="space-y-4">
            {groups.map(([module, permissions]) => (
              <fieldset
                className="border-border rounded-lg border p-4"
                key={module}
              >
                <legend className="px-1 text-sm font-semibold capitalize">
                  {module}
                </legend>
                <div className="divide-border divide-y">
                  {permissions.map((permission) => {
                    const inherited = assignment.data.rolePermissions.includes(
                      permission.code,
                    );
                    const canAllow =
                      assignment.data.allowablePermissions.includes(
                        permission.code,
                      );
                    return (
                      <div
                        className="grid gap-3 py-3 sm:grid-cols-[minmax(0,1fr)_11rem] sm:items-center"
                        key={permission.code}
                      >
                        <div className="min-w-0">
                          <Label htmlFor={`permission-${permission.id}`}>
                            {permission.code}
                          </Label>
                          <p className="text-muted mt-0.5 text-xs">
                            {permission.description}
                          </p>
                          <p className="text-muted mt-1 text-xs">
                            Role default:{" "}
                            {inherited ? "Allowed" : "Not allowed"}
                          </p>
                          {!canAllow ? (
                            <p className="text-muted mt-1 text-xs">
                              Admin-only permission; unavailable for this role.
                            </p>
                          ) : null}
                        </div>
                        <Select
                          aria-label={`Override for ${permission.code}`}
                          id={`permission-${permission.id}`}
                          disabled={!assignment.data.editable || !canAllow}
                          onChange={(event) =>
                            setOverrides((current) => ({
                              ...current,
                              [permission.code]: event.target
                                .value as PermissionEffect,
                            }))
                          }
                          value={
                            canAllow
                              ? (overrides[permission.code] ??
                                initialEffects[permission.code] ??
                                "INHERIT")
                              : "INHERIT"
                          }
                        >
                          <option value="INHERIT">Inherit role</option>
                          <option value="ALLOW">Allow</option>
                          <option value="DENY">Deny</option>
                        </Select>
                      </div>
                    );
                  })}
                </div>
              </fieldset>
            ))}
          </div>
          <div>
            <Label htmlFor="user-permission-reason">Reason for change</Label>
            <Textarea
              className="mt-2"
              id="user-permission-reason"
              maxLength={1000}
              onChange={(event) => setReason(event.target.value)}
              value={reason}
            />
            <p className="text-muted mt-1 text-xs">
              Required for the audit trail; minimum 10 characters.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              disabled={mutation.isPending || !assignment.data.editable}
              onClick={onClose}
              type="button"
              variant="secondary"
            >
              Cancel
            </Button>
            <Button
              disabled={mutation.isPending}
              onClick={() => void save()}
              type="button"
            >
              {mutation.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}
