"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertTriangle,
  Building2,
  FileText,
  Loader2,
  PowerOff,
} from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/feedback/toast";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api/api-error";
import {
  useBusinessServiceDeactivationCheck,
  useDeactivateBusinessService,
} from "../hooks/use-deactivate-business-service";
import {
  deactivateBusinessServiceSchema,
  type BusinessServiceDeactivationCheck,
  type DeactivateBusinessServiceInput,
} from "../schemas/deactivate-business-service-schema";
import { BusinessServiceError } from "./business-service-feedback";

export function DeactivateBusinessServiceDialog({
  serviceId,
  onClose,
}: {
  serviceId: string;
  onClose: () => void;
}) {
  const check = useBusinessServiceDeactivationCheck(serviceId);
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (!check.isFetchedAfterMount || check.isError || !check.data)
      ref.current?.showModal();
  }, [check.isFetchedAfterMount, check.isError, check.data]);

  if (check.isFetchedAfterMount && check.data && !check.isError)
    return <DeactivationForm initialCheck={check.data} onClose={onClose} />;

  return (
    <Dialog
      title="Deactivate Business Service"
      dialogRef={ref}
      onClose={onClose}
      className="max-h-[calc(100dvh-2rem)] w-[min(38rem,calc(100%-2rem))] overflow-y-auto"
    >
      {check.isError ? (
        <BusinessServiceError
          error={check.error}
          onRetry={() => void check.refetch()}
        />
      ) : (
        /* Loading skeleton */
        <div
          role="status"
          aria-busy="true"
          aria-label="Loading service details"
          className="space-y-5"
        >
          <span className="sr-only">Loading service details…</span>
          {/* Context bar skeleton */}
          <Skeleton className="h-11 w-full rounded-lg" />
          {/* Warning banner skeleton */}
          <Skeleton className="h-16 w-full rounded-xl" />
          {/* Impact grid skeleton */}
          <Skeleton className="h-20 w-full rounded-xl" />
          {/* Section heading + field skeletons */}
          <Skeleton className="h-5 w-40 rounded" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-5 w-40 rounded" />
          <Skeleton className="h-10 w-full" />
        </div>
      )}

      <div className="mt-5 flex items-center justify-end border-t border-border pt-4">
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      </div>
    </Dialog>
  );
}

