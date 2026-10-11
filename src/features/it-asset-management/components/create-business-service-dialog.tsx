"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useForm } from "react-hook-form";
import { FormField } from "@/components/forms/form-field";
import { useToast } from "@/components/feedback/toast";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api/api-error";
import {
  useBusinessServiceOwners,
  useCreateBusinessService,
} from "../hooks/use-create-business-service";
import {
  createBusinessServiceSchema,
  type CreateBusinessServiceInput,
  type CreateBusinessServiceOutput,
} from "../schemas/create-business-service-schema";
import type { BusinessService } from "../schemas/business-service-schema";
import { useUpdateBusinessService } from "../hooks/use-update-business-service";

export function CreateBusinessServiceDialog({
  onCreated,
  editingService: suppliedService,
  onEditClose,
}: {
  onCreated: (service: BusinessService) => void;
  editingService?: BusinessService;
  onEditClose?: () => void;
}) {
  // Keep the version the user started editing. Background refetch must not
  // silently replace the optimistic-concurrency token while retaining draft.
  const [editingService] = useState(suppliedService);
  const [open, setOpen] = useState(!!editingService);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [owner, setOwner] = useState<{ id: string; fullName: string } | null>(
    editingService?.owner ?? null,
  );
  const [failure, setFailure] = useState<string | null>(null);
  const [discard, setDiscard] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const busy = useRef(false);
  const createMutation = useCreateBusinessService();
  const editMutation = useUpdateBusinessService(editingService?.id);
  const mutation = editingService ? editMutation : createMutation;
  const [blocked, setBlocked] = useState(false);
  const owners = useBusinessServiceOwners(query, open);
  const toast = useToast();
  const form = useForm<
    CreateBusinessServiceInput,
    unknown,
    CreateBusinessServiceOutput
  >({
    resolver: zodResolver(createBusinessServiceSchema),
    defaultValues: {
      name: editingService?.name ?? "",
      description: editingService?.description ?? "",
      ownerUserId: editingService?.owner?.id ?? null,
    },
  });
  const { errors, isDirty } = form.formState;
  useEffect(() => {
    if (open) dialog.current?.showModal();
  }, [open]);
  useEffect(() => {
    const timer = setTimeout(() => setQuery(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);
  const close = () => {
    setOpen(false);
    dialog.current?.close();
    form.reset();
    setOwner(null);
    setSearch("");
    setFailure(null);
    setDiscard(false);
    trigger.current?.focus();
    onEditClose?.();
  };
  const requestClose = () => {
    if (busy.current) return;
    if (isDirty) setDiscard(true);
    else close();
  };
  const submit = (event: FormEvent<HTMLFormElement>) => {
    void form.handleSubmit(async (values) => {
      if (busy.current) return;
      busy.current = true;
      setFailure(null);
      try {
        const service = editingService
          ? await editMutation.mutateAsync({
              ...values,
              expectedUpdatedAt: editingService.updatedAt,
            })
          : await createMutation.mutateAsync(values);
        close();
        toast.success(
          editingService
            ? "Business service updated"
            : "Business service created",
          editingService
            ? "Service details saved. Asset links and Risk scope remain unchanged."
            : "Active and ready to select in Link Asset Context. No assets were linked automatically.",
        );
        onCreated(service);
      } catch (error: unknown) {
        const conflictCode =
          error instanceof ApiError &&
          typeof error.details === "object" &&
          error.details !== null &&
          "error" in error.details &&
          typeof error.details.error === "object" &&
          error.details.error !== null &&
          "code" in error.details.error
            ? error.details.error.code
            : null;
        if (
          editingService &&
          ((error instanceof ApiError &&
            [401, 403, 404].includes(error.status)) ||
            conflictCode === "BUSINESS_SERVICE_STALE" ||
            conflictCode === "BUSINESS_SERVICE_INACTIVE")
        ) {
          setBlocked(true);
          setFailure(
            "This service or your access has changed. Close Edit and reopen to load the latest data. Your draft has not been saved.",
          );
          return;
        }
        if (error instanceof ApiError && error.status === 409)
          form.setError(
            "name",
            {
              message:
                "This service name already exists. Use a different name.",
            },
            { shouldFocus: true },
          );
        else if (error instanceof ApiError && error.status === 422)
          form.setError("ownerUserId", {
            message:
              "The owner may no longer be active. Select another owner or Unassigned.",
          });
        const message =
          error instanceof ApiError && [401, 403].includes(error.status)
            ? "Your access has changed. Sign in again or contact your administrator."
            : error instanceof ApiError && error.status === 409
              ? "A service with this name already exists, including inactive services."
              : error instanceof ApiError && error.status === 422
                ? "Check the selected owner and fields before trying again."
                : "The result could not be confirmed. Check the service list before retrying to avoid creating a duplicate.";
        setFailure(message);
        errorRef.current?.focus();
      } finally {
        busy.current = false;
      }
    })(event);
  };
  return (
    <>
      {!editingService ? (
        <Button
          onClick={(event) => {
            trigger.current = event.currentTarget;
            mutation.reset();
            setOpen(true);
          }}
        >
          <Plus aria-hidden="true" className="size-4" />
          Create business service
        </Button>
      ) : null}
      {open ? (
        <Dialog
          title={
            editingService ? "Edit Business Service" : "Create Business Service"
          }
          dialogRef={dialog}
          onCancel={(event) => {
            event.preventDefault();
            requestClose();
          }}
          className="max-h-[calc(100dvh-2rem)] w-[min(40rem,calc(100%-2rem))] overflow-y-auto"
        >
          <form noValidate onSubmit={submit} className="space-y-4">
            <p className="text-muted text-sm">
              {editingService
                ? "Edit name, description and responsible owner only. Status, identity, asset links and existing Risk scope are unchanged. Do not repurpose a service for a different business function; create a new service instead."
                : "Creates an Active service without asset links. Link assets separately through Link Asset Context; existing Risks are not changed."}
            </p>
            {failure ? (
              <div ref={errorRef} tabIndex={-1}>
                <Alert className="text-danger">{failure}</Alert>
              </div>
            ) : null}
            <fieldset
              disabled={mutation.isPending || blocked}
              className="space-y-4"
            >
              <FormField
                id="service-name"
                label="Service name (required)"
                error={errors.name?.message}
              >
                <Input
                  id="service-name"
                  maxLength={255}
                  autoComplete="off"
                  aria-invalid={!!errors.name}
                  aria-describedby={
                    errors.name ? "service-name-error" : undefined
                  }
                  {...form.register("name")}
                />
              </FormField>
              <FormField
                id="service-description"
                label="Description (optional)"
                error={errors.description?.message}
              >
                <Textarea
                  id="service-description"
                  rows={4}
                  maxLength={5000}
                  aria-invalid={!!errors.description}
                  aria-describedby={
                    errors.description
                      ? "service-description-error"
                      : "service-description-help"
                  }
                  {...form.register("description")}
                />
                <p id="service-description-help" className="text-muted text-xs">
                  Describe the business purpose and scope. Maximum 5000
                  characters.
                </p>
              </FormField>
              <FormField
                id="service-owner-search"
                label="Find responsible owner (optional)"
                error={errors.ownerUserId?.message}
              >
                <Input
                  id="service-owner-search"
                  maxLength={100}
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search active users by name"
                  aria-invalid={!!errors.ownerUserId}
                  aria-describedby={
                    errors.ownerUserId
                      ? "service-owner-search-error service-owner-help"
                      : "service-owner-help"
                  }
                />
                <p id="service-owner-help" className="text-muted text-xs">
                  Maximum 10 results. Ownership records responsibility; it does
                  not grant permissions.
                </p>
                <p className="text-sm">
                  Selected owner:{" "}
                  <strong>
                    {owner?.fullName ?? "Unassigned"}
                    {editingService?.owner?.inactive &&
                    owner?.id === editingService.owner.id
                      ? " (Inactive — retained)"
                      : ""}
                  </strong>
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setOwner(null);
                    form.setValue("ownerUserId", null, { shouldDirty: true });
                    form.clearErrors("ownerUserId");
                  }}
                >
                  Unassigned
                </Button>
                {owners.isPending ? (
                  <p role="status">Loading owners…</p>
                ) : owners.isError ? (
                  <Alert>
                    Unable to load owners. You can leave the service unassigned.
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => void owners.refetch()}
                    >
                      Retry owner search
                    </Button>
                  </Alert>
                ) : (
                  <div className="border-border max-h-44 overflow-y-auto rounded-lg border p-2">
                    {owners.data?.items.length ? (
                      owners.data.items.map((item) => (
                        <label
                          key={item.id}
                          className="flex min-h-11 cursor-pointer items-center gap-2 p-2 text-sm"
                        >
                          <input
                            type="radio"
                            name="service-owner"
                            checked={owner?.id === item.id}
                            onChange={() => {
                              setOwner(item);
                              form.setValue("ownerUserId", item.id, {
                                shouldDirty: true,
                              });
                              form.clearErrors("ownerUserId");
                            }}
                          />
                          {item.fullName}{" "}
                          <span className="text-muted text-xs">
                            {item.role.replaceAll("_", " ")}
                          </span>
                        </label>
                      ))
                    ) : (
                      <p className="text-muted p-2 text-sm">
                        No active owners found. Try another name or leave
                        Unassigned.
                      </p>
                    )}
                  </div>
                )}
              </FormField>
            </fieldset>
            {discard ? (
              <Alert>
                Discard your changes?
                <div className="mt-2 flex gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setDiscard(false)}
                  >
                    Keep editing
                  </Button>
                  <Button type="button" variant="secondary" onClick={close}>
                    Discard changes
                  </Button>
                </div>
              </Alert>
            ) : null}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                disabled={mutation.isPending}
                onClick={requestClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  mutation.isPending ||
                  blocked ||
                  (!!editingService && !isDirty)
                }
              >
                {mutation.isPending
                  ? "Saving…"
                  : editingService
                    ? "Save changes"
                    : "Create service"}
              </Button>
            </div>
          </form>
        </Dialog>
      ) : null}
    </>
  );
}
