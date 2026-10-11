"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { useToast } from "@/components/feedback/toast";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TableSkeleton } from "@/components/ui/skeleton";
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
      className="max-h-[calc(100dvh-2rem)] overflow-y-auto"
    >
      {check.isError ? (
        <BusinessServiceError
          error={check.error}
          onRetry={() => void check.refetch()}
        />
      ) : (
        <TableSkeleton rows={3} columns={2} />
      )}
      <div className="mt-5 flex justify-end">
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
  // Do not silently replace the version or identity being confirmed on refetch.
  const [check] = useState(initialCheck);
  const { service } = check;
  const ref = useRef<HTMLDialogElement>(null);
  const inFlight = useRef(false);
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
  const confirmation = useWatch({
    control: form.control,
    name: "confirmationName",
  })
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
    if (inFlight.current || blocked || !check.canDeactivate || !confirmed)
      return;
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
      <form onSubmit={onSubmit} className="space-y-4">
        <p className="break-words">
          You are deactivating <strong>{service.name}</strong>.
        </p>
        <Alert className="border-warning/25 bg-warning/10 text-warning">
          This stops new selection in Link Asset Context and Create Risk. It
          does not delete the service, change Risk scope, or remove historical
          links. Reactivation is not included in this action.
        </Alert>
        {error ? (
          <Alert className="border-danger/25 bg-danger/10 text-danger">
            {error}
          </Alert>
        ) : null}
        <dl className="border-border grid grid-cols-2 gap-3 rounded-lg border p-3 text-sm">
          <div>
            <dt className="text-muted">Active assets</dt>
            <dd className="mt-1 font-semibold tabular-nums">
              {check.activeAssetsCount}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Unresolved service-scoped risks</dt>
            <dd className="mt-1 font-semibold tabular-nums">
              {check.unresolvedRisksCount}
            </dd>
          </div>
        </dl>
        {!check.canDeactivate ? (
          <Alert className="border-warning/25 bg-warning/10 text-warning">
            {service.status !== "active"
              ? "This service is already inactive and read-only."
              : "Reassign or unlink active assets using Manage links; resolve directly scoped risks through the Risk workflow first. Open, Under treatment and Accepted risks block deactivation. Archived assets and Closed/Archived risks do not block it."}
          </Alert>
        ) : (
          <>
            <div className="text-sm">
              <label
                htmlFor="service-deactivate-reason"
                className="block font-medium"
              >
                Reason for deactivation (required)
              </label>
              <Textarea
                id="service-deactivate-reason"
                {...form.register("reason")}
                className="mt-1 min-h-28"
                maxLength={2000}
                disabled={mutation.isPending || blocked}
                aria-invalid={Boolean(form.formState.errors.reason)}
                aria-describedby="service-deactivate-reason-help service-deactivate-reason-error"
              />
              <span
                id="service-deactivate-reason-help"
                className="text-muted mt-1 block text-xs"
              >
                Explain why the service is no longer used. The reason and acting
                user are recorded in audit logs.
              </span>
              <span
                id="service-deactivate-reason-error"
                className="text-danger mt-1 block text-xs"
              >
                {form.formState.errors.reason?.message}
              </span>
            </div>
            <div className="text-sm">
              <label
                htmlFor="service-deactivate-name"
                className="block font-medium"
              >
                Enter service name to confirm
              </label>
              <Input
                id="service-deactivate-name"
                {...form.register("confirmationName")}
                className="mt-1"
                maxLength={255}
                disabled={mutation.isPending || blocked}
                aria-describedby="service-deactivate-name-help"
              />
              <span
                id="service-deactivate-name-help"
                className="text-muted mt-1 block text-xs break-words"
              >
                Enter: {service.name}
              </span>
            </div>
          </>
        )}
        {discard ? (
          <div className="border-border space-y-3 rounded-lg border p-3">
            <p>Discard the entered deactivation reason?</p>
            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="secondary" onClick={() => setDiscard(false)}>
                Keep editing
              </Button>
              <Button variant="danger" onClick={onClose}>
                Discard changes
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              variant="secondary"
              disabled={mutation.isPending}
              onClick={close}
            >
              {check.canDeactivate ? "Cancel" : "Close"}
            </Button>
            {check.canDeactivate ? (
              <Button
                type="submit"
                variant="danger"
                disabled={
                  !confirmed || !reason.trim() || mutation.isPending || blocked
                }
              >
                {mutation.isPending ? "Deactivating…" : "Deactivate service"}
              </Button>
            ) : null}
          </div>
        )}
      </form>
    </Dialog>
  );
}
