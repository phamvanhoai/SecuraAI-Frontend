"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { FormField } from "@/components/forms/form-field";
import { useToast } from "@/components/feedback/toast";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCreateAsset } from "../hooks/use-create-asset";
import { useAssetCreateOptions } from "../hooks/use-asset-create-options";
import {
  createAssetSchema,
  type CreateAssetInput,
  type CreateAssetRequest,
} from "../schemas/create-asset-schema";

const defaults: CreateAssetInput = {
  assetCode: "",
  name: "",
  assetType: "",
  description: "",
  hostname: "",
  ipAddress: "",
  location: "",
  departmentId: "",
  ownerUserId: "",
};

export function CreateAssetDialog() {
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const [message, setMessage] = useState<string>();
  const mutation = useCreateAsset();
  const options = useAssetCreateOptions(open);
  const toast = useToast();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateAssetInput, unknown, CreateAssetRequest>({
    resolver: zodResolver(createAssetSchema),
    defaultValues: defaults,
  });

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) element.showModal();
    if (!open && element.open) element.close();
  }, [open]);

  const close = (): void => {
    setOpen(false);
    setMessage(undefined);
  };
  const submit = async (values: CreateAssetRequest): Promise<void> => {
    setMessage(undefined);
    try {
      const asset = await mutation.mutateAsync(values);
      reset(defaults);
      close();
      toast.success("Asset created", `${asset.assetCode} – ${asset.name}`);
    } catch (error: unknown) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to create asset. Please try again.",
      );
    }
  };

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        <Plus className="size-4" aria-hidden="true" />
        Add asset
      </Button>
      <Dialog dialogRef={dialog} title="Create IT Asset" onClose={close}>
        <form className="space-y-4" noValidate onSubmit={handleSubmit(submit)}>
          {message ? (
            <Alert className="border-danger/25 bg-danger-soft text-danger">
              {message}
            </Alert>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              id="assetCode"
              label="Asset code"
              error={errors.assetCode?.message}
            >
              <Input
                id="assetCode"
                maxLength={50}
                aria-invalid={Boolean(errors.assetCode)}
                aria-describedby={
                  errors.assetCode ? "assetCode-error" : undefined
                }
                {...register("assetCode")}
              />
            </FormField>
            <FormField
              id="name"
              label="Asset name"
              error={errors.name?.message}
            >
              <Input
                id="name"
                maxLength={150}
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? "name-error" : undefined}
                {...register("name")}
              />
            </FormField>
            <FormField
              id="assetType"
              label="Asset type"
              error={errors.assetType?.message}
            >
              <Input
                id="assetType"
                maxLength={50}
                placeholder="server, laptop..."
                aria-invalid={Boolean(errors.assetType)}
                aria-describedby={
                  errors.assetType ? "assetType-error" : undefined
                }
                {...register("assetType")}
              />
            </FormField>
            <FormField
              id="departmentId"
              label="Department"
              error={errors.departmentId?.message}
            >
              <Select
                id="departmentId"
                disabled={options.isPending}
                {...register("departmentId")}
              >
                <option value="">
                  {options.isPending
                    ? "Loading departments…"
                    : "No department assigned"}
                </option>
                {(options.data?.departments ?? []).map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.code} – {department.name}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField
              id="ownerUserId"
              label="Owner"
              error={errors.ownerUserId?.message}
            >
              <Select
                id="ownerUserId"
                disabled={options.isPending}
                {...register("ownerUserId")}
              >
                <option value="">
                  {options.isPending ? "Loading users…" : "No owner assigned"}
                </option>
                {(options.data?.owners ?? []).map((owner) => (
                  <option key={owner.id} value={owner.id}>
                    {owner.fullName}
                    {owner.employeeCode ? ` – ${owner.employeeCode}` : ""}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField
              id="hostname"
              label="Hostname"
              error={errors.hostname?.message}
            >
              <Input id="hostname" maxLength={255} {...register("hostname")} />
            </FormField>
            <FormField
              id="ipAddress"
              label="IP address"
              error={errors.ipAddress?.message}
            >
              <Input
                id="ipAddress"
                placeholder="192.168.1.10"
                aria-invalid={Boolean(errors.ipAddress)}
                aria-describedby={
                  errors.ipAddress ? "ipAddress-error" : undefined
                }
                {...register("ipAddress")}
              />
            </FormField>
            <FormField
              id="location"
              label="Location"
              error={errors.location?.message}
            >
              <Input id="location" maxLength={255} {...register("location")} />
            </FormField>
          </div>
          <FormField
            id="description"
            label="Description"
            error={errors.description?.message}
          >
            <Textarea
              id="description"
              maxLength={10_000}
              {...register("description")}
            />
          </FormField>
          {options.isError ? (
            <Alert className="border-warning/25 bg-warning/10">
              Unable to load departments and owners. You can still create an
              unassigned asset.
            </Alert>
          ) : null}
          {options.data?.truncated.departments ||
          options.data?.truncated.owners ? (
            <p className="text-muted text-xs">
              The list shows up to 200 active options.
            </p>
          ) : null}
          <p className="text-muted text-xs">
            New assets default to Medium criticality. Use Classify Criticality
            after creation to assess four impact criteria.
          </p>
          <div className="flex justify-end gap-2">
            <Button type="button" onClick={close} variant="secondary">
              Cancel
            </Button>
            <Button disabled={mutation.isPending} type="submit">
              {mutation.isPending ? "Creating…" : "Create asset"}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
