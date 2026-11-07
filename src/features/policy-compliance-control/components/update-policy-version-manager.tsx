"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  FileText,
  FilePenLine,
  Hash,
  History,
  Info,
  Loader2,
  ShieldCheck,
  Tag,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import {
  ProductPageHeader,
  ProductPanel,
  StatusBadge,
} from "@/components/data-display/static-product";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/data-display/data-table";
import { EmptyState } from "@/components/feedback/empty-state";
import { useToast } from "@/components/feedback/toast";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useSessionUser } from "@/features/authentication-account";
import { ApiError } from "@/lib/api/api-error";
import {
  usePublishedPoliciesForNewVersion,
  useUpdatePolicyVersion,
} from "../hooks/use-update-policy-version";
import {
  updatePolicyVersionFormSchema,
  updatePolicyVersionRequestSchema,
  type NewPolicyVersion,
  type PublishedPolicyForNewVersion,
  type UpdatePolicyVersionFormInput,
  type UpdatePolicyVersionFormValues,
} from "../schemas/update-policy-version-schema";

type UpdatePolicyVersionManagerProps = {
  onBack?: () => void;
  hideHeader?: boolean;
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
  hideHeader = false,
}: UpdatePolicyVersionManagerProps) {
  const session = useSessionUser();
  const mutation = useUpdatePolicyVersion();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const toast = useToast();
  const [submitError, setSubmitError] = useState<string>();
  const [created, setCreated] = useState<NewPolicyVersion>();
  const [selectedPolicy, setSelectedPolicy] =
    useState<PublishedPolicyForNewVersion>();
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
  const policies = usePublishedPoliciesForNewVersion(canUpdate);
  const eligiblePolicies = policies.data?.filter(
    (policy) => policy.eligibleForNewVersion !== false,
  );

  const closeDialog = (): void => {
    if (
      isDirty &&
      !mutation.isPending &&
      !window.confirm("Discard the new policy version details?")
    )
      return;
    dialogRef.current?.close();
    reset(defaultValues);
    setSubmitError(undefined);
    setSelectedPolicy(undefined);
  };

  const columns = useMemo<
    readonly DataTableColumn<PublishedPolicyForNewVersion>[]
  >(
    () => [
      {
        key: "policy",
        header: "Policy",
        cell: (policy) => (
          <div className="py-0.5">
            <strong className="text-foreground block font-medium">
              {policy.title}
            </strong>
            <span className="text-muted mt-0.5 text-xs font-mono">
              {policy.policyCode}
            </span>
          </div>
        ),
      },
      {
        key: "version",
        header: "Current version",
        cell: (policy) => (
          <span className="font-mono tabular-nums text-sm">
            v{policy.currentVersion ?? "—"}
          </span>
        ),
      },
      {
        key: "status",
        header: "Status",
        cell: () => <StatusBadge tone="success">Published</StatusBadge>,
      },
      {
        key: "action",
        header: "Action",
        cell: (policy) => (
          <Button
            className="min-h-8 gap-1.5 px-2.5 text-xs font-medium"
            onClick={() => {
              setSelectedPolicy(policy);
              setSubmitError(undefined);
              setCreated(undefined);
              reset({ ...defaultValues, policyId: policy.id });
              dialogRef.current?.showModal();
            }}
            variant="secondary"
          >
            <FilePenLine aria-hidden="true" className="size-3.5" strokeWidth={1.8} />
            Create new version
          </Button>
        ),
      },
    ],
    [reset],
  );

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
      dialogRef.current?.close();
      setSelectedPolicy(undefined);
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
      {!hideHeader && (
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
      )}

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
      ) : policies.isPending ? (
        <div
          aria-label="Loading published policies"
          className="bg-neutral-soft h-56 animate-pulse rounded-xl"
        />
      ) : policies.isError ? (
        <Alert>
          <strong className="block">Unable to load published policies</strong>
          <span>
            {policies.error instanceof Error
              ? policies.error.message
              : "Please try again."}
          </span>
        </Alert>
      ) : (
        <>
          <ProductPanel
            description="Choose a published policy that you own. Policies with an existing draft are excluded."
            title="Published policies"
          >
            <div className="p-5">
              {eligiblePolicies?.length === 0 ? (
                <EmptyState
                  description="Publish a policy first, or complete its existing draft before creating another version."
                  title="No policies available for a new version"
                />
              ) : (
                <DataTable
                  columns={columns}
                  rows={eligiblePolicies ?? []}
                  getRowKey={(policy) => policy.id}
                />
              )}
            </div>
          </ProductPanel>

          <Dialog
            className="max-h-[calc(100dvh-2rem)] w-[min(64rem,calc(100%-2rem))] overflow-y-auto"
            dialogRef={dialogRef}
            title={
              selectedPolicy
                ? `Create new version of ${selectedPolicy.policyCode}`
                : "Create new policy version"
            }
            onCancel={(event) => {
              event.preventDefault();
              closeDialog();
            }}
            onClose={() => setSelectedPolicy(undefined)}
          >
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
              {/* Main form */}
              <form
                className="space-y-5"
                noValidate
                onSubmit={(event) => void handleSubmit(submit)(event)}
              >
                <input type="hidden" {...register("policyId")} />

                {/* Context bar */}
                {selectedPolicy ? (
                  <div className="border-border bg-neutral-soft/30 flex flex-wrap items-center gap-3 rounded-lg border p-3.5 text-xs">
                    <FileText
                      className="size-3.5 shrink-0 text-brand"
                      strokeWidth={1.8}
                    />
                    <code className="font-mono font-semibold">
                      {selectedPolicy.policyCode}
                    </code>
                    <span className="text-muted">·</span>
                    <span className="text-muted truncate">
                      {selectedPolicy.title}
                    </span>
                    <span className="text-muted">·</span>
                    <span className="text-muted">
                      Current version:{" "}
                      <strong className="text-foreground font-mono">
                        v{selectedPolicy.currentVersion ?? "—"}
                      </strong>
                    </span>
                  </div>
                ) : null}

                {/* Info hint */}
                <div className="border-border bg-neutral-soft/30 flex gap-2.5 rounded-xl border p-3.5">
                  <Info
                    className="mt-0.5 size-4 shrink-0 text-brand"
                    strokeWidth={1.8}
                  />
                  <p className="text-muted text-xs leading-5">
                    The published version remains effective until an
                    administrator publishes this new draft. Title and description
                    are optional — leave blank to keep the current values.
                  </p>
                </div>

                {/* Error banner */}
                {submitError ? (
                  <div>
                    <div className="border-border bg-neutral-soft/30 flex gap-2.5 rounded-xl border p-3.5">
                      <AlertTriangle
                        className="mt-0.5 size-4 shrink-0 text-danger"
                        strokeWidth={1.8}
                      />
                      <div className="text-xs leading-5">
                        <strong className="text-danger block font-medium">
                          Unable to create version
                        </strong>
                        <span className="text-danger">{submitError}</span>
                      </div>
                    </div>
                  </div>
                ) : null}

                <fieldset disabled={mutation.isPending} className="space-y-5">

                  {/* Version identity */}
                  <div className="space-y-3">
                    <div className="flex items-start gap-2 border-b border-border pb-2">
                      <Hash
                        className="mt-0.5 size-4 shrink-0 text-brand"
                        strokeWidth={1.8}
                      />
                      <h3 className="text-sm font-semibold">Version identity</h3>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-1.5">
                        <label
                          htmlFor="version-number"
                          className="block text-sm font-medium"
                        >
                          New version number
                        </label>
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
                        {errors.versionNumber ? (
                          <p
                            id="version-number-error"
                            role="alert"
                            className="text-danger text-xs"
                          >
                            {errors.versionNumber.message}
                          </p>
                        ) : (
                          <p
                            id="version-number-help"
                            className="text-muted text-xs"
                          >
                            Use a version number that does not already exist for
                            this policy.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Content section */}
                  <div className="space-y-3">
                    <div className="flex items-start gap-2 border-b border-border pb-2">
                      <Tag
                        className="mt-0.5 size-4 shrink-0 text-brand"
                        strokeWidth={1.8}
                      />
                      <h3 className="text-sm font-semibold">Content</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label
                          htmlFor="policy-title"
                          className="block text-sm font-medium"
                        >
                          Updated title
                          <span className="text-muted ml-1 font-normal">
                            (optional)
                          </span>
                        </label>
                        <Input
                          id="policy-title"
                          maxLength={255}
                          aria-invalid={Boolean(errors.title)}
                          aria-describedby={
                            errors.title
                              ? "policy-title-error"
                              : "policy-title-help"
                          }
                          {...register("title")}
                        />
                        {errors.title ? (
                          <p
                            id="policy-title-error"
                            role="alert"
                            className="text-danger text-xs"
                          >
                            {errors.title.message}
                          </p>
                        ) : (
                          <p
                            id="policy-title-help"
                            className="text-muted text-xs"
                          >
                            Leave blank to keep the current policy title.
                          </p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <label
                          htmlFor="policy-description"
                          className="block text-sm font-medium"
                        >
                          Updated description
                          <span className="text-muted ml-1 font-normal">
                            (optional)
                          </span>
                        </label>
                        <Textarea
                          id="policy-description"
                          className="min-h-24"
                          maxLength={2000}
                          aria-invalid={Boolean(errors.description)}
                          aria-describedby={
                            errors.description
                              ? "policy-description-error"
                              : "policy-description-help"
                          }
                          {...register("description")}
                        />
                        {errors.description ? (
                          <p
                            id="policy-description-error"
                            role="alert"
                            className="text-danger text-xs"
                          >
                            {errors.description.message}
                          </p>
                        ) : (
                          <p
                            id="policy-description-help"
                            className="text-muted text-xs"
                          >
                            Leave blank to keep the current policy description.
                          </p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <label
                          htmlFor="policy-content"
                          className="block text-sm font-medium"
                        >
                          Policy content
                        </label>
                        <Textarea
                          id="policy-content"
                          className="min-h-64 font-mono leading-6"
                          maxLength={500000}
                          aria-invalid={Boolean(errors.content)}
                          aria-describedby={
                            errors.content ? "policy-content-error" : undefined
                          }
                          {...register("content")}
                        />
                        {errors.content ? (
                          <p
                            id="policy-content-error"
                            role="alert"
                            className="text-danger text-xs"
                          >
                            {errors.content.message}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {/* Audit trail section */}
                  <div className="space-y-3">
                    <div className="flex items-start gap-2 border-b border-border pb-2">
                      <History
                        className="mt-0.5 size-4 shrink-0 text-brand"
                        strokeWidth={1.8}
                      />
                      <h3 className="text-sm font-semibold">Audit trail</h3>
                    </div>
                    <div className="space-y-1.5">
                      <label
                        htmlFor="change-summary"
                        className="block text-sm font-medium"
                      >
                        Change summary
                      </label>
                      <Textarea
                        id="change-summary"
                        className="min-h-28"
                        maxLength={5000}
                        aria-invalid={Boolean(errors.changeSummary)}
                        aria-describedby={
                          errors.changeSummary
                            ? "change-summary-error"
                            : "change-summary-help"
                        }
                        {...register("changeSummary")}
                      />
                      {errors.changeSummary ? (
                        <p
                          id="change-summary-error"
                          role="alert"
                          className="text-danger text-xs"
                        >
                          {errors.changeSummary.message}
                        </p>
                      ) : (
                        <p
                          id="change-summary-help"
                          className="text-muted text-xs"
                        >
                          Recorded in the version audit trail. Maximum 5,000
                          characters.
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
                    onClick={closeDialog}
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
                        <Loader2
                          className="mr-1.5 size-3.5 animate-spin"
                          strokeWidth={2}
                        />
                        Creating…
                      </>
                    ) : (
                      <>
                        <FilePenLine
                          aria-hidden="true"
                          className="size-4"
                          strokeWidth={1.8}
                        />
                        Create draft version
                      </>
                    )}
                  </Button>
                </div>
              </form>

              {/* Sidebar */}
              <div className="space-y-5">
                {/* Workflow panel */}
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
                        The backend saves a new draft version and records the
                        change in the audit log.
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

                {/* Created result panel */}
                {created ? (
                  <ProductPanel title="Version created">
                    <dl
                      aria-live="polite"
                      className="border-border bg-neutral-soft/30 m-4 grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 rounded-xl border p-4 text-sm"
                    >
                      <dt className="text-muted text-xs font-medium uppercase tracking-wide">
                        Policy
                      </dt>
                      <dd className="min-w-0 font-semibold font-mono break-words">
                        {created.policyCode}
                      </dd>
                      <dt className="text-muted text-xs font-medium uppercase tracking-wide">
                        Version
                      </dt>
                      <dd className="font-semibold tabular-nums font-mono">
                        {created.version.versionNumber}
                      </dd>
                      <dt className="text-muted text-xs font-medium uppercase tracking-wide">
                        Status
                      </dt>
                      <dd>
                        <StatusBadge tone="info">Draft</StatusBadge>
                      </dd>
                    </dl>
                  </ProductPanel>
                ) : null}
              </div>
            </div>
          </Dialog>
        </>
      )}
    </>
  );
}
