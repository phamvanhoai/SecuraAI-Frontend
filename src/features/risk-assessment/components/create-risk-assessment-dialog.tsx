"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useToast } from "@/components/feedback/toast";
import { FormField } from "@/components/forms/form-field";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  useCreateRiskAssessment,
  useRiskCreateOptions,
} from "../hooks/use-create-risk-assessment";
import {
  createRiskAssessmentSchema,
  type CreateRiskAssessmentForm,
  type CreateRiskAssessmentInput,
  type CreateRiskAssessmentRequest,
} from "../schemas/create-risk-assessment-schema";

const tomorrow = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
};

const defaults: CreateRiskAssessmentInput = {
  scopeType: "asset",
  scopeId: "",
  title: "",
  description: "",
  ownerUserId: "",
  reviewDate: tomorrow(),
};

export function CreateRiskAssessmentDialog() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string>();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const options = useRiskCreateOptions(open);
  const mutation = useCreateRiskAssessment();
  const toast = useToast();
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors },
  } = useForm<CreateRiskAssessmentInput, unknown, CreateRiskAssessmentForm>({
    resolver: zodResolver(createRiskAssessmentSchema),
    defaultValues: defaults,
  });
  const scopeType = useWatch({ control, name: "scopeType" });

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const close = () => {
    setOpen(false);
    setMessage(undefined);
  };

  const submit = async (values: CreateRiskAssessmentForm) => {
    const request: CreateRiskAssessmentRequest = {
      title: values.title,
      description: values.description,
      ownerUserId: values.ownerUserId,
      reviewDate: values.reviewDate,
      scope:
        values.scopeType === "asset"
          ? { type: "asset", assetId: values.scopeId }
          : {
              type: "business_service",
              businessServiceId: values.scopeId,
            },
    };
    try {
      const created = await mutation.mutateAsync(request);
      reset(defaults);
      close();
      toast.success(
        "Risk assessment created",
        `${created.riskCode} is ready for threat and vulnerability identification.`,
      );
    } catch (error: unknown) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to create risk assessment.",
      );
    }
  };

  const scopeItems =
    scopeType === "asset"
      ? options.data?.assets.map((item) => ({
          id: item.id,
          label: `${item.code} — ${item.name}`,
        }))
      : options.data?.businessServices.map((item) => ({
          id: item.id,
          label: `${item.name} (${item.assetCount} active assets)`,
        }));

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        <Plus className="size-4" aria-hidden="true" />
        Create assessment
      </Button>
      <Dialog
        title="Create Risk Assessment"
        dialogRef={dialogRef}
        onClose={close}
        className="max-h-[90vh] w-[min(56rem,calc(100%-2rem))] overflow-y-auto"
      >
        <form className="space-y-6" noValidate onSubmit={handleSubmit(submit)}>
          {message ? (
            <Alert className="border-danger/25 bg-danger-soft text-danger">
              {message}
            </Alert>
          ) : null}
          {options.isError ? (
            <Alert>Unable to load active assets, services, and owners.</Alert>
          ) : null}

          <section className="space-y-4">
            <h3 className="font-semibold">Scope and ownership</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField id="scopeType" label="Assessment scope">
                <Select
                  id="scopeType"
                  {...register("scopeType", {
                    onChange: () => setValue("scopeId", ""),
                  })}
                >
                  <option value="asset">Asset</option>
                  <option value="business_service">Business service</option>
                </Select>
              </FormField>
              <FormField
                id="scopeId"
                label={scopeType === "asset" ? "Asset" : "Business service"}
                error={errors.scopeId?.message}
              >
                <Select id="scopeId" aria-invalid={Boolean(errors.scopeId)} {...register("scopeId")}>
                  <option value="">Select scope</option>
                  {scopeItems?.map((item) => (
                    <option key={item.id} value={item.id}>{item.label}</option>
                  ))}
                </Select>
              </FormField>
              <FormField id="ownerUserId" label="Risk owner" error={errors.ownerUserId?.message}>
                <Select id="ownerUserId" {...register("ownerUserId")}>
                  <option value="">Select owner</option>
                  {options.data?.owners.map((item) => (
                    <option key={item.id} value={item.id}>{item.fullName} — {item.email}</option>
                  ))}
                </Select>
              </FormField>
              <FormField id="reviewDate" label="Review date" error={errors.reviewDate?.message}>
                <Input id="reviewDate" type="date" min={tomorrow()} {...register("reviewDate")} />
              </FormField>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="font-semibold">Risk context</h3>
            <FormField id="title" label="Risk title" error={errors.title?.message}>
              <Input id="title" maxLength={255} {...register("title")} />
            </FormField>
            <FormField id="description" label="Context and scope" error={errors.description?.message}>
              <Textarea id="description" rows={4} maxLength={5000} {...register("description")} />
            </FormField>
          </section>

          <Alert>
            After creation, identify threats and vulnerabilities before assessing inherent risk. Control effectiveness, residual risk, and target risk are completed in their dedicated steps.
          </Alert>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={close}>Cancel</Button>
            <Button type="submit" disabled={mutation.isPending || options.isPending}>
              {mutation.isPending ? "Creating…" : "Create assessment"}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
