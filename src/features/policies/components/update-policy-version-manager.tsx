"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  CheckCircle2,
  FilePenLine,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  ProductPageHeader,
  ProductPanel,
  StatusBadge,
} from "@/components/data-display/static-product";
import { useToast } from "@/components/feedback/toast";
import { FormField } from "@/components/forms/form-field";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useSessionUser } from "@/features/auth";
import { ApiError } from "@/lib/api/api-error";
import { useUpdatePolicyVersion } from "../hooks/use-update-policy-version";
import {
  updatePolicyVersionFormSchema,
  updatePolicyVersionRequestSchema,
  type NewPolicyVersion,
  type UpdatePolicyVersionFormInput,
  type UpdatePolicyVersionFormValues,
} from "../schemas/update-policy-version-schema";

type UpdatePolicyVersionManagerProps = {
  onBack?: () => void;
};

const defaultValues: UpdatePolicyVersionFormInput = {
  policyId: "",
  title: "",
  description: "",
  versionNumber: "",
  content: "",
  changeSummary: "",
};

function getErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) {
    return "Unable to create the new version. Please try again.";
  }
  if (error.status === 404) {
    return "Policy not found. Confirm the policy ID and that your account owns it.";
  }
  if (error.status === 403) {
    return "Your account does not have permission to update policies.";
  }
  if (error.status === 409) {
    return `${error.message} Resolve the policy state or version conflict, then try again.`;
  }
  return error.message;
}

