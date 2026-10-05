"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useToast } from "@/components/feedback/toast";
import { FormField } from "@/components/forms/form-field";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCreateRiskAssessment } from "../hooks/use-create-risk-assessment";
import {
  createRiskAssessmentSchema,
  type CreateRiskAssessmentForm,
  type CreateRiskAssessmentInput,
  type CreateRiskAssessmentRequest,
} from "../schemas/create-risk-assessment-schema";

import { RiskOptionPicker } from "./risk-option-picker";

import {
  nextRiskReviewDate,
  reviewDatePreview,
} from "../schemas/risk-review-date";

const defaults = (): CreateRiskAssessmentInput => ({
  scopeType: "asset",
  scopeId: "",
  title: "",
  description: "",
  ownerUserId: "",
  reviewDate: nextRiskReviewDate(),
});

export function CreateRiskAssessmentDialog() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string>();
  const dialogRef = useRef<HTMLDialogElement>(null);
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
    defaultValues: defaults(),
  });
  const scopeType = useWatch({ control, name: "scopeType" });
  const reviewDate = useWatch({ control, name: "reviewDate" });

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
      reset(defaults());
      close();
      toast.success(
        "Risk created",
        `${created.riskCode} is ready for threat and vulnerability identification.`,
      );
    } catch (error: unknown) {
      setMessage(
        error instanceof Error ? error.message : "Unable to create risk.",
      );
    }
  };

  return (
    <>
      <Button
        type="button"
        onClick={() => {
          reset(defaults());
          setOpen(true);
        }}
      >
        <Plus className="size-4" aria-hidden="true" />
        Create Risk
      </Button>
      <Dialog
        title="Create Risk"
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

          <section className="space-y-4">
            <h3 className="font-semibold">Scope and ownership</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField id="scopeType" label="Risk scope">
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
                <Controller
                  name="scopeId"
                  control={control}
                  render={({ field }) => (
                    <RiskOptionPicker
                      key={scopeType}
                      id="scopeId"
                      kind={scopeType}
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      inputRef={field.ref}
                      enabled={open}
                      invalid={Boolean(errors.scopeId)}
                    />
                  )}
                />
              </FormField>
              <FormField
                id="ownerUserId"
                label="Risk owner"
                error={errors.ownerUserId?.message}
              >
                <Controller
                  name="ownerUserId"
                  control={control}
                  render={({ field }) => (
                    <RiskOptionPicker
                      id="ownerUserId"
                      kind="owner"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      inputRef={field.ref}
                      enabled={open}
                      invalid={Boolean(errors.ownerUserId)}
                    />
                  )}
                />
              </FormField>
              <FormField
                id="reviewDate"
                label="Review date"
                error={errors.reviewDate?.message}
              >
                <Input
                  id="reviewDate"
                  type="date"
                  min={nextRiskReviewDate()}
                  aria-invalid={Boolean(errors.reviewDate)}
                  aria-describedby={`reviewDate-help${errors.reviewDate ? " reviewDate-error" : ""}`}
                  {...register("reviewDate")}
                />
                <p id="reviewDate-help" className="text-muted text-sm">
                  After today in Asia/Bangkok (UTC+7). Browser format may vary;
                  selected date (DD/MM/YYYY): {reviewDatePreview(reviewDate)}.
                </p>
              </FormField>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="font-semibold">Risk context</h3>
            <FormField
              id="title"
              label="Risk title"
              error={errors.title?.message}
            >
              <Input id="title" maxLength={255} {...register("title")} />
            </FormField>
            <FormField
              id="description"
              label="Context and scope"
              error={errors.description?.message}
            >
              <Textarea
                id="description"
                rows={4}
                maxLength={5000}
                {...register("description")}
              />
            </FormField>
          </section>

          <Alert>
            After creation, identify threats and vulnerabilities before
            assessing inherent risk. Control effectiveness, residual risk, and
            target risk are completed in their dedicated steps.
          </Alert>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={close}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Creating…" : "Create Risk"}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
