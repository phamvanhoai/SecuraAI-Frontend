"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertTriangle,
  Building2,
  FileText,
  Info,
  Loader2,
  Plus,
  Search,
  User,
} from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useForm } from "react-hook-form";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/feedback/toast";
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
  const [editingService] = useState(suppliedService);
  const [open, setOpen] = useState(!!editingService);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [owner, setOwner] = useState<{
    id: string;
    fullName: string;
    email: string;
  } | null>(editingService?.owner ?? null);
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

  const form = useForm<CreateBusinessServiceInput, unknown, CreateBusinessServiceOutput>({
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
          editingService ? "Business service updated" : "Business service created",
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
          ((error instanceof ApiError && [401, 403, 404].includes(error.status)) ||
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
          form.setError("name", { message: "This service name already exists. Use a different name." }, { shouldFocus: true });
        else if (error instanceof ApiError && error.status === 422)
          form.setError("ownerUserId", { message: "The owner may no longer be active. Select another owner or Unassigned." });
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
          title={editingService ? "Edit Business Service" : "Create Business Service"}
          dialogRef={dialog}
          onCancel={(event) => {
            event.preventDefault();
            requestClose();
          }}
          className="max-h-[calc(100dvh-2rem)] w-[min(40rem,calc(100%-2rem))] overflow-y-auto"
        >
          <form noValidate onSubmit={submit} className="space-y-5">

            {/* Context bar — edit mode only */}
            {editingService ? (
              <div className="border-border bg-neutral-soft/30 flex flex-wrap items-center gap-3 rounded-lg border p-3.5 text-xs">
                <Building2 className="size-3.5 shrink-0 text-brand" strokeWidth={1.8} />
                <span className="font-semibold">{editingService.name}</span>
                <span className="text-muted">·</span>
                <span className="text-muted">
                  Status:{" "}
                  <strong className="text-foreground capitalize">
                    {editingService.status}
                  </strong>
                </span>
              </div>
            ) : null}

            {/* Info hint */}
            <div className="border-border bg-neutral-soft/30 flex gap-2.5 rounded-xl border p-3.5">
              <Info className="mt-0.5 size-4 shrink-0 text-brand" strokeWidth={1.8} />
              <p className="text-muted text-xs leading-5">
                {editingService
                  ? "Edit name, description and responsible owner only. Status, identity, asset links and existing Risk scope are unchanged. Do not repurpose a service for a different business function; create a new service instead."
                  : "Creates an Active service without asset links. Link assets separately through Link Asset Context; existing Risks are not changed."}
              </p>
            </div>

            {/* Error banner */}
            {failure ? (
              <div ref={errorRef} tabIndex={-1}>
                <div className="border-border bg-neutral-soft/30 flex gap-2.5 rounded-xl border p-3.5">
                  <AlertTriangle
                    className="mt-0.5 size-4 shrink-0 text-danger"
                    strokeWidth={1.8}
                  />
                  <p className="text-danger text-xs leading-5">{failure}</p>
                </div>
              </div>
            ) : null}

            <fieldset disabled={mutation.isPending || blocked} className="space-y-5">

              {/* Service name */}
              <div className="space-y-3">
                <div className="flex items-start gap-2 border-b border-border pb-2">
                  <Building2
                    className="mt-0.5 size-4 shrink-0 text-brand"
                    strokeWidth={1.8}
                  />
                  <h3 className="text-sm font-semibold">Service identity</h3>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="service-name" className="block text-sm font-medium">
                    Service name (required)
                  </label>
                  <Input
                    id="service-name"
                    maxLength={255}
                    autoComplete="off"
                    aria-invalid={!!errors.name}
                    aria-describedby={errors.name ? "service-name-error" : undefined}
                    {...form.register("name")}
                  />
                  {errors.name && (
                    <p id="service-name-error" role="alert" className="text-danger text-xs">
                      {errors.name.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-3">
                <div className="flex items-start gap-2 border-b border-border pb-2">
                  <FileText
                    className="mt-0.5 size-4 shrink-0 text-brand"
                    strokeWidth={1.8}
                  />
                  <h3 className="text-sm font-semibold">Description</h3>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="service-description" className="block text-sm font-medium">
                    Description
                    <span className="text-muted ml-1 font-normal">(optional)</span>
                  </label>
                  <Textarea
                    id="service-description"
                    aria-label="Description (optional)"
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
                  {errors.description ? (
                    <p id="service-description-error" role="alert" className="text-danger text-xs">
                      {errors.description.message}
                    </p>
                  ) : (
                    <p id="service-description-help" className="text-muted text-xs">
                      Describe the business purpose and scope. Maximum 5,000 characters.
                    </p>
                  )}
                </div>
              </div>

              {/* Owner search */}
              <div className="space-y-3">
                <div className="flex items-start gap-2 border-b border-border pb-2">
                  <User className="mt-0.5 size-4 shrink-0 text-brand" strokeWidth={1.8} />
                  <h3 className="text-sm font-semibold">Responsible owner</h3>
                </div>

                {/* Selected owner display */}
                <div className="border-border bg-neutral-soft/30 flex items-start gap-2.5 rounded-lg border p-3.5 text-xs">
                  <User className="mt-0.5 size-3.5 shrink-0 text-brand" strokeWidth={1.8} />
                  <div className="min-w-0 flex-1">
                    <span className="text-muted block">Selected owner</span>
                    <strong className="block mt-0.5">
                      {owner?.fullName ?? "Unassigned"}
                      {editingService?.owner?.inactive && owner?.id === editingService.owner.id
                        ? " (Inactive — retained)"
                        : ""}
                    </strong>
                    {owner ? (
                      <span className="text-muted block break-words">{owner.email}</span>
                    ) : null}
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    className="h-7 min-h-7 px-2.5 text-xs shrink-0"
                    onClick={() => {
                      setOwner(null);
                      form.setValue("ownerUserId", null, { shouldDirty: true });
                      form.clearErrors("ownerUserId");
                    }}
                  >
                    Unassigned
                  </Button>
                </div>

                {/* Search input */}
                <div className="space-y-1.5">
                  <label htmlFor="service-owner-search" className="block text-sm font-medium">
                    Find responsible owner
                    <span className="text-muted ml-1 font-normal">(optional)</span>
                  </label>
                  <div className="relative">
                    <Search
                      className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted pointer-events-none"
                      strokeWidth={1.8}
                    />
                    <Input
                      id="service-owner-search"
                      aria-label="Find responsible owner (optional)"
                      maxLength={100}
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search active users by name or email"
                      aria-invalid={!!errors.ownerUserId}
                      aria-describedby={
                        errors.ownerUserId
                          ? "service-owner-search-error service-owner-help"
                          : "service-owner-help"
                      }
                      className="pl-8"
                    />
                  </div>
                  <p id="service-owner-help" className="text-muted text-xs">
                    Maximum 10 results. Ownership records responsibility; it does not grant
                    permissions.
                  </p>
                  {errors.ownerUserId && (
                    <p id="service-owner-search-error" role="alert" className="text-danger text-xs">
                      {errors.ownerUserId.message}
                    </p>
                  )}
                </div>

                {/* Owner results list */}
                {owners.isPending ? (
                  <p role="status" className="text-muted text-xs py-2">
                    Loading owners…
                  </p>
                ) : owners.isError ? (
                  <div className="border-border bg-neutral-soft/30 flex gap-2.5 rounded-xl border p-3.5">
                    <AlertTriangle
                      className="mt-0.5 size-4 shrink-0 text-warning"
                      strokeWidth={1.8}
                    />
                    <div className="text-xs leading-5">
                      <span className="text-muted block">
                        Unable to load owners. You can leave the service unassigned.
                      </span>
                      <Button
                        type="button"
                        variant="secondary"
                        className="mt-2 h-7 min-h-7 px-2.5 text-xs"
                        onClick={() => void owners.refetch()}
                      >
                        Retry owner search
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="border-border rounded-xl border overflow-hidden">
                    {owners.data?.items.length ? (
                      <ul className="divide-y divide-border max-h-44 overflow-y-auto">
                        {owners.data.items.map((item) => (
                          <li key={item.id}>
                            <label
                              className={cn(
                                "flex cursor-pointer items-center gap-2.5 px-3 py-2.5 text-xs transition-colors hover:bg-neutral-soft/60",
                                owner?.id === item.id && "bg-neutral-soft/40",
                              )}
                            >
                              <input
                                type="radio"
                                name="service-owner"
                                checked={owner?.id === item.id}
                                className="size-3.5 shrink-0"
                                onChange={() => {
                                  setOwner(item);
                                  form.setValue("ownerUserId", item.id, { shouldDirty: true });
                                  form.clearErrors("ownerUserId");
                                }}
                              />
                              <span className="min-w-0">
                                <span className="block font-medium">{item.fullName}</span>
                                <span className="text-muted block break-words">
                                  {item.email} · {item.role.replaceAll("_", " ")}
                                </span>
                              </span>
                            </label>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="p-5 text-center">
                        <User
                          className="text-muted mx-auto mb-2 size-6"
                          strokeWidth={1.5}
                        />
                        <p className="text-xs font-medium">No users found</p>
                        <p className="text-muted mt-0.5 text-xs">
                          Try another name or email, or leave Unassigned.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </fieldset>

            {/* Discard confirmation */}
            {discard ? (
              <div className="border-border bg-neutral-soft/30 flex gap-2.5 rounded-xl border p-3.5">
                <AlertTriangle
                  className="mt-0.5 size-4 shrink-0 text-warning"
                  strokeWidth={1.8}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium">Discard your changes?</p>
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
                      onClick={close}
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
                onClick={requestClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={mutation.isPending || blocked || (!!editingService && !isDirty)}
                className={cn(mutation.isPending && "opacity-80")}
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className="mr-1.5 size-3.5 animate-spin" strokeWidth={2} />
                    Saving…
                  </>
                ) : editingService ? (
                  "Save changes"
                ) : (
                  "Create service"
                )}
              </Button>
            </div>
          </form>
        </Dialog>
      ) : null}
    </>
  );
}
