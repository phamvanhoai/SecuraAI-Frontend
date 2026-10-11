"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { useToast } from "@/components/feedback/toast";
import { FormField } from "@/components/forms/form-field";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useUpdateUser } from "../hooks/use-update-user";
import { useUserCreateOptions } from "../hooks/use-user-create-options";
import { useUserDetail } from "../hooks/use-user-detail";
import {
  updateUserSchema,
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
      {detail.isError || options.isError ? (
        <Alert className="border-danger/25 bg-danger-soft text-danger">
          <strong className="block">Unable to load user information</strong>
          <span>Reload the profile before editing.</span>
          <Button
            className="mt-3"
            onClick={() => {
              void detail.refetch();
              void options.refetch();
            }}
            type="button"
            variant="secondary"
          >
            Try again
          </Button>
        </Alert>
      ) : null}
      {detail.isPending || options.isPending ? (
        <p className="text-muted py-8 text-sm">Loading user information...</p>
      ) : null}
      {detail.data &&
      !detail.isError &&
      !options.isError &&
      !options.isPending ? (
        <form className="space-y-5" noValidate onSubmit={handleSubmit(submit)}>
          {mutation.error ? (
            <Alert className="border-danger/25 bg-danger-soft text-danger">
              {mutation.error instanceof Error
                ? mutation.error.message
                : "Unable to update the user. Please try again."}
            </Alert>
          ) : null}
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
            <FormField
              id="edit-user-full-name"
              label="Full name"
              error={errors.fullName?.message}
            >
              <Input
                id="edit-user-full-name"
                maxLength={255}
                {...register("fullName")}
              />
            </FormField>
            <FormField id="edit-user-role" label="Role">
              <Input
                disabled
                id="edit-user-role"
                value={detail.data.role.name}
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
              {mutation.isPending ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </form>
      ) : null}
    </Dialog>
  );
}
