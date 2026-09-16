"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  roleFormSchema,
  type Permission,
  type Role,
  type RoleFormInput,
  type RoleFormValues,
} from "../schemas/role-schema";

type RoleFormDialogProps = {
  open: boolean;
  role: Role | null;
  permissions: readonly Permission[];
  pending: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onSubmit: (values: RoleFormValues) => Promise<void>;
};

export function RoleFormDialog({
  open,
  role,
  permissions,
  pending,
  errorMessage,
  onClose,
  onSubmit,
}: RoleFormDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { register, reset, handleSubmit } = useForm<
    RoleFormInput,
    unknown,
    RoleFormValues
  >({
    resolver: zodResolver(roleFormSchema),
    defaultValues: { code: "", name: "", description: "", permissionIds: [] },
  });

  useEffect(() => {
    reset({
      code: role?.code ?? "",
      name: role?.name ?? "",
      description: role?.description ?? "",
      permissionIds: role?.permissions.map((permission) => permission.id) ?? [],
    });
  }, [reset, role, open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const permissionGroups = useMemo(() => {
    const groups = new Map<string, Permission[]>();
    for (const permission of permissions) {
      const group = groups.get(permission.module) ?? [];
      group.push(permission);
      groups.set(permission.module, group);
    }
    return [...groups.entries()].sort(([left], [right]) =>
      left.localeCompare(right),
    );
  }, [permissions]);

  return (
    <dialog
      aria-labelledby="role-form-title"
      className="border-border bg-surface text-foreground m-auto max-h-[calc(100dvh-2rem)] w-[min(46rem,calc(100%-2rem))] overflow-y-auto rounded-xl border p-0 backdrop:bg-[#07110f]/55"
      onCancel={(event) => {
        event.preventDefault();
        if (!pending) onClose();
      }}
      onClose={onClose}
      ref={dialogRef}
    >
      <form className="p-6" noValidate onSubmit={handleSubmit(onSubmit)}>
        <h2 className="text-lg font-semibold" id="role-form-title">
          Edit permissions
        </h2>
        <p className="text-muted mt-1 text-sm">
          Update access for {role?.name}. The role identity cannot be changed.
        </p>
        {errorMessage ? (
          <Alert className="border-danger/25 bg-danger-soft text-danger mt-4">
            {errorMessage}
          </Alert>
        ) : null}
        <div className="bg-neutral-soft mt-5 grid gap-3 rounded-lg p-4 sm:grid-cols-2">
          <div>
            <p className="text-muted text-xs font-medium uppercase">Role</p>
            <p className="mt-1 text-sm font-semibold">{role?.name}</p>
          </div>
          <div>
            <p className="text-muted text-xs font-medium uppercase">Code</p>
            <code className="mt-1 block text-sm">{role?.code}</code>
          </div>
        </div>
        <fieldset className="border-border mt-5 rounded-lg border p-4">
          <legend className="px-1 text-sm font-semibold">Permissions</legend>
          {permissionGroups.length === 0 ? (
            <p className="text-muted text-sm">
              The backend returned no permissions to assign.
            </p>
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {permissionGroups.map(([module, items]) => (
                <div key={module}>
                  <p className="mb-2 text-sm font-semibold">{module}</p>
                  <div className="space-y-2">
                    {items.map((permission) => (
                      <Label
                        className="flex cursor-pointer items-start gap-2 font-normal"
                        key={permission.id}
                      >
                        <Checkbox
                          value={permission.id}
                          {...register("permissionIds")}
                        />
                        <span>
                          <span className="block text-sm">
                            {permission.code}
                          </span>
                          {permission.description ? (
                            <span className="text-muted block text-xs">
                              {permission.description}
                            </span>
                          ) : null}
                        </span>
                      </Label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </fieldset>
        <div className="mt-6 flex justify-end gap-2">
          <Button
            disabled={pending}
            onClick={onClose}
            type="button"
            variant="secondary"
          >
            Cancel
          </Button>
          <Button disabled={pending} type="submit">
            {pending ? "Saving..." : "Save permissions"}
          </Button>
        </div>
      </form>
    </dialog>
  );
}
