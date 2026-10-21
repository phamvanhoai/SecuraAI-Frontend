"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { FileText, Hash, Tag } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { FormField } from "@/components/forms/form-field";
import { useToast } from "@/components/feedback/toast";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { PolicyRevisionNotice } from "./policy-revision-notice";
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

/* ─────────────────────── Create ─────────────────────── */

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
      !window.confirm("Discard unsaved content?")
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
        "Policy draft created",
        `${created.policyCode} – ${created.title}`,
      );
    } catch (error: unknown) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to create the policy draft. Please try again.",
      );
    }
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="create-draft-title"
      className="border-border bg-surface text-foreground m-auto max-h-[calc(100dvh-2rem)] w-[min(52rem,calc(100%-2rem))] overflow-y-auto rounded-xl border p-0 backdrop:bg-[#07110f]/55"
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onClose={onClose}
    >
      {/* Header */}
      <div className="border-border sticky top-0 z-10 flex items-start gap-3 border-b bg-[var(--surface)] px-6 py-5">
        <div className="bg-brand/10 flex size-9 shrink-0 items-center justify-center rounded-lg">
          <FileText
            aria-hidden="true"
            className="text-brand size-4"
            strokeWidth={1.8}
          />
        </div>
        <div className="min-w-0">
          <h2
            id="create-draft-title"
            className="text-base leading-5 font-semibold"
          >
            Create policy draft
          </h2>
          <p className="text-muted mt-0.5 text-sm leading-5">
            New draft will be saved and available for editing before submission.
          </p>
        </div>
      </div>

      {/* Body */}
      <form
        className="space-y-5 px-6 py-5"
        noValidate
        onSubmit={handleSubmit(submit)}
      >
        {message ? (
          <Alert className="border-danger/25 bg-danger-soft text-danger">
            {message}
          </Alert>
        ) : null}

        {/* Identity row */}
        <fieldset className="border-border rounded-lg border p-4">
          <legend className="text-foreground -ml-1 px-1 text-xs font-semibold tracking-wide uppercase">
            Identity
          </legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              id="policyCode"
              label="Policy code"
              error={errors.policyCode?.message}
            >
              <div className="relative">
                <Hash
                  aria-hidden="true"
                  className="text-muted pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2"
                  strokeWidth={1.8}
                />
                <Input
                  id="policyCode"
                  className="pl-8 font-mono uppercase"
                  maxLength={50}
                  placeholder="e.g. ISP-001"
                  aria-invalid={Boolean(errors.policyCode)}
                  aria-describedby={
                    errors.policyCode ? "policyCode-error" : "policyCode-hint"
                  }
                  {...register("policyCode")}
                />
              </div>
              {!errors.policyCode ? (
                <p id="policyCode-hint" className="text-muted text-xs">
                  Letters, numbers, periods, underscores and hyphens only.
                  Automatically uppercased.
                </p>
              ) : null}
            </FormField>
            <FormField
              id="versionNumber"
              label="Version"
              error={errors.versionNumber?.message}
            >
              <Input
                id="versionNumber"
                className="font-mono"
                maxLength={30}
                placeholder="e.g. 1.0"
                aria-invalid={Boolean(errors.versionNumber)}
                aria-describedby={
                  errors.versionNumber ? "versionNumber-error" : undefined
                }
                {...register("versionNumber")}
              />
            </FormField>
          </div>
        </fieldset>

        {/* Content fields */}
        <fieldset className="border-border rounded-lg border p-4">
          <legend className="text-foreground -ml-1 px-1 text-xs font-semibold tracking-wide uppercase">
            Content
          </legend>
          <div className="space-y-4">
            <FormField
              id="title"
              label="Policy title"
              error={errors.title?.message}
            >
              <div className="relative">
                <Tag
                  aria-hidden="true"
                  className="text-muted pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2"
                  strokeWidth={1.8}
                />
                <Input
                  id="title"
                  className="pl-8"
                  maxLength={255}
                  placeholder="e.g. Information Security Acceptable Use Policy"
                  aria-invalid={Boolean(errors.title)}
                  {...register("title")}
                />
              </div>
            </FormField>
            <FormField
              id="description"
              label="Description"
              error={errors.description?.message}
            >
              <Textarea
                id="description"
                maxLength={2_000}
                rows={2}
                placeholder="Brief summary of this policy's purpose and scope."
                {...register("description")}
              />
              <p className="text-muted text-xs">
                Optional. Max 2,000 characters.
              </p>
            </FormField>
            <FormField
              id="content"
              label="Policy content"
              error={errors.content?.message}
            >
              <Textarea
                id="content"
                className={cn(
                  "min-h-64 font-mono text-sm leading-6",
                  errors.content ? "border-danger" : "",
                )}
                maxLength={500_000}
                placeholder="Enter the full policy text. Markdown or plain text is accepted."
                aria-invalid={Boolean(errors.content)}
                aria-describedby={
                  errors.content ? "content-error" : "content-hint"
                }
                {...register("content")}
              />
              {!errors.content ? (
                <p id="content-hint" className="text-muted text-xs">
                  Max 500,000 characters.
                </p>
              ) : null}
            </FormField>
          </div>
        </fieldset>

        {/* Actions */}
        <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            disabled={mutation.isPending}
            onClick={close}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Creating…" : "Create draft"}
          </Button>
        </div>
      </form>
    </dialog>
  );
}

