"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Info, Loader2, ShieldCheck, UserRound } from "lucide-react";
import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { FormField } from "@/components/forms/form-field";
import { useToast } from "@/components/feedback/toast";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useCreateUser } from "../hooks/use-create-user";
import { useUserCreateOptions } from "../hooks/use-user-create-options";
import {
  createUserSchema,
  USER_FULL_NAME_MAX_LENGTH,
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
        {/* Submit error banner */}
        {mutation.error ? (
          <div className="border-border bg-neutral-soft/30 flex gap-2.5 rounded-xl border p-3.5" role="alert">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-danger" strokeWidth={1.8} />
            <p className="text-sm text-danger">
              {mutation.error instanceof Error
                ? mutation.error.message
                : "Unable to create the user account. Please try again."}
            </p>
          </div>
        ) : null}

        {/* Info hint */}
        <div className="border-border bg-neutral-soft/30 flex gap-2.5 rounded-xl border p-3.5">
          <Info className="mt-0.5 size-4 shrink-0 text-brand" strokeWidth={1.8} />
          <p className="text-xs text-muted">
            A temporary password and login instructions will be sent to the
            user&apos;s email address upon account creation.
          </p>
        </div>

        {/* Account information */}
        <section aria-labelledby="new-user-account-heading" className="space-y-3">
          <div className="flex items-start gap-2 border-b border-border pb-2">
            <UserRound
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0 text-brand"
              strokeWidth={1.8}
            />
            <h3 className="text-sm font-semibold" id="new-user-account-heading">
              Account information
            </h3>
          </div>
          <div className="border-border bg-neutral-soft/30 grid gap-4 rounded-xl border p-4 sm:grid-cols-2">
            <FormField
              id="user-email"
              label="Email"
              error={errors.email?.message}
            >
              <Input
                id="user-email"
                autoComplete="email"
                maxLength={USER_FULL_NAME_MAX_LENGTH}
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

        {/* Access assignment */}
        <section aria-labelledby="new-user-access-heading" className="space-y-3">
          <div className="flex items-start gap-2 border-b border-border pb-2">
            <ShieldCheck
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0 text-brand"
              strokeWidth={1.8}
            />
            <h3 className="text-sm font-semibold" id="new-user-access-heading">
              Access assignment
            </h3>
          </div>
          <div className="border-border bg-neutral-soft/30 rounded-xl border p-4">
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
          </div>
        </section>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
          <Button
            disabled={mutation.isPending}
            onClick={close}
            type="button"
            variant="secondary"
          >
            Cancel
          </Button>
          <Button disabled={mutation.isPending} type="submit">
            {mutation.isPending ? (
              <>
                <Loader2 className="mr-1.5 size-3.5 animate-spin" strokeWidth={2} />
                Saving…
              </>
            ) : (
              "Save"
            )}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
