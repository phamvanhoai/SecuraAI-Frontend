"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound, ShieldCheck, UserRound } from "lucide-react";
import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { FormField } from "@/components/forms/form-field";
import { useToast } from "@/components/feedback/toast";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  employeeCode: "",
  departmentId: "",
  roleCodes: [],
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
        user.message ??
          `${user.fullName} can sign in with the temporary password sent by email.`,
      );
    } catch {
      return;
    }
  }

  const cannotSubmit =
    mutation.isPending ||
    options.isPending ||
    options.isError ||
    !options.data?.roles.length;

  return (
    <Dialog
      dialogRef={dialogRef}
      title="Add user"
      onClose={onClose}
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      className="max-h-[calc(100dvh-2rem)] w-[min(46rem,calc(100%-2rem))] overflow-y-auto"
    >
      <form className="space-y-5" noValidate onSubmit={handleSubmit(submit)}>
        {mutation.error ? (
          <Alert className="border-danger/25 bg-danger-soft text-danger">
            {mutation.error instanceof Error
              ? mutation.error.message
              : "Unable to create the user account. Please try again."}
          </Alert>
        ) : null}
        {options.isError ? (
          <Alert className="border-danger/25 bg-danger-soft text-danger">
            <strong className="block">
              Unable to load departments and roles
            </strong>
            <span>
              Reload the available options before creating this account.
            </span>
            <Button
              className="mt-3"
              onClick={() => void options.refetch()}
              type="button"
              variant="secondary"
            >
              Try again
            </Button>
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
              id="user-full-name"
              label="Full name"
              error={errors.fullName?.message}
            >
              <Input
                id="user-full-name"
                autoComplete="name"
                maxLength={150}
                aria-invalid={Boolean(errors.fullName)}
                aria-describedby={
                  errors.fullName ? "user-full-name-error" : undefined
                }
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
                autoComplete="off"
                maxLength={50}
                placeholder="SEC-0241"
                aria-invalid={Boolean(errors.employeeCode)}
                aria-describedby={
                  errors.employeeCode ? "user-employee-code-error" : undefined
                }
                {...register("employeeCode")}
              />
            </FormField>
            <div>
              <FormField
                id="user-department"
                label="Department"
                error={errors.departmentId?.message}
              >
                <Select
                  id="user-department"
                  disabled={options.isPending || options.isError}
                  aria-invalid={Boolean(errors.departmentId)}
                  aria-describedby={
                    errors.departmentId ? "user-department-error" : undefined
                  }
                  {...register("departmentId")}
                >
                  <option value="">
                    {options.isPending
                      ? "Loading departments…"
                      : "Select a department"}
                  </option>
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

        <fieldset
          className="border-border space-y-3 rounded-xl border p-4"
          aria-describedby={errors.roleCodes ? "roles-error" : undefined}
        >
          <legend className="sr-only">Access assignment</legend>
          <div className="flex items-start gap-2">
            <span className="bg-brand-soft text-brand grid size-7 shrink-0 place-items-center rounded-lg">
              <ShieldCheck
                aria-hidden="true"
                className="size-4"
                strokeWidth={1.8}
              />
            </span>
            <div>
              <h3 className="text-sm font-semibold">Access assignment</h3>
              <p className="text-muted mt-0.5 text-xs leading-5">
                Select at least one initial role. Permissions are enforced by
                the backend.
              </p>
            </div>
          </div>
          {options.isPending ? (
            <p className="text-muted text-sm" role="status">
              Loading roles…
            </p>
          ) : null}
          {options.data?.roles.length === 0 ? (
            <p className="text-muted text-sm">
              No roles are available for assignment.
            </p>
          ) : null}
          {options.data?.roles.length ? (
            <div className="border-border grid gap-2 rounded-lg border p-3 sm:grid-cols-2">
              {options.data.roles.map((role) => (
                <label
                  className="hover:bg-neutral-soft flex min-h-11 cursor-pointer items-start gap-3 rounded-lg p-2 transition-colors"
                  key={role.id}
                >
                  <Checkbox
                    className="mt-0.5"
                    value={role.code}
                    {...register("roleCodes")}
                  />
                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5 text-sm font-medium">
                      <KeyRound
                        aria-hidden="true"
                        className="text-brand size-3.5"
                        strokeWidth={1.8}
                      />
                      {role.name}
                    </span>
                    <span className="text-muted block text-xs break-words">
                      {role.code}
                      {role.description ? ` — ${role.description}` : ""}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          ) : null}
          {errors.roleCodes ? (
            <p id="roles-error" className="text-danger text-sm">
              {errors.roleCodes.message}
            </p>
          ) : null}
        </fieldset>

        <p className="text-muted text-xs leading-5">
          The account starts active and must change its temporary password after
          the first sign-in.
        </p>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            disabled={mutation.isPending}
            onClick={close}
            type="button"
            variant="secondary"
          >
            Cancel
          </Button>
          <Button disabled={cannotSubmit} type="submit">
            {mutation.isPending ? "Saving…" : "Save"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
