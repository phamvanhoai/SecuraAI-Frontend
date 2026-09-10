"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  const {
    register,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm<RoleFormInput, unknown, RoleFormValues>({
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
          {role ? "Update role" : "Create custom role"}
        </h2>
        <p className="text-muted mt-1 text-sm">
          System roles are read-only. Custom roles can be modified.
        </p>
        {errorMessage ? (
          <Alert className="border-danger/25 bg-danger-soft text-danger mt-4">
            {errorMessage}
          </Alert>
        ) : null}
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="Role code" error={errors.code?.message}>
            <Input
              autoComplete="off"
              aria-invalid={Boolean(errors.code)}
              {...register("code", {
                onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
                  event.target.value = event.target.value.toUpperCase();
                },
              })}
            />
          </Field>
          <Field label="Role name" error={errors.name?.message}>
            <Input
              autoComplete="off"
              aria-invalid={Boolean(errors.name)}
              {...register("name")}
            />
          </Field>
          <Field
            className="sm:col-span-2"
            label="Description"
            error={errors.description?.message}
          >
            <Textarea {...register("description")} />
          </Field>
        </div>
        <fieldset className="border-border mt-5 rounded-lg border p-4">
          <legend className="px-1 text-sm font-semibold">Permissions</legend>
          {permissionGroups.length === 0 ? (
            <p className="text-muted text-sm">
              The backend returned no permissions. You can create a role without
              permissions.
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
            className="border-border bg-surface text-foreground hover:bg-neutral-soft border"
            disabled={pending}
            onClick={onClose}
            type="button"
          >
            Cancel
          </Button>
          <Button disabled={pending} type="submit">
            {pending ? "Saving..." : role ? "Save changes" : "Create role"}
          </Button>
        </div>
      </form>
    </dialog>
  );
}

function Field({
  label,
  error,
  className,
  children,
}: {
  label: string;
  error?: string | undefined;
  className?: string | undefined;
  children: ReactNode;
}) {
  return (
    <label className={`space-y-2 text-sm font-medium ${className ?? ""}`}>
      <span>{label}</span>
      {children}
      {error ? (
        <span className="text-danger block text-sm">{error}</span>
      ) : null}
    </label>
  );
}
