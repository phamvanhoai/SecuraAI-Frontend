"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { FormField } from "@/components/forms/form-field";
import { useToast } from "@/components/feedback/toast";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  useCreatePolicyDraft,
  useUpdatePolicyDraft,
} from "../hooks/use-policy-drafts";
import {
  createPolicyDraftSchema,
  updatePolicyDraftSchema,
  type CreatePolicyDraftInput,
  type CreatePolicyDraftRequest,
  type OwnedPolicyDraft,
  type UpdatePolicyDraftInput,
  type UpdatePolicyDraftRequest,
} from "../schemas/policy-draft-schema";

type PolicyDraftFormDialogProps = {
  open: boolean;
  draft: OwnedPolicyDraft | null;
  onClose: () => void;
};

const createDefaults: CreatePolicyDraftInput = {
  policyCode: "",
  title: "",
  description: "",
  versionNumber: "1.0",
  content: "",
};

export function PolicyDraftFormDialog({
  open,
  draft,
  onClose,
}: PolicyDraftFormDialogProps) {
  return draft ? (
    <EditDraftDialog draft={draft} open={open} onClose={onClose} />
  ) : (
    <CreateDraftDialog open={open} onClose={onClose} />
  );
}

function CreateDraftDialog({
  open,
  onClose,
}: Omit<PolicyDraftFormDialogProps, "draft">) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const mutation = useCreatePolicyDraft();
  const toast = useToast();
  const [message, setMessage] = useState<string>();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<CreatePolicyDraftInput, unknown, CreatePolicyDraftRequest>({
    resolver: zodResolver(createPolicyDraftSchema),
    defaultValues: createDefaults,
  });

  useDialogState(dialogRef, open);
  const close = (): void => {
    if (
      isDirty &&
      !mutation.isPending &&
      !window.confirm("Bỏ các nội dung chưa lưu?")
    )
      return;
    reset(createDefaults);
    setMessage(undefined);
    onClose();
  };
  const submit = async (values: CreatePolicyDraftRequest): Promise<void> => {
    setMessage(undefined);
    try {
      const created = await mutation.mutateAsync(values);
      reset(createDefaults);
      onClose();
      toast.success(
        "Đã tạo bản nháp",
        `${created.policyCode} – ${created.title}`,
      );
    } catch (error: unknown) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Không thể tạo bản nháp. Vui lòng thử lại.",
      );
    }
  };

  return (
    <Dialog
      className="max-h-[calc(100dvh-2rem)] w-[min(48rem,calc(100%-2rem))] overflow-y-auto"
      dialogRef={dialogRef}
      title="Tạo bản nháp chính sách"
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onClose={onClose}
    >
      <form className="space-y-4" noValidate onSubmit={handleSubmit(submit)}>
        {message ? (
          <Alert className="border-danger/25 bg-danger-soft text-danger">
            {message}
          </Alert>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            id="policyCode"
            label="Mã chính sách"
            error={errors.policyCode?.message}
          >
            <Input
              id="policyCode"
              maxLength={50}
              aria-invalid={Boolean(errors.policyCode)}
              aria-describedby={
                errors.policyCode ? "policyCode-error" : undefined
              }
              {...register("policyCode")}
            />
          </FormField>
          <FormField
            id="versionNumber"
            label="Phiên bản"
            error={errors.versionNumber?.message}
          >
            <Input
              id="versionNumber"
              maxLength={30}
              aria-invalid={Boolean(errors.versionNumber)}
              aria-describedby={
                errors.versionNumber ? "versionNumber-error" : undefined
              }
              {...register("versionNumber")}
            />
          </FormField>
        </div>
        <FormField
          id="title"
          label="Tên chính sách"
          error={errors.title?.message}
        >
          <Input
            id="title"
            maxLength={255}
            aria-invalid={Boolean(errors.title)}
            {...register("title")}
          />
        </FormField>
        <FormField
          id="description"
          label="Mô tả"
          error={errors.description?.message}
        >
          <Textarea
            id="description"
            maxLength={2_000}
            rows={3}
            {...register("description")}
          />
        </FormField>
        <FormField
          id="content"
          label="Nội dung chính sách"
          error={errors.content?.message}
        >
          <Textarea
            id="content"
            className="min-h-64 font-mono leading-6"
            maxLength={500_000}
            aria-invalid={Boolean(errors.content)}
            {...register("content")}
          />
        </FormField>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            disabled={mutation.isPending}
            onClick={close}
          >
            Hủy
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Đang tạo…" : "Tạo bản nháp"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

function EditDraftDialog({
  open,
  draft,
  onClose,
}: PolicyDraftFormDialogProps & { draft: OwnedPolicyDraft }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const mutation = useUpdatePolicyDraft();
  const toast = useToast();
  const [message, setMessage] = useState<string>();
  const defaults: UpdatePolicyDraftInput = {
    title: draft.title,
    description: draft.description ?? "",
    versionNumber: draft.version.versionNumber,
    content: draft.version.content,
    changeSummary: draft.version.changeSummary ?? "",
  };
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<UpdatePolicyDraftInput, unknown, UpdatePolicyDraftRequest>({
    resolver: zodResolver(updatePolicyDraftSchema),
    defaultValues: defaults,
  });

  useDialogState(dialogRef, open);
  useEffect(() => {
    reset({
      title: draft.title,
      description: draft.description ?? "",
      versionNumber: draft.version.versionNumber,
      content: draft.version.content,
      changeSummary: draft.version.changeSummary ?? "",
    });
  }, [
    draft.description,
    draft.title,
    draft.version.changeSummary,
    draft.version.content,
    draft.version.versionNumber,
    open,
    reset,
  ]);
  const close = (): void => {
    if (
      isDirty &&
      !mutation.isPending &&
      !window.confirm("Bỏ các thay đổi chưa lưu?")
    )
      return;
    setMessage(undefined);
    onClose();
  };
  const submit = async (values: UpdatePolicyDraftRequest): Promise<void> => {
    setMessage(undefined);
    try {
      await mutation.mutateAsync({
        policyId: draft.policyId,
        versionId: draft.version.id,
        input: values,
      });
      reset(values);
      onClose();
      toast.success("Đã cập nhật bản nháp", draft.policyCode);
    } catch (error: unknown) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Không thể cập nhật bản nháp. Vui lòng thử lại.",
      );
    }
  };

  return (
    <Dialog
      className="max-h-[calc(100dvh-2rem)] w-[min(48rem,calc(100%-2rem))] overflow-y-auto"
      dialogRef={dialogRef}
      title={`Chỉnh sửa ${draft.policyCode}`}
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onClose={onClose}
    >
      <form className="space-y-4" noValidate onSubmit={handleSubmit(submit)}>
        {message ? (
          <Alert className="border-danger/25 bg-danger-soft text-danger">
            {message}
          </Alert>
        ) : null}
        <FormField
          id="edit-versionNumber"
          label="Phiên bản"
          error={errors.versionNumber?.message}
        >
          <Input
            id="edit-versionNumber"
            maxLength={30}
            aria-invalid={Boolean(errors.versionNumber)}
            {...register("versionNumber")}
          />
        </FormField>
        <FormField
          id="edit-title"
          label="Tên chính sách"
          error={errors.title?.message}
        >
          <Input
            id="edit-title"
            maxLength={255}
            aria-invalid={Boolean(errors.title)}
            {...register("title")}
          />
        </FormField>
        <FormField
          id="edit-description"
          label="Mô tả"
          error={errors.description?.message}
        >
          <Textarea
            id="edit-description"
            maxLength={2_000}
            rows={3}
            {...register("description")}
          />
        </FormField>
        <FormField
          id="edit-content"
          label="Nội dung chính sách"
          error={errors.content?.message}
        >
          <Textarea
            id="edit-content"
            className="min-h-64 font-mono leading-6"
            maxLength={500_000}
            aria-invalid={Boolean(errors.content)}
            {...register("content")}
          />
        </FormField>
        <FormField
          id="edit-changeSummary"
          label="Tóm tắt thay đổi"
          error={errors.changeSummary?.message}
        >
          <Textarea
            id="edit-changeSummary"
            maxLength={5_000}
            rows={3}
            {...register("changeSummary")}
          />
        </FormField>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            disabled={mutation.isPending}
            onClick={close}
          >
            Hủy
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Đang lưu…" : "Lưu thay đổi"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

function useDialogState(
  ref: React.RefObject<HTMLDialogElement | null>,
  open: boolean,
): void {
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open, ref]);
}