/* ─────────────────────── Edit ─────────────────────── */

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
      !window.confirm("Discard unsaved changes?")
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
      toast.success("Policy draft updated", draft.policyCode);
    } catch (error: unknown) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to update the policy draft. Please try again.",
      );
    }
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="edit-draft-title"
      className="border-border bg-surface text-foreground m-auto max-h-[calc(100dvh-2rem)] w-[min(52rem,calc(100%-2rem))] overflow-y-auto rounded-xl border p-0 backdrop:bg-[#07110f]/55"
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onClose={onClose}
    >
      {/* Sticky header */}
      <div className="border-border sticky top-0 z-10 flex items-start gap-3 border-b bg-[var(--surface)] px-6 py-5">
        <div className="bg-brand/10 flex size-9 shrink-0 items-center justify-center rounded-lg">
          <FileText
            aria-hidden="true"
            className="text-brand size-4"
            strokeWidth={1.8}
          />
        </div>
        <div className="min-w-0 flex-1">
          <h2
            id="edit-draft-title"
            className="text-base leading-5 font-semibold"
          >
            Edit draft
          </h2>
          <p className="text-muted mt-0.5 text-sm leading-5">
            Changes are saved to the draft and do not affect any published
            version.
          </p>
        </div>
      </div>

      {/* Body */}
      <form
        className="space-y-5 px-6 py-5"
        noValidate
        onSubmit={handleSubmit(submit)}
      >
        {message ? (
          <Alert className="border-danger/25 bg-danger-soft text-danger">
            {message}
          </Alert>
        ) : null}

        {/* Read-only context strip */}
        <PolicyRevisionNotice request={draft.revisionRequest} />
        <div className="bg-neutral-soft grid grid-cols-2 gap-3 rounded-lg p-4 sm:grid-cols-4">
          <div>
            <p className="text-muted text-xs font-medium tracking-wide uppercase">
              Policy code
            </p>
            <code className="text-foreground mt-1 block text-sm font-semibold">
              {draft.policyCode}
            </code>
          </div>
          <div>
            <p className="text-muted text-xs font-medium tracking-wide uppercase">
              Status
            </p>
            <p className="text-foreground mt-1 text-sm font-semibold capitalize">
              {draft.policyStatus.toLowerCase().replace(/_/g, " ")}
            </p>
          </div>
          <div>
            <p className="text-muted text-xs font-medium tracking-wide uppercase">
              Version status
            </p>
            <p className="text-foreground mt-1 text-sm font-semibold capitalize">
              {draft.version.status.toLowerCase().replace(/_/g, " ")}
            </p>
          </div>
          <div>
            <p className="text-muted text-xs font-medium tracking-wide uppercase">
              Last updated
            </p>
            <p className="text-foreground mt-1 text-sm font-semibold">
              {new Intl.DateTimeFormat("en-US", {
                dateStyle: "medium",
              }).format(new Date(draft.updatedAt))}
            </p>
          </div>
        </div>

        {/* Identity fields */}
        <fieldset className="border-border rounded-lg border p-4">
          <legend className="text-foreground -ml-1 px-1 text-xs font-semibold tracking-wide uppercase">
            Identity
          </legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              id="edit-title"
              label="Policy title"
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
              id="edit-versionNumber"
              label="Version"
              error={errors.versionNumber?.message}
            >
              <Input
                id="edit-versionNumber"
                className="font-mono"
                maxLength={30}
                aria-invalid={Boolean(errors.versionNumber)}
                {...register("versionNumber")}
              />
            </FormField>
          </div>
        </fieldset>

        {/* Content fields */}
        <fieldset className="border-border rounded-lg border p-4">
          <legend className="text-foreground -ml-1 px-1 text-xs font-semibold tracking-wide uppercase">
            Content
          </legend>
          <div className="space-y-4">
            <FormField
              id="edit-description"
              label="Description"
              error={errors.description?.message}
            >
              <Textarea
                id="edit-description"
                maxLength={2_000}
                rows={2}
                {...register("description")}
              />
              <p className="text-muted text-xs">
                Optional. Max 2,000 characters.
              </p>
            </FormField>
            <FormField
              id="edit-content"
              label="Policy content"
              error={errors.content?.message}
            >
              <Textarea
                id="edit-content"
                className={cn(
                  "min-h-64 font-mono text-sm leading-6",
                  errors.content ? "border-danger" : "",
                )}
                maxLength={500_000}
                aria-invalid={Boolean(errors.content)}
                {...register("content")}
              />
              {!errors.content ? (
                <p className="text-muted text-xs">Max 500,000 characters.</p>
              ) : null}
            </FormField>
          </div>
        </fieldset>

        {/* Change summary */}
        <fieldset className="border-border rounded-lg border p-4">
          <legend className="text-foreground -ml-1 px-1 text-xs font-semibold tracking-wide uppercase">
            Audit
          </legend>
          <FormField
            id="edit-changeSummary"
            label="Change summary"
            error={errors.changeSummary?.message}
          >
            <Textarea
              id="edit-changeSummary"
              maxLength={5_000}
              rows={3}
              placeholder="Briefly describe what changed in this version and why."
              {...register("changeSummary")}
            />
            <p className="text-muted text-xs">
              Recorded in the version audit trail. Max 5,000 characters.
            </p>
          </FormField>
        </fieldset>

        {/* Actions */}
        <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            disabled={mutation.isPending}
            onClick={close}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </form>
    </dialog>
  );
}

/* ─────────────────────── Shared util ─────────────────────── */

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
