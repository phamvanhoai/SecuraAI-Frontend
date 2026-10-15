"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ShieldCheck, UserRound } from "lucide-react";
import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { FormField } from "@/components/forms/form-field";
import { useToast } from "@/components/feedback/toast";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useCreateUser } from "../hooks/use-create-user";
import { useUserCreateOptions } from "../hooks/use-user-create-options";
import {
  createUserSchema,
  type CreateUserInput,
  type CreateUserPayload,
} from "../schemas/user-schema";

const defaults: CreateUserInput = {
  email: "",
  fullName: "",
  phone: "",
  employeeCode: "",
  departmentId: "",
  role: "EMPLOYEE",
};
const roles = [
  { value: "EMPLOYEE", label: "Employee" },
  { value: "SECURITY_OFFICER", label: "Security Officer" },
  { value: "EXECUTIVE", label: "Executive" },
] as const;

export function CreateUserDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const mutation = useCreateUser();
  const options = useUserCreateOptions(open);
  const toast = useToast();
  const {
    register,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateUserInput, unknown, CreateUserPayload>({
    resolver: zodResolver(createUserSchema),
    defaultValues: defaults,
  });

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  function close(): void {
    if (mutation.isPending) return;
    mutation.reset();
    reset(defaults);
    onClose();
  }

  async function submit(values: CreateUserPayload): Promise<void> {
    try {
      const user = await mutation.mutateAsync(values);
      reset(defaults);
      onClose();
      toast.success(
        "User account created",
        user.message ?? `Login details were sent to ${user.email}.`,
      );
    } catch {
      return;
    }
  }

  return (
    <Dialog
      dialogRef={dialogRef}
      title="Add user"
      onClose={onClose}
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      className="max-h-[calc(100dvh-2rem)] w-[min(36rem,calc(100%-2rem))] overflow-y-auto"
    >
      <form className="space-y-5" noValidate onSubmit={handleSubmit(submit)}>
        {mutation.error ? (
          <Alert
            className="border-danger/25 bg-danger-soft text-danger"
            role="alert"
          >
            {mutation.error instanceof Error
              ? mutation.error.message
              : "Unable to create the user account. Please try again."}
          </Alert>
        ) : null}
        <section
          aria-labelledby="new-user-account-heading"
          className="border-border rounded-xl border p-4"
        >
          <h3
            className="mb-4 flex items-center gap-2 text-sm font-semibold"
            id="new-user-account-heading"
          >
            <span className="bg-brand-soft text-brand grid size-7 place-items-center rounded-lg">
              <UserRound
                aria-hidden="true"
                className="size-4"
                strokeWidth={1.8}
              />
            </span>
            Account information
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              id="user-email"
              label="Email"
              error={errors.email?.message}
            >
              <Input
                id="user-email"
                autoComplete="email"
                maxLength={255}
                type="email"
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "user-email-error" : undefined}
                {...register("email")}
              />
            </FormField>
            <FormField
              id="user-phone"
              label="Phone"
              error={errors.phone?.message}
            >
              <Input
                id="user-phone"
                inputMode="numeric"
                maxLength={10}
                pattern="[0-9]{10}"
                type="tel"
                {...register("phone")}
              />
            </FormField>
            <FormField
              id="user-full-name"
              label="Full name"
              error={errors.fullName?.message}
            >
              <Input
                id="user-full-name"
                autoComplete="name"
                maxLength={255}
                aria-invalid={Boolean(errors.fullName)}
                aria-describedby={errors.fullName ? "user-full-name-error" : undefined}
                {...register("fullName")}
              />
            </FormField>
            <FormField
              id="user-employee-code"
              label="Employee code"
              error={errors.employeeCode?.message}
            >
              <Input
                id="user-employee-code"
                maxLength={50}
                {...register("employeeCode")}
              />
            </FormField>
            <div className="sm:col-span-2">
              <FormField
                id="user-department"
                label="Department"
                error={errors.departmentId?.message}
              >
                <Select id="user-department" {...register("departmentId")}>
                  <option value="">Not assigned</option>
                  {(options.data?.departments ?? []).map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.code} — {department.name}
                    </option>
                  ))}
                </Select>
              </FormField>
            </div>
          </div>
        </section>
        <section
          aria-labelledby="new-user-access-heading"
          className="border-border rounded-xl border p-4"
        >
          <h3
            className="mb-1 flex items-center gap-2 text-sm font-semibold"
            id="new-user-access-heading"
          >
            <span className="bg-brand-soft text-brand grid size-7 place-items-center rounded-lg">
              <ShieldCheck
                aria-hidden="true"
                className="size-4"
                strokeWidth={1.8}
              />
            </span>
            Access assignment
          </h3>
          <FormField id="user-role" label="Role" error={errors.role?.message}>
            <Select
              id="user-role"
              aria-invalid={Boolean(errors.role)}
              aria-describedby={errors.role ? "user-role-error" : undefined}
              {...register("role")}
            >
              {roles.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </Select>
          </FormField>
        </section>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            disabled={mutation.isPending}
            onClick={close}
            type="button"
            variant="secondary"
          >
            Cancel
          </Button>
          <Button disabled={mutation.isPending} type="submit">
            {mutation.isPending ? "Saving…" : "Save"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
