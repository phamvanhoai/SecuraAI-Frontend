"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { useToast } from "@/components/feedback/toast";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useCreateUser } from "../hooks/use-create-user";
import {
  createUserSchema,
  type CreateUserInput,
  type CreateUserPayload,
} from "../schemas/user-schema";

const defaults: CreateUserInput = {
  email: "",
  fullName: "",
  employeeCode: "",
  departmentId: "",
  roleCodes: "",
};

export function CreateUserDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const mutation = useCreateUser();
  const toast = useToast();
  const {
    register,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: defaults,
  });

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  async function submit(values: CreateUserInput): Promise<void> {
    const payload: CreateUserPayload = {
      ...values,
      email: values.email.trim().toLowerCase(),
      fullName: values.fullName.trim(),
      employeeCode: values.employeeCode.trim(),
      departmentId: values.departmentId.trim(),
      roleCodes: values.roleCodes
        .split(",")
        .map((code) => code.trim().toUpperCase())
        .filter(Boolean),
    };

    try {
      const user = await mutation.mutateAsync(payload);
      reset(defaults);
      onClose();
      toast.success(
        "User account created",
        user.message ?? `${user.fullName} can now sign in with the temporary password sent by email.`,
      );
    } catch {
      return;
    }
  }

  return (
    <Dialog
      dialogRef={dialogRef}
      title="Initialize User Account"
      onClose={onClose}
      onCancel={(event) => {
        event.preventDefault();
        if (!mutation.isPending) onClose();
      }}
      className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:w-[min(42rem,calc(100%-2rem))]"
    >
      <form className="space-y-4" noValidate onSubmit={handleSubmit(submit)}>
        {mutation.error ? (
          <Alert className="border-danger/25 bg-danger-soft text-danger">
            {mutation.error instanceof Error
              ? mutation.error.message
              : "Unable to create the user account. Please try again."}
          </Alert>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Email" error={errors.email?.message}>
            <Input
              autoComplete="email"
              type="email"
              aria-invalid={Boolean(errors.email)}
              {...register("email")}
            />
          </Field>
          <Field label="Full name" error={errors.fullName?.message}>
            <Input
              autoComplete="name"
              aria-invalid={Boolean(errors.fullName)}
              {...register("fullName")}
            />
          </Field>
          <Field label="Employee code" error={errors.employeeCode?.message}>
            <Input
              autoComplete="off"
              placeholder="SEC-0241"
              aria-invalid={Boolean(errors.employeeCode)}
              {...register("employeeCode")}
            />
          </Field>
          <Field label="Department ID" error={errors.departmentId?.message}>
            <Input
              autoComplete="off"
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              aria-invalid={Boolean(errors.departmentId)}
              {...register("departmentId")}
            />
          </Field>
          <Field
            className="sm:col-span-2"
            label="Role codes"
            error={errors.roleCodes?.message}
          >
            <Input
              autoComplete="off"
              placeholder="EMPLOYEE, SECURITY_OFFICER"
              aria-invalid={Boolean(errors.roleCodes)}
              {...register("roleCodes")}
            />
            <span className="text-muted block text-xs font-normal">
              Enter one or more role codes separated by commas.
            </span>
          </Field>
        </div>
        <p className="text-muted text-xs">
          A temporary password will be sent to the user by email.
        </p>
        <div className="flex justify-end gap-2">
          <Button
            disabled={mutation.isPending}
            onClick={onClose}
            type="button"
            variant="secondary"
          >
            Cancel
          </Button>
          <Button disabled={mutation.isPending} type="submit">
            {mutation.isPending ? "Creating..." : "Create account"}
          </Button>
        </div>
      </form>
    </Dialog>
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
      {error ? <span className="text-danger block text-sm">{error}</span> : null}
    </label>
  );
}