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
  type CreateAssetOutput,
} from "../schemas/create-asset-schema";

const defaults: CreateAssetInput = {
  assetCode: "",
  name: "",
  assetType: "",
  businessServiceId: "",
  ownerUserId: "",
  criticality: "medium",
  dataClassification: "internal",
  description: "",
  dependencyIds: [],
  eventSourceIds: [],
};

export function CreateAssetDialog() {
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const mutation = useCreateAsset();
  const options = useAssetCreateOptions(open);
  const toast = useToast();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateAssetInput, unknown, CreateAssetOutput>({
    resolver: zodResolver(createAssetSchema),
    defaultValues: defaults,
  });

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) element.showModal();
    if (!open && element.open) element.close();
  }, [open]);
  const close = () => setOpen(false);
  const submit = handleSubmit(async (values) => {
    try {
      const { dependencyIds, ...assetFields } = values;
      const asset = await mutation.mutateAsync({
        ...assetFields,
        dependencies: dependencyIds.map((assetId) => ({ assetId })),
      });
      reset(defaults);
      close();
      toast.success("Asset created", `${asset.assetCode} – ${asset.name}`);
    } catch (error: unknown) {
      toast.error(
        "Unable to create asset",
        error instanceof Error ? error.message : "Please try again.",
      );
    }
  });

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        <Plus className="size-4" aria-hidden="true" />
        Add asset
      </Button>
      <Dialog
        dialogRef={dialog}
        title="Create IT Asset"
        onClose={close}
        className="max-h-[90dvh] w-[min(42rem,calc(100%-2rem))] overflow-y-auto"
      >
        <form className="space-y-5" noValidate onSubmit={submit}>
          {options.isError ? (
            <Alert className="border-danger/25 bg-danger-soft text-danger">
              Unable to load reference data. Close the form and try again.
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
                maxLength={100}
                {...register("assetCode")}
              />
            </FormField>
            <FormField
              id="name"
              label="Asset name"
              error={errors.name?.message}
            >
              <Input id="name" maxLength={255} {...register("name")} />
            </FormField>
            <FormField
              id="assetType"
              label="Asset type"
              error={errors.assetType?.message}
            >
              <Input
                id="assetType"
                maxLength={100}
                placeholder="Server, endpoint, application…"
                {...register("assetType")}
              />
            </FormField>
            <FormField
              id="ownerUserId"
              label="Asset owner"
              error={errors.ownerUserId?.message}
            >
              <Select
                id="ownerUserId"
                disabled={options.isPending || options.isError}
                {...register("ownerUserId")}
              >
                <option value="">Unassigned</option>
                {options.data?.owners.map((owner) => (
                  <option key={owner.id} value={owner.id}>
                    {owner.fullName} · {owner.role}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField
              id="businessServiceId"
              label="Business service"
              error={errors.businessServiceId?.message}
            >
              <Select
                id="businessServiceId"
                disabled={options.isPending || options.isError}
                {...register("businessServiceId")}
              >
                <option value="">Unassigned</option>
                {options.data?.businessServices.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField
              id="criticality"
              label="Criticality"
              error={errors.criticality?.message}
            >
              <Select id="criticality" {...register("criticality")}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </Select>
            </FormField>
            <FormField
              id="dataClassification"
              label="Data classification"
              error={errors.dataClassification?.message}
            >
              <Select
                id="dataClassification"
                {...register("dataClassification")}
              >
                <option value="public">Public</option>
                <option value="internal">Internal</option>
                <option value="confidential">Confidential</option>
                <option value="restricted">Restricted</option>
              </Select>
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
              rows={4}
              {...register("description")}
            />
          </FormField>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={close}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                mutation.isPending || options.isPending || options.isError
              }
            >
              {mutation.isPending ? "Creating…" : "Create asset"}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