function DeactivationForm({
  initialCheck,
  onClose,
}: {
  initialCheck: BusinessServiceDeactivationCheck;
  onClose: () => void;
}) {
  // Keep the version and identity being confirmed. Background refetch must not
  // silently replace the optimistic-concurrency token while the user types.
  const [check] = useState(initialCheck);
  const { service } = check;
  const ref = useRef<HTMLDialogElement>(null);
  const inFlight = useRef(false);
  const errorRef = useRef<HTMLDivElement>(null);
  const [discard, setDiscard] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blocked, setBlocked] = useState(false);
  const mutation = useDeactivateBusinessService(service.id);
  const toast = useToast();

  const form = useForm<DeactivateBusinessServiceInput>({
    resolver: zodResolver(deactivateBusinessServiceSchema),
    defaultValues: {
      reason: "",
      confirmationName: "",
      expectedUpdatedAt: service.updatedAt,
    },
  });

  const confirmation = useWatch({ control: form.control, name: "confirmationName" })
    .trim()
    .replace(/\s+/g, " ");
  const reason = useWatch({ control: form.control, name: "reason" });
  const dirty = form.formState.isDirty;
  const confirmed = confirmation === service.name.trim().replace(/\s+/g, " ");

  useEffect(() => {
    ref.current?.showModal();
  }, []);

  const close = () => {
    if (inFlight.current) return;
    if (dirty) setDiscard(true);
    else onClose();
  };

  const submit = async (input: DeactivateBusinessServiceInput) => {
    if (inFlight.current || blocked || !check.canDeactivate || !confirmed) return;
    inFlight.current = true;
    setError(null);
    try {
      await mutation.mutateAsync(input);
      toast.success(
        "Business service deactivated",
        "Historical records and links are preserved.",
      );
      onClose();
    } catch (caught: unknown) {
      const code =
        caught instanceof ApiError &&
        typeof caught.details === "object" &&
        caught.details !== null &&
        "error" in caught.details &&
        typeof caught.details.error === "object" &&
        caught.details.error !== null &&
        "code" in caught.details.error
          ? caught.details.error.code
          : undefined;
      setBlocked(true);
      setError(
        code === "BUSINESS_SERVICE_IN_USE"
          ? "This service is now in use. Reassign or unlink active assets and resolve directly scoped risks first. Close and reopen Deactivate to review current usage."
          : code === "BUSINESS_SERVICE_STALE"
            ? "The service or its usage changed. Nothing was deactivated by this request. Close and reopen Deactivate to review the latest data."
            : code === "BUSINESS_SERVICE_INACTIVE"
              ? "This service is already inactive. Close and refresh the list."
              : caught instanceof ApiError && [401, 403].includes(caught.status)
                ? "Your access changed. Close and sign in again or refresh your permissions."
                : "Unable to confirm deactivation. Close and check the latest list before retrying; the request may have succeeded.",
      );
      errorRef.current?.focus();
    } finally {
      inFlight.current = false;
    }
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    void form.handleSubmit(submit)(event);
  };

  return (
    <Dialog
      title="Deactivate Business Service"
      dialogRef={ref}
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onClose={onClose}
      className="max-h-[calc(100dvh-2rem)] w-[min(38rem,calc(100%-2rem))] overflow-y-auto"
    >
      <form onSubmit={onSubmit} className="space-y-5">

        {/* Context bar */}
        <div className="border-border bg-neutral-soft/30 flex flex-wrap items-center gap-3 rounded-lg border p-3.5 text-xs">
          <Building2 className="size-3.5 shrink-0 text-brand" strokeWidth={1.8} />
          <span className="font-semibold break-all">{service.name}</span>
          <span className="text-muted">·</span>
          <span className="text-muted">
            Status:{" "}
            <strong className="text-foreground capitalize">{service.status}</strong>
          </span>
        </div>

        {/* What deactivating does */}
        <div className="border-border bg-neutral-soft/30 flex gap-2.5 rounded-xl border p-3.5">
          <AlertTriangle
            className="mt-0.5 size-4 shrink-0 text-warning"
            strokeWidth={1.8}
          />
          <p className="text-xs leading-5">
            <strong className="text-foreground block mb-1">What deactivating does</strong>
            <span className="text-muted">
              Stops new selection in Link Asset Context and Create Risk. Does not
              delete the service, change Risk scope, or remove historical links.
              Reactivation is not included in this action.
            </span>
          </p>
        </div>

        {/* Impact grid */}
        <dl className="border-border bg-neutral-soft/30 grid grid-cols-2 gap-x-6 gap-y-4 rounded-xl border p-4">
          <div>
            <dt className="text-muted text-xs font-medium uppercase tracking-wide">
              Active assets
            </dt>
            <dd className="mt-1 text-sm font-semibold tabular-nums">
              {check.activeAssetsCount}
            </dd>
          </div>
          <div>
            <dt className="text-muted text-xs font-medium uppercase tracking-wide">
              Unresolved risks
            </dt>
            <dd className="mt-1 text-sm font-semibold tabular-nums">
              {check.unresolvedRisksCount}
            </dd>
          </div>
        </dl>

        {/* Cannot-deactivate blocker */}
        {!check.canDeactivate ? (
          <div className="border-border bg-neutral-soft/30 flex gap-2.5 rounded-xl border p-3.5">
            <AlertTriangle
              className="mt-0.5 size-4 shrink-0 text-warning"
              strokeWidth={1.8}
            />
            <p className="text-xs leading-5">
              {service.status !== "active" ? (
                <span className="text-muted">
                  This service is already inactive and read-only.
                </span>
              ) : (
                <span className="text-muted">
                  Reassign or unlink active assets using Manage links; resolve
                  directly scoped risks through the Risk workflow first. Open,
                  Under treatment and Accepted risks block deactivation.
                  Archived assets and Closed/Archived risks do not block it.
                </span>
              )}
            </p>
          </div>
        ) : null}

        {/* Error banner */}
        {error ? (
          <div ref={errorRef} tabIndex={-1}>
            <div className="border-border bg-neutral-soft/30 flex gap-2.5 rounded-xl border p-3.5">
              <AlertTriangle
                className="mt-0.5 size-4 shrink-0 text-danger"
                strokeWidth={1.8}
              />
              <p className="text-danger text-xs leading-5">{error}</p>
            </div>
          </div>
        ) : null}

        {check.canDeactivate ? (
          <fieldset disabled={mutation.isPending || blocked} className="space-y-5">

            {/* Reason */}
            <div className="space-y-3">
              <div className="flex items-start gap-2 border-b border-border pb-2">
                <FileText
                  className="mt-0.5 size-4 shrink-0 text-brand"
                  strokeWidth={1.8}
                />
                <h3 className="text-sm font-semibold">Reason for deactivation</h3>
              </div>
              <div className="space-y-1.5">
                <label
                  htmlFor="service-deactivate-reason"
                  className="block text-sm font-medium"
                >
                  Reason for deactivation
                  <span className="text-muted ml-1 font-normal">(required)</span>
                </label>
                <Textarea
                  id="service-deactivate-reason"
                  aria-label="Reason for deactivation (required)"
                  {...form.register("reason")}
                  rows={4}
                  maxLength={2000}
                  aria-invalid={Boolean(form.formState.errors.reason)}
                  aria-describedby={
                    form.formState.errors.reason
                      ? "service-deactivate-reason-error service-deactivate-reason-help"
                      : "service-deactivate-reason-help"
                  }
                />
                {form.formState.errors.reason ? (
                  <p
                    id="service-deactivate-reason-error"
                    role="alert"
                    className="text-danger text-xs"
                  >
                    {form.formState.errors.reason.message}
                  </p>
                ) : (
                  <p id="service-deactivate-reason-help" className="text-muted text-xs">
                    Explain why the service is no longer used. The reason and acting
                    user are recorded in audit logs. Maximum 2,000 characters.
                  </p>
                )}
              </div>
            </div>

            {/* Confirmation name */}
            <div className="space-y-3">
              <div className="flex items-start gap-2 border-b border-border pb-2">
                <PowerOff
                  className="mt-0.5 size-4 shrink-0 text-brand"
                  strokeWidth={1.8}
                />
                <h3 className="text-sm font-semibold">Confirm deactivation</h3>
              </div>
              <div className="space-y-1.5">
                <label
                  htmlFor="service-deactivate-name"
                  className="block text-sm font-medium"
                >
                  Enter service name to confirm
                </label>
                <Input
                  id="service-deactivate-name"
                  {...form.register("confirmationName")}
                  maxLength={255}
                  autoComplete="off"
                  aria-invalid={
                    form.getValues("confirmationName").trim().length > 0 && !confirmed
                  }
                  aria-describedby="service-deactivate-name-help"
                />
                <p
                  id="service-deactivate-name-help"
                  className="text-muted text-xs break-words"
                >
                  Enter exactly:{" "}
                  <strong className="text-foreground">{service.name}</strong>
                </p>
                {form.getValues("confirmationName").trim().length > 0 && !confirmed ? (
                  <p role="alert" className="text-danger text-xs">
                    Name does not match.
                  </p>
                ) : null}
              </div>
            </div>
          </fieldset>
        ) : null}

        {/* Discard confirmation */}
        {discard ? (
          <div className="border-border bg-neutral-soft/30 flex gap-2.5 rounded-xl border p-3.5">
            <AlertTriangle
              className="mt-0.5 size-4 shrink-0 text-warning"
              strokeWidth={1.8}
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium">Discard the entered deactivation reason?</p>
              <div className="mt-2.5 flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="h-7 min-h-7 px-2.5 text-xs"
                  onClick={() => setDiscard(false)}
                >
                  Keep editing
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="h-7 min-h-7 px-2.5 text-xs"
                  onClick={onClose}
                >
                  Discard changes
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
          <Button
            type="button"
            variant="secondary"
            disabled={mutation.isPending}
            onClick={close}
          >
            {check.canDeactivate ? "Cancel" : "Close"}
          </Button>
          {check.canDeactivate ? (
            <Button
              type="submit"
              disabled={!confirmed || !reason.trim() || mutation.isPending || blocked}
              className={cn(
                "bg-danger text-white hover:opacity-90",
                mutation.isPending && "opacity-80",
              )}
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="mr-1.5 size-3.5 animate-spin" strokeWidth={2} />
                  Deactivating…
                </>
              ) : (
                "Deactivate service"
              )}
            </Button>
          ) : null}
        </div>
      </form>
    </Dialog>
  );
}
