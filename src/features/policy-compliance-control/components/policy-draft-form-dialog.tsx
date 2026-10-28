"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertTriangle,
  FileText,
  Hash,
  History,
  Info,
  Loader2,
  Tag,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/feedback/toast";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

/* \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 Create \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */

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
    if (isDirty && !mutation.isPending && !window.confirm("Discard unsaved content?"))
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
        created.policyCode + " – " + created.title,
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
    <Dialog
      title="Create Policy Draft"
      dialogRef={dialogRef}
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onClose={onClose}
      className="max-h-[calc(100dvh-2rem)] w-[min(52rem,calc(100%-2rem))] overflow-y-auto"
    >
      <form className="space-y-5" noValidate onSubmit={handleSubmit(submit)}>

        {/* Info hint */}
        <div className="border-border bg-neutral-soft/30 flex gap-2.5 rounded-xl border p-3.5">
          <Info className="mt-0.5 size-4 shrink-0 text-brand" strokeWidth={1.8} />
          <p className="text-muted text-xs leading-5">
            New draft will be saved and available for editing before submission for review.
            Policy code cannot be changed after creation.
          </p>
        </div>

        {/* Error banner */}
        {message ? (
          <div>
            <div className="border-border bg-neutral-soft/30 flex gap-2.5 rounded-xl border p-3.5">
              <AlertTriangle
                className="mt-0.5 size-4 shrink-0 text-danger"
                strokeWidth={1.8}
              />
              <p className="text-danger text-xs leading-5">{message}</p>
            </div>
          </div>
        ) : null}

        <fieldset disabled={mutation.isPending} className="space-y-5">

          {/* Identity section */}
          <div className="space-y-3">
            <div className="flex items-start gap-2 border-b border-border pb-2">
              <Hash className="mt-0.5 size-4 shrink-0 text-brand" strokeWidth={1.8} />
              <h3 className="text-sm font-semibold">Identity</h3>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="policyCode" className="block text-sm font-medium">
                  Policy code
                </label>
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
                {errors.policyCode ? (
                  <p id="policyCode-error" role="alert" className="text-danger text-xs">
                    {errors.policyCode.message}
                  </p>
                ) : (
                  <p id="policyCode-hint" className="text-muted text-xs">
                    Letters, numbers, periods, underscores and hyphens only.
                    Automatically uppercased.
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <label htmlFor="versionNumber" className="block text-sm font-medium">
                  Version
                </label>
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
                {errors.versionNumber ? (
                  <p id="versionNumber-error" role="alert" className="text-danger text-xs">
                    {errors.versionNumber.message}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          {/* Content section */}
          <div className="space-y-3">
            <div className="flex items-start gap-2 border-b border-border pb-2">
              <Tag className="mt-0.5 size-4 shrink-0 text-brand" strokeWidth={1.8} />
              <h3 className="text-sm font-semibold">Content</h3>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="title" className="block text-sm font-medium">
                  Policy title
                </label>
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
                    aria-describedby={errors.title ? "title-error" : undefined}
                    {...register("title")}
                  />
                </div>
                {errors.title ? (
                  <p id="title-error" role="alert" className="text-danger text-xs">
                    {errors.title.message}
                  </p>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <label htmlFor="description" className="block text-sm font-medium">
                  Description
                  <span className="text-muted ml-1 font-normal">(optional)</span>
                </label>
                <Textarea
                  id="description"
                  maxLength={2000}
                  rows={2}
                  placeholder="Brief summary of this policy's purpose and scope."
                  aria-invalid={Boolean(errors.description)}
                  aria-describedby={
                    errors.description ? "description-error" : "description-hint"
                  }
                  {...register("description")}
                />
                {errors.description ? (
                  <p id="description-error" role="alert" className="text-danger text-xs">
                    {errors.description.message}
                  </p>
                ) : (
                  <p id="description-hint" className="text-muted text-xs">
                    Maximum 2,000 characters.
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <label htmlFor="content" className="block text-sm font-medium">
                  Policy content
                </label>
                <Textarea
                  id="content"
                  className={cn(
                    "min-h-64 font-mono text-sm leading-6",
                    errors.content ? "border-danger" : "",
                  )}
                  maxLength={500000}
                  placeholder="Enter the full policy text. Markdown or plain text is accepted."
                  aria-invalid={Boolean(errors.content)}
                  aria-describedby={errors.content ? "content-error" : "content-hint"}
                  {...register("content")}
                />
                {errors.content ? (
                  <p id="content-error" role="alert" className="text-danger text-xs">
                    {errors.content.message}
                  </p>
                ) : (
                  <p id="content-hint" className="text-muted text-xs">
                    Maximum 500,000 characters.
                  </p>
                )}
              </div>
            </div>
          </div>
        </fieldset>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
          <Button
            type="button"
            variant="secondary"
            disabled={mutation.isPending}
            onClick={close}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={mutation.isPending}
            className={cn(mutation.isPending && "opacity-80")}
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="mr-1.5 size-3.5 animate-spin" strokeWidth={2} />
                Creating…
              </>
            ) : (
              "Create draft"
            )}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

/* \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 Edit \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */

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
    if (isDirty && !mutation.isPending && !window.confirm("Discard unsaved changes?"))
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
    <Dialog
      title="Edit draft"
      dialogRef={dialogRef}
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onClose={onClose}
      className="max-h-[calc(100dvh-2rem)] w-[min(52rem,calc(100%-2rem))] overflow-y-auto"
    >
      <form className="space-y-5" noValidate onSubmit={handleSubmit(submit)}>

        {/* Context bar */}
        <div className="border-border bg-neutral-soft/30 flex flex-wrap items-center gap-3 rounded-lg border p-3.5 text-xs">
          <FileText className="size-3.5 shrink-0 text-brand" strokeWidth={1.8} />
          <code className="font-mono font-semibold">{draft.policyCode}</code>
          <span className="text-muted">·</span>
          <span className="text-muted">
            Status:{" "}
            <strong className="text-foreground capitalize">
              {draft.policyStatus.toLowerCase().replace(/_/g, " ")}
            </strong>
          </span>
          <span className="text-muted">·</span>
          <span className="text-muted">
            Version:{" "}
            <strong className="text-foreground font-mono">
              {draft.version.versionNumber}
            </strong>
          </span>
          <span className="text-muted">·</span>
          <span className="text-muted capitalize">
            {draft.version.status.toLowerCase().replace(/_/g, " ")}
          </span>
        </div>

        {/* Revision notice */}
        <PolicyRevisionNotice request={draft.revisionRequest} />

        {/* Info hint */}
        <div className="border-border bg-neutral-soft/30 flex gap-2.5 rounded-xl border p-3.5">
          <Info className="mt-0.5 size-4 shrink-0 text-brand" strokeWidth={1.8} />
          <p className="text-muted text-xs leading-5">
            Changes are saved to this draft only and do not affect any published version.
            Policy code cannot be changed.
          </p>
        </div>

        {/* Error banner */}
        {message ? (
          <div>
            <div className="border-border bg-neutral-soft/30 flex gap-2.5 rounded-xl border p-3.5">
              <AlertTriangle
                className="mt-0.5 size-4 shrink-0 text-danger"
                strokeWidth={1.8}
              />
              <p className="text-danger text-xs leading-5">{message}</p>
            </div>
          </div>
        ) : null}

        <fieldset disabled={mutation.isPending} className="space-y-5">

          {/* Identity section */}
          <div className="space-y-3">
            <div className="flex items-start gap-2 border-b border-border pb-2">
              <Hash className="mt-0.5 size-4 shrink-0 text-brand" strokeWidth={1.8} />
              <h3 className="text-sm font-semibold">Identity</h3>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="edit-title" className="block text-sm font-medium">
                  Policy title
                </label>
                <Input
                  id="edit-title"
                  maxLength={255}
                  aria-invalid={Boolean(errors.title)}
                  aria-describedby={errors.title ? "edit-title-error" : undefined}
                  {...register("title")}
                />
                {errors.title ? (
                  <p id="edit-title-error" role="alert" className="text-danger text-xs">
                    {errors.title.message}
                  </p>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <label htmlFor="edit-versionNumber" className="block text-sm font-medium">
                  Version
                </label>
                <Input
                  id="edit-versionNumber"
                  className="font-mono"
                  maxLength={30}
                  aria-invalid={Boolean(errors.versionNumber)}
                  aria-describedby={
                    errors.versionNumber ? "edit-versionNumber-error" : undefined
                  }
                  {...register("versionNumber")}
                />
                {errors.versionNumber ? (
                  <p
                    id="edit-versionNumber-error"
                    role="alert"
                    className="text-danger text-xs"
                  >
                    {errors.versionNumber.message}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          {/* Content section */}
          <div className="space-y-3">
            <div className="flex items-start gap-2 border-b border-border pb-2">
              <Tag className="mt-0.5 size-4 shrink-0 text-brand" strokeWidth={1.8} />
              <h3 className="text-sm font-semibold">Content</h3>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="edit-description" className="block text-sm font-medium">
                  Description
                  <span className="text-muted ml-1 font-normal">(optional)</span>
                </label>
                <Textarea
                  id="edit-description"
                  maxLength={2000}
                  rows={2}
                  aria-describedby={
                    errors.description ? "edit-description-error" : "edit-description-hint"
                  }
                  {...register("description")}
                />
                {errors.description ? (
                  <p
                    id="edit-description-error"
                    role="alert"
                    className="text-danger text-xs"
                  >
                    {errors.description.message}
                  </p>
                ) : (
                  <p id="edit-description-hint" className="text-muted text-xs">
                    Maximum 2,000 characters.
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <label htmlFor="edit-content" className="block text-sm font-medium">
                  Policy content
                </label>
                <Textarea
                  id="edit-content"
                  className={cn(
                    "min-h-64 font-mono text-sm leading-6",
                    errors.content ? "border-danger" : "",
                  )}
                  maxLength={500000}
                  aria-invalid={Boolean(errors.content)}
                  aria-describedby={
                    errors.content ? "edit-content-error" : "edit-content-hint"
                  }
                  {...register("content")}
                />
                {errors.content ? (
                  <p id="edit-content-error" role="alert" className="text-danger text-xs">
                    {errors.content.message}
                  </p>
                ) : (
                  <p id="edit-content-hint" className="text-muted text-xs">
                    Maximum 500,000 characters.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Change summary section */}
          <div className="space-y-3">
            <div className="flex items-start gap-2 border-b border-border pb-2">
              <History className="mt-0.5 size-4 shrink-0 text-brand" strokeWidth={1.8} />
              <h3 className="text-sm font-semibold">Audit trail</h3>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="edit-changeSummary" className="block text-sm font-medium">
                Change summary
                <span className="text-muted ml-1 font-normal">(optional)</span>
              </label>
              <Textarea
                id="edit-changeSummary"
                maxLength={5000}
                rows={3}
                placeholder="Briefly describe what changed in this version and why."
                aria-describedby={
                  errors.changeSummary
                    ? "edit-changeSummary-error"
                    : "edit-changeSummary-hint"
                }
                {...register("changeSummary")}
              />
              {errors.changeSummary ? (
                <p
                  id="edit-changeSummary-error"
                  role="alert"
                  className="text-danger text-xs"
                >
                  {errors.changeSummary.message}
                </p>
              ) : (
                <p id="edit-changeSummary-hint" className="text-muted text-xs">
                  Recorded in the version audit trail. Maximum 5,000 characters.
                </p>
              )}
            </div>
          </div>
        </fieldset>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
          <Button
            type="button"
            variant="secondary"
            disabled={mutation.isPending}
            onClick={close}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={mutation.isPending || !isDirty}
            className={cn(mutation.isPending && "opacity-80")}
          >
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
    </Dialog>
  );
}

/* \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 Shared util \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */

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