export function UpdatePolicyVersionManager({
  onBack,
}: UpdatePolicyVersionManagerProps) {
  const session = useSessionUser();
  const mutation = useUpdatePolicyVersion();
  const toast = useToast();
  const [submitError, setSubmitError] = useState<string>();
  const [created, setCreated] = useState<NewPolicyVersion>();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<
    UpdatePolicyVersionFormInput,
    unknown,
    UpdatePolicyVersionFormValues
  >({
    resolver: zodResolver(updatePolicyVersionFormSchema),
    defaultValues,
  });
  const canUpdate =
    session.data?.permissions.includes("policies.update") ?? false;

  const leaveWorkflow = (): void => {
    if (
      isDirty &&
      !mutation.isPending &&
      !window.confirm("Discard the new policy version details?")
    ) {
      return;
    }
    reset(defaultValues);
    setSubmitError(undefined);
    setCreated(undefined);
    onBack?.();
  };

  const submit = async (
    values: UpdatePolicyVersionFormValues,
  ): Promise<void> => {
    const { policyId, title, description, ...requiredFields } = values;
    const input = updatePolicyVersionRequestSchema.parse({
      ...requiredFields,
      ...(title === undefined ? {} : { title }),
      ...(description === undefined ? {} : { description }),
    });
    setSubmitError(undefined);
    setCreated(undefined);
    try {
      const result = await mutation.mutateAsync({ policyId, input });
      setCreated(result);
      reset(defaultValues);
      toast.success(
        "New policy version created",
        `${result.policyCode} version ${result.version.versionNumber} is ready for review as a draft.`,
      );
    } catch (error: unknown) {
      setSubmitError(getErrorMessage(error));
    }
  };

  return (
    <>
      <ProductPageHeader
        description="Update a published information security policy and create its next draft version for review."
        showSampleNotice={false}
        title="Update policy and create new version"
        {...(onBack
          ? {
              onSecondaryAction: leaveWorkflow,
              secondaryAction: "Back to drafts",
              secondaryActionIcon: (
                <ArrowLeft
                  aria-hidden="true"
                  className="size-4"
                  strokeWidth={1.8}
                />
              ),
            }
          : {})}
      />

      {session.isPending ? (
        <ProductPanel title="Checking access">
          <div
            aria-label="Checking policy permissions"
            className="space-y-3 p-5"
          >
            <div className="bg-neutral-soft h-5 w-56 animate-pulse rounded motion-reduce:animate-none" />
            <div className="bg-neutral-soft h-10 animate-pulse rounded motion-reduce:animate-none" />
          </div>
        </ProductPanel>
      ) : session.isError ? (
        <Alert>
          <strong className="block">Unable to verify your access</strong>
          <span>Refresh the page or sign in again.</span>
        </Alert>
      ) : !canUpdate ? (
        <Alert>
          <strong className="block">
            You do not have permission to update policies
          </strong>
          <span>
            Contact an administrator to request the policies.update permission.
          </span>
        </Alert>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <ProductPanel
            description="The published version remains effective until an administrator publishes this new draft."
            title="New version details"
          >
            <form
              className="space-y-5 p-5"
              noValidate
              onSubmit={handleSubmit(submit)}
            >
              {submitError ? (
                <Alert
                  className="border-danger/25 bg-danger-soft text-danger"
                  role="alert"
                >
                  <strong className="block">Unable to create version</strong>
                  <span>{submitError}</span>
                </Alert>
              ) : null}

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  id="policy-id"
                  label="Policy ID"
                  error={errors.policyId?.message}
                >
                  <Input
                    id="policy-id"
                    placeholder="00000000-0000-0000-0000-000000000000"
                    aria-invalid={Boolean(errors.policyId)}
                    aria-describedby={
                      errors.policyId ? "policy-id-error" : "policy-id-help"
                    }
                    {...register("policyId")}
                  />
                  {!errors.policyId ? (
                    <p className="text-muted text-xs" id="policy-id-help">
                      Enter the ID of a published policy owned by your account.
                    </p>
                  ) : null}
                </FormField>
                <FormField
                  id="version-number"
                  label="New version number"
                  error={errors.versionNumber?.message}
                >
                  <Input
                    id="version-number"
                    maxLength={30}
                    placeholder="For example, 1.1"
                    aria-invalid={Boolean(errors.versionNumber)}
                    aria-describedby={
                      errors.versionNumber
                        ? "version-number-error"
                        : "version-number-help"
                    }
                    {...register("versionNumber")}
                  />
                  {!errors.versionNumber ? (
                    <p className="text-muted text-xs" id="version-number-help">
                      Use a version number that does not already exist for this
                      policy.
                    </p>
                  ) : null}
                </FormField>
              </div>

              <FormField
                id="policy-title"
                label="Updated title (optional)"
                error={errors.title?.message}
              >
                <Input
                  id="policy-title"
                  maxLength={255}
                  aria-invalid={Boolean(errors.title)}
                  aria-describedby={
                    errors.title ? "policy-title-error" : "policy-title-help"
                  }
                  {...register("title")}
                />
                {!errors.title ? (
                  <p className="text-muted text-xs" id="policy-title-help">
                    Leave blank to keep the current policy title.
                  </p>
                ) : null}
              </FormField>

              <FormField
                id="policy-description"
                label="Updated description (optional)"
                error={errors.description?.message}
              >
                <Textarea
                  id="policy-description"
                  className="min-h-24"
                  maxLength={2_000}
                  aria-invalid={Boolean(errors.description)}
                  aria-describedby={
                    errors.description
                      ? "policy-description-error"
                      : "policy-description-help"
                  }
                  {...register("description")}
                />
                {!errors.description ? (
                  <p
                    className="text-muted text-xs"
                    id="policy-description-help"
                  >
                    Leave blank to keep the current policy description.
                  </p>
                ) : null}
              </FormField>

              <FormField
                id="policy-content"
                label="Policy content"
                error={errors.content?.message}
              >
                <Textarea
                  id="policy-content"
                  className="min-h-64 font-mono leading-6"
                  maxLength={500_000}
                  aria-invalid={Boolean(errors.content)}
                  aria-describedby={
                    errors.content ? "policy-content-error" : undefined
                  }
                  {...register("content")}
                />
              </FormField>

              <FormField
                id="change-summary"
                label="Change summary"
                error={errors.changeSummary?.message}
              >
                <Textarea
                  id="change-summary"
                  className="min-h-28"
                  maxLength={5_000}
                  aria-invalid={Boolean(errors.changeSummary)}
                  aria-describedby={
                    errors.changeSummary ? "change-summary-error" : undefined
                  }
                  {...register("changeSummary")}
                />
              </FormField>

              <div className="border-border flex flex-col-reverse gap-2 border-t pt-5 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={mutation.isPending}
                  onClick={() => {
                    reset(defaultValues);
                    setSubmitError(undefined);
                    setCreated(undefined);
                  }}
                >
                  Clear form
                </Button>
                <Button type="submit" disabled={mutation.isPending}>
                  <FilePenLine
                    aria-hidden="true"
                    className="size-4"
                    strokeWidth={1.8}
                  />
                  {mutation.isPending
                    ? "Creating version…"
                    : "Create draft version"}
                </Button>
              </div>
            </form>
          </ProductPanel>

          <div className="space-y-5">
            <ProductPanel title="Workflow">
              <ol className="text-muted space-y-4 p-5 text-sm leading-6">
                <li className="flex gap-3">
                  <ShieldCheck
                    aria-hidden="true"
                    className="text-brand mt-1 size-4 shrink-0"
                    strokeWidth={1.8}
                  />
                  <span>
                    The policy must be published, owned by your account, and
                    have no existing draft version.
                  </span>
                </li>
                <li className="flex gap-3">
                  <FilePenLine
                    aria-hidden="true"
                    className="text-brand mt-1 size-4 shrink-0"
                    strokeWidth={1.8}
                  />
                  <span>
                    The backend saves a new draft version and records the change
                    in the audit log.
                  </span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle2
                    aria-hidden="true"
                    className="text-brand mt-1 size-4 shrink-0"
                    strokeWidth={1.8}
                  />
                  <span>
                    An administrator reviews and publishes the draft in a
                    separate step.
                  </span>
                </li>
              </ol>
            </ProductPanel>

            {created ? (
              <ProductPanel title="Version created">
                <dl
                  aria-live="polite"
                  className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-3 p-5 text-sm"
                >
                  <dt className="text-muted">Policy</dt>
                  <dd className="min-w-0 font-medium break-words">
                    {created.policyCode}
                  </dd>
                  <dt className="text-muted">Version</dt>
                  <dd className="font-medium tabular-nums">
                    {created.version.versionNumber}
                  </dd>
                  <dt className="text-muted">Status</dt>
                  <dd>
                    <StatusBadge tone="info">Draft</StatusBadge>
                  </dd>
                </dl>
              </ProductPanel>
            ) : null}
          </div>
        </div>
      )}
    </>
  );
}
