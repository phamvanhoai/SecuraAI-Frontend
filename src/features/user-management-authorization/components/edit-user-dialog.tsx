"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Loader2, Pencil, Settings, User } from "lucide-react";
import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { useToast } from "@/components/feedback/toast";
import { FormField } from "@/components/forms/form-field";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useUpdateUser } from "../hooks/use-update-user";
import { useUserCreateOptions } from "../hooks/use-user-create-options";
import { useUserDetail } from "../hooks/use-user-detail";
import {
  updateUserSchema,
  USER_FULL_NAME_MAX_LENGTH,
  type UpdateUserInput,
  type UpdateUserPayload,
} from "../schemas/user-schema";

const emptyValues: UpdateUserInput = {
  fullName: "",
  phone: "",
  employeeCode: "",
  departmentId: "",
  status: "active",
};

export function EditUserDialog({
  userId,
  onClose,
}: {
  userId: string | null;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const detail = useUserDetail(userId);
  const options = useUserCreateOptions(userId !== null);
  const mutation = useUpdateUser(userId ?? "");
  const toast = useToast();
  const {
    register,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateUserInput, unknown, UpdateUserPayload>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: emptyValues,
  });

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (userId && !dialog.open) dialog.showModal();
    if (!userId && dialog.open) dialog.close();
  }, [userId]);

  useEffect(() => {
    if (detail.data)
      reset({
        fullName: detail.data.fullName,
        phone: detail.data.phone ?? "",
        employeeCode: detail.data.employeeCode ?? "",
        departmentId: detail.data.department?.id ?? "",
        status: detail.data.status === "disabled" ? "inactive" : detail.data.status,
      });
  }, [detail.data, reset]);

  function close(): void {
    if (mutation.isPending) return;
    mutation.reset();
    reset(emptyValues);
    onClose();
  }

  async function submit(values: UpdateUserPayload): Promise<void> {
    try {
      const user = await mutation.mutateAsync(values);
      toast.success("User updated", `${user.fullName}'s profile was updated.`);
      close();
    } catch {
      return;
    }
  }

  return (
    <Dialog
      className="max-h-[calc(100dvh-2rem)] w-[min(46rem,calc(100%-2rem))] overflow-y-auto"
      dialogRef={dialogRef}
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onClose={onClose}
      title="Edit user"
    >
      {/* Load / fetch error */}
      {detail.isError || options.isError ? (
        <div className="border-border bg-neutral-soft/30 flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3.5">
          <div className="flex gap-2.5">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-danger" strokeWidth={1.8} />
            <div>
              <p className="text-sm font-medium text-danger">Unable to load user information</p>
              <p className="mt-0.5 text-xs text-muted">Reload the profile before editing.</p>
            </div>
          </div>
          <Button
            onClick={() => {
              void detail.refetch();
              void options.refetch();
            }}
            type="button"
            variant="secondary"
            className="min-h-8 shrink-0 gap-1.5 px-2.5 text-xs font-medium"
          >
            Try again
          </Button>
        </div>
      ) : null}

      {/* Loading skeleton */}
      {detail.isPending || options.isPending ? (
        <div className="space-y-5" role="status" aria-label="Loading user information">
          <Skeleton className="h-12 w-full rounded-lg" />
          <div className="space-y-3">
            <Skeleton className="h-5 w-32 rounded" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          </div>
          <div className="space-y-3">
            <Skeleton className="h-5 w-32 rounded" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg sm:col-span-2" />
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Skeleton className="h-9 w-20 rounded-lg" />
            <Skeleton className="h-9 w-28 rounded-lg" />
          </div>
        </div>
      ) : null}

      {detail.data &&
      !detail.isError &&
      !options.isError &&
      !options.isPending ? (
        <form className="space-y-5" noValidate onSubmit={handleSubmit(submit)}>
          {/* Context bar — user identity */}
          <div className="border-border bg-neutral-soft/30 flex flex-wrap items-center gap-3 rounded-lg border p-3.5 text-xs">
            <User className="size-4 shrink-0 text-brand" strokeWidth={1.8} />
            <span className="font-medium text-foreground">{detail.data.fullName}</span>
            <span className="text-border">·</span>
            <span className="font-mono text-muted">{detail.data.email}</span>
            <span className="text-border">·</span>
            <span className="text-muted">
              Role: <strong className="text-foreground">{detail.data.role.name}</strong>
            </span>
          </div>

          {/* Submit error banner */}
          {mutation.error ? (
            <div className="border-border bg-neutral-soft/30 flex gap-2.5 rounded-xl border p-3.5">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-danger" strokeWidth={1.8} />
              <p className="text-sm text-danger">
                {mutation.error instanceof Error
                  ? mutation.error.message
                  : "Unable to update the user. Please try again."}
              </p>
            </div>
          ) : null}

          {/* Read-only identity fields */}
          <div className="space-y-3">
            <div className="flex items-start gap-2 border-b border-border pb-2">
              <Settings className="mt-0.5 size-4 shrink-0 text-brand" strokeWidth={1.8} />
              <h3 className="text-sm font-semibold">Account identity</h3>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField id="edit-user-email" label="Email">
                <Input disabled id="edit-user-email" value={detail.data.email} />
              </FormField>
              <FormField id="edit-user-username" label="Username">
                <Input
                  disabled
                  id="edit-user-username"
                  value={detail.data.username}
                />
              </FormField>
              <FormField id="edit-user-role" label="Role">
                <Input
                  disabled
                  id="edit-user-role"
                  value={detail.data.role.name}
                />
              </FormField>
            </div>
          </div>

          {/* Editable profile fields */}
          <div className="space-y-3">
            <div className="flex items-start gap-2 border-b border-border pb-2">
              <Pencil className="mt-0.5 size-4 shrink-0 text-brand" strokeWidth={1.8} />
              <h3 className="text-sm font-semibold">Profile & access</h3>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                id="edit-user-full-name"
                label="Full name"
                error={errors.fullName?.message}
              >
                <Input
                  id="edit-user-full-name"
                  maxLength={USER_FULL_NAME_MAX_LENGTH}
                  {...register("fullName")}
                />
              </FormField>
              <FormField id="edit-user-status" label="Status">
                <Select id="edit-user-status" {...register("status")}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="locked">Locked</option>
                </Select>
              </FormField>
              <FormField
                id="edit-user-phone"
                label="Phone"
                error={errors.phone?.message}
              >
                <Input
                  id="edit-user-phone"
                  inputMode="numeric"
                  maxLength={10}
                  pattern="[0-9]{10}"
                  type="tel"
                  {...register("phone")}
                />
              </FormField>
              <FormField
                id="edit-user-employee-code"
                label="Employee code"
                error={errors.employeeCode?.message}
              >
                <Input
                  id="edit-user-employee-code"
                  maxLength={50}
                  {...register("employeeCode")}
                />
              </FormField>
              <div className="sm:col-span-2">
                <FormField
                  id="edit-user-department"
                  label="Department"
                  error={errors.departmentId?.message}
                >
                  <Select id="edit-user-department" {...register("departmentId")}>
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
          </div>

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
                "Save changes"
              )}
            </Button>
          </div>
        </form>
      ) : null}
    </Dialog>
  );
}
