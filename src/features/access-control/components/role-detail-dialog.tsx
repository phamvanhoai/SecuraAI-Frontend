"use client";

import { useEffect, useMemo, useRef } from "react";
import { StatusBadge } from "@/components/data-display/static-product";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import type { Permission, Role } from "../schemas/role-schema";

export function RoleDetailDialog({
  role,
  onClose,
}: {
  role: Role | null;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const permissionGroups = useMemo(() => groupPermissions(role), [role]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (role && !dialog.open) dialog.showModal();
    if (!role && dialog.open) dialog.close();
  }, [role]);

  return (
    <Dialog
      className="max-h-[calc(100dvh-2rem)] w-[min(44rem,calc(100%-2rem))] overflow-y-auto"
      dialogRef={dialogRef}
      onClose={onClose}
      title="Role details"
    >
      {role ? (
        <div className="space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h3 className="text-xl font-semibold">{role.name}</h3>
              <p className="text-muted mt-1 font-mono text-sm break-all">
                {role.code}
              </p>
            </div>
            <StatusBadge tone={role.isSystem ? "success" : "info"}>
              {role.isSystem ? "System" : "Custom"}
            </StatusBadge>
          </div>

          <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
            <Detail
              label="Assigned users"
              value={String(role.assignedUserCount)}
            />
            <Detail
              label="Workflow steps"
              value={String(role.workflowStepCount)}
            />
            <Detail label="Created" value={formatDate(role.createdAt)} />
            <Detail label="Last updated" value={formatDate(role.updatedAt)} />
            <div className="sm:col-span-2">
              <dt className="text-muted text-xs font-medium tracking-wide uppercase">
                Description
              </dt>
              <dd className="mt-1 text-sm">
                {role.description ?? "No description"}
              </dd>
            </div>
          </dl>

          <section aria-labelledby="role-permissions-title">
            <div className="flex items-center justify-between gap-3">
              <h4 className="font-semibold" id="role-permissions-title">
                Permissions
              </h4>
              <span className="text-muted text-sm">
                {role.permissions.length}
              </span>
            </div>
            {permissionGroups.length === 0 ? (
              <p className="text-muted mt-3 text-sm">
                No permissions assigned.
              </p>
            ) : (
              <div className="border-border mt-3 divide-y rounded-lg border">
                {permissionGroups.map(([module, permissions]) => (
                  <div className="p-4" key={module}>
                    <p className="text-sm font-semibold">{module}</p>
                    <ul className="mt-2 space-y-2">
                      {permissions.map((permission) => (
                        <li className="min-w-0" key={permission.id}>
                          <code className="text-sm break-all">
                            {permission.code}
                          </code>
                          {permission.description ? (
                            <p className="text-muted mt-0.5 text-xs">
                              {permission.description}
                            </p>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </section>

          <div className="flex justify-end">
            <Button
              onClick={() => dialogRef.current?.close()}
              variant="secondary"
            >
              Close
            </Button>
          </div>
        </div>
      ) : null}
    </Dialog>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted text-xs font-medium tracking-wide uppercase">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium">{value}</dd>
    </div>
  );
}

function groupPermissions(role: Role | null): [string, Permission[]][] {
  const groups = new Map<string, Permission[]>();
  for (const permission of role?.permissions ?? []) {
    const items = groups.get(permission.module) ?? [];
    items.push(permission);
    groups.set(permission.module, items);
  }
  return [...groups.entries()].sort(([left], [right]) =>
    left.localeCompare(right),
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
