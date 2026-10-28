"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { FileText, Info, Loader2, Plus, Tag, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/feedback/toast";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCreateAsset } from "../hooks/use-create-asset";
import { useAssetCreateOptions } from "../hooks/use-asset-create-options";
import { assetTypes, assetTypeLabels } from "../schemas/asset-type-schema";
import {
  createAssetSchema,
  type CreateAssetInput,
  type CreateAssetOutput,
} from "../schemas/create-asset-schema";

const defaults: CreateAssetInput = {
  name: "",
  assetType: "",
  ownerUserId: "",
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

          {/* Options load error banner */}
          {options.isError ? (
            <div role="alert" className="border-border bg-neutral-soft/30 flex gap-2.5 rounded-xl border p-3.5">
              <Info
                className="mt-0.5 size-4 shrink-0 text-danger"
                strokeWidth={1.8}
              />
              <p className="text-xs leading-5">
                <span className="text-danger font-medium block">Unable to load reference data.</span>
                <span className="text-muted">Close the form and try again before submitting.</span>
              </p>
            </div>
          ) : null}

          {/* Identity section */}
          <div className="space-y-3">
            <div className="flex items-start gap-2 border-b border-border pb-2">
              <Tag
                className="mt-0.5 size-4 shrink-0 text-brand"
                strokeWidth={1.8}
              />
              <h3 className="text-sm font-semibold">Identity</h3>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Asset name */}
              <div className="space-y-1.5">
                <label htmlFor="name" className="block text-sm font-medium">
                  Asset name
                </label>
                <Input
                  id="name"
                  maxLength={255}
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? "name-error" : undefined}
                  {...register("name")}
                />
                {errors.name && (
                  <p id="name-error" role="alert" className="text-danger text-xs">
                    {errors.name.message}
                  </p>
                )}
              </div>

              {/* Asset type */}
              <div className="space-y-1.5">
                <label htmlFor="assetType" className="block text-sm font-medium">
                  Asset type
                </label>
                <Select
                  id="assetType"
                  aria-required="true"
                  aria-invalid={Boolean(errors.assetType)}
                  aria-describedby={errors.assetType ? "assetType-error" : undefined}
                  {...register("assetType")}
                >
                  <option value="" disabled>Select asset type</option>
                  {assetTypes.map((value) => (
                    <option key={value} value={value}>
                      {assetTypeLabels[value]}
                    </option>
                  ))}
                </Select>
                {errors.assetType && (
                  <p id="assetType-error" role="alert" className="text-danger text-xs">
                    {errors.assetType.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Ownership section */}
          <div className="space-y-3">
            <div className="flex items-start gap-2 border-b border-border pb-2">
              <User
                className="mt-0.5 size-4 shrink-0 text-brand"
                strokeWidth={1.8}
              />
              <h3 className="text-sm font-semibold">Ownership</h3>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="ownerUserId" className="block text-sm font-medium">
                Asset owner
                <span aria-hidden="true" className="text-muted ml-1 font-normal">(optional)</span>
              </label>
              <Select
                id="ownerUserId"
                aria-label="Asset owner"
                disabled={options.isPending || options.isError}
                aria-invalid={Boolean(errors.ownerUserId)}
                aria-describedby={errors.ownerUserId ? "ownerUserId-error" : undefined}
                {...register("ownerUserId")}
              >
                <option value="">Unassigned</option>
                {options.data?.owners.map((owner) => (
                  <option key={owner.id} value={owner.id}>
                    {owner.fullName} · {owner.role}
                  </option>
                ))}
              </Select>
              {errors.ownerUserId && (
                <p id="ownerUserId-error" role="alert" className="text-danger text-xs">
                  {errors.ownerUserId.message}
                </p>
              )}
            </div>
          </div>

          {/* Description section */}
          <div className="space-y-3">
            <div className="flex items-start gap-2 border-b border-border pb-2">
              <FileText
                className="mt-0.5 size-4 shrink-0 text-brand"
                strokeWidth={1.8}
              />
              <h3 className="text-sm font-semibold">Description</h3>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="description" className="block text-sm font-medium">
                Description
                <span aria-hidden="true" className="text-muted ml-1 font-normal">(optional)</span>
              </label>
              <Textarea
                id="description"
                maxLength={10_000}
                rows={4}
                aria-invalid={Boolean(errors.description)}
                aria-describedby={errors.description ? "description-error" : undefined}
                {...register("description")}
              />
              {errors.description && (
                <p id="description-error" role="alert" className="text-danger text-xs">
                  {errors.description.message}
                </p>
              )}
            </div>
          </div>

          {/* Info hint */}
          <div className="border-border bg-neutral-soft/30 flex gap-2.5 rounded-xl border p-3.5">
            <Info
              className="mt-0.5 size-4 shrink-0 text-brand"
              strokeWidth={1.8}
            />
            <p className="text-muted text-xs leading-5">
              The system generates a unique asset code after creation. Use{" "}
              <strong className="text-foreground">Manage links</strong> to assign
              business context and{" "}
              <strong className="text-foreground">Classify asset</strong> to
              determine criticality and data classification.
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="secondary" onClick={close}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending || options.isPending || options.isError}
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
                "Create asset"
              )}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
