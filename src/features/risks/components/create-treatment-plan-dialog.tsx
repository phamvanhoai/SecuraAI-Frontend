"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { FormField } from "@/components/forms/form-field";
import { useToast } from "@/components/feedback/toast";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCreateTreatmentPlan, useTreatmentPlanCreateOptions } from "../hooks/use-create-treatment-plan";
import {
  createTreatmentPlanSchema,
  type CreateTreatmentPlanForm,
  type CreateTreatmentPlanInput,
} from "../schemas/create-treatment-plan-schema";

const today = (): string => {
  const value = new Date();
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
const defaults: CreateTreatmentPlanInput = {
  strategy: "mitigate",
  description: "",
  ownerUserId: "",
  targetDate: "",
  actions: [
    { title: "", description: "", assignedToUserId: "", dueDate: "" },
  ],
};

export function CreateTreatmentPlanDialog({
  riskAssessmentId,
  riskCode,
  expectedRiskUpdatedAt,
  open,
  onClose,
}: {
  riskAssessmentId: string;
  riskCode: string;
  expectedRiskUpdatedAt: string;
  open: boolean;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [message, setMessage] = useState<string>();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const options = useTreatmentPlanCreateOptions(open, debouncedSearch, page);
  const mutation = useCreateTreatmentPlan(riskAssessmentId);
  const toast = useToast();
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<CreateTreatmentPlanInput, unknown, CreateTreatmentPlanForm>({
    resolver: zodResolver(createTreatmentPlanSchema),
    defaultValues: defaults,
  });
  const actions = useFieldArray({ control, name: "actions" });

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);
  useEffect(() => {
    if (!open || !isDirty) return;
    const warn = (event: BeforeUnloadEvent): void => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isDirty, open]);

  const close = (): void => {
    if (mutation.isPending) return;
    if (isDirty && !window.confirm("Discard the unsaved treatment plan changes?")) return;
    reset(defaults);
    setMessage(undefined);
    setSearch("");
    setPage(1);
    onClose();
  };
  const submit = async (values: CreateTreatmentPlanForm): Promise<void> => {
    setMessage(undefined);
    try {
      await mutation.mutateAsync({
        ...values,
        riskAssessmentId,
        expectedRiskUpdatedAt,
      });
      reset(defaults);
      onClose();
      toast.success(
        "Treatment plan created",
        `${riskCode} now has a draft treatment plan.`,
      );
    } catch (error: unknown) {
      setMessage(
        error instanceof Error ? error.message : "Unable to create treatment plan.",
      );
    }
  };
  const users = options.data?.items ?? [];
  const pagination = options.data?.pagination;

  return (
    <Dialog
      title="Create Risk Treatment Plan"
      dialogRef={ref}
      onClose={close}
      className="max-h-[90vh] w-[min(58rem,calc(100%-2rem))] overflow-y-auto"
    >
      <p className="text-muted text-sm">
        Create a structured draft plan for {riskCode}. It can be submitted for
        approval after review.
      </p>
      {message ? (
        <Alert className="mt-4">
          <strong className="block">Unable to create treatment plan</strong>
          <span>{message}</span>
        </Alert>
      ) : null}
      <form className="mt-5 space-y-6" onSubmit={handleSubmit(submit)} noValidate>
        <section className="grid gap-4 md:grid-cols-2">
          <FormField id="treatment-strategy" label="Treatment strategy" error={errors.strategy?.message}>
            <Select id="treatment-strategy" {...register("strategy")}>
              <option value="avoid">Avoid</option>
              <option value="mitigate">Mitigate</option>
              <option value="transfer">Transfer</option>
              <option value="accept">Accept</option>
            </Select>
          </FormField>
          <FormField id="treatment-target-date" label="Target date" error={errors.targetDate?.message}>
            <Input id="treatment-target-date" type="date" min={today()} {...register("targetDate")} />
          </FormField>
          <div className="md:col-span-2">
            <FormField id="treatment-description" label="Plan description" error={errors.description?.message}>
              <Textarea
                id="treatment-description"
                maxLength={5000}
                placeholder="Describe the treatment objective and expected outcome"
                {...register("description")}
              />
            </FormField>
          </div>
        </section>

        <section className="border-border rounded-xl border p-4">
          <h3 className="font-semibold">Responsible people</h3>
          <label className="text-muted mt-3 block text-sm" htmlFor="treatment-user-search">
            Search active users
          </label>
          <div className="relative mt-2">
            <Search className="text-muted pointer-events-none absolute top-3 left-3 size-4" aria-hidden="true" />
            <Input
              id="treatment-user-search"
              className="pl-9"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Name, email, or employee code"
            />
          </div>
          {options.isError ? (
            <p className="text-danger mt-2 text-sm">Unable to load active users.</p>
          ) : null}
          <div className="mt-4">
            <FormField id="treatment-owner" label="Plan owner" error={errors.ownerUserId?.message}>
              <Select id="treatment-owner" disabled={options.isPending} {...register("ownerUserId")}>
                <option value="">{options.isPending ? "Loading users..." : "Select an active owner"}</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.fullName}{user.employeeCode ? ` — ${user.employeeCode}` : ""}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>
          {pagination && pagination.totalPages > 1 ? (
            <div className="mt-3 flex items-center justify-between gap-3">
              <Button type="button" variant="secondary" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>
                Previous users
              </Button>
              <span className="text-muted text-sm">Page {pagination.page} of {pagination.totalPages}</span>
              <Button type="button" variant="secondary" disabled={page >= pagination.totalPages} onClick={() => setPage((value) => value + 1)}>
                Next users
              </Button>
            </div>
          ) : null}
        </section>

        <section>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold">Treatment actions</h3>
              <p className="text-muted text-sm">Avoid, mitigate, and transfer plans require at least one action.</p>
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={() => actions.append({ title: "", description: "", assignedToUserId: "", dueDate: "" })}
              disabled={actions.fields.length >= 100}
            >
              <Plus className="size-4" aria-hidden="true" /> Add action
            </Button>
          </div>
          {typeof errors.actions?.message === "string" ? (
            <p className="text-danger mt-2 text-sm">{errors.actions.message}</p>
          ) : null}
          <div className="mt-4 space-y-4">
            {actions.fields.map((field, index) => (
              <article className="border-border rounded-xl border p-4" key={field.id}>
                <div className="flex items-center justify-between gap-3">
                  <h4 className="font-medium">Action {index + 1}</h4>
                  <Button type="button" variant="secondary" onClick={() => actions.remove(index)} aria-label={`Remove action ${index + 1}`}>
                    <Trash2 className="size-4" aria-hidden="true" /> Remove
                  </Button>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <FormField id={`action-${index}-title`} label="Action title" error={errors.actions?.[index]?.title?.message}>
                    <Input id={`action-${index}-title`} maxLength={255} {...register(`actions.${index}.title`)} />
                  </FormField>
                  <FormField id={`action-${index}-due`} label="Due date" error={errors.actions?.[index]?.dueDate?.message}>
                    <Input id={`action-${index}-due`} type="date" min={today()} {...register(`actions.${index}.dueDate`)} />
                  </FormField>
                  <FormField id={`action-${index}-assignee`} label="Assignee" error={errors.actions?.[index]?.assignedToUserId?.message}>
                    <Select id={`action-${index}-assignee`} disabled={options.isPending} {...register(`actions.${index}.assignedToUserId`)}>
                      <option value="">Select an active assignee</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>{user.fullName}{user.employeeCode ? ` — ${user.employeeCode}` : ""}</option>
                      ))}
                    </Select>
                  </FormField>
                  <FormField id={`action-${index}-description`} label="Action description (optional)" error={errors.actions?.[index]?.description?.message}>
                    <Textarea id={`action-${index}-description`} maxLength={2000} {...register(`actions.${index}.description`)} />
                  </FormField>
                </div>
              </article>
            ))}
          </div>
        </section>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={close} disabled={mutation.isPending}>Cancel</Button>
          <Button type="submit" disabled={mutation.isPending || options.isPending}>
            {mutation.isPending ? "Creating..." : "Create draft plan"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
