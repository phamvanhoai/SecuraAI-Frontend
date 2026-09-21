"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { FormField } from "@/components/forms/form-field";
import { useToast } from "@/components/feedback/toast";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useTreatmentPlanCreateOptions } from "../hooks/use-create-treatment-plan";
import { useUpdateTreatmentPlan } from "../hooks/use-update-treatment-plan";
import type { TreatmentPlanDetail } from "../schemas/treatment-plan-detail-schema";
import { updateTreatmentPlanSchema, type UpdateTreatmentPlanForm, type UpdateTreatmentPlanInput } from "../schemas/update-treatment-plan-schema";

const dateValue = (value: string | null): string => value?.slice(0, 10) ?? "";
const today = (): string => {
  const value = new Date();
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
};

export function EditTreatmentPlanDialog({ plan, open, onClose }: { plan: TreatmentPlanDetail; open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [message, setMessage] = useState<string>();
  const [peopleSearch, setPeopleSearch] = useState("");
  const [peoplePage, setPeoplePage] = useState(1);
  const options = useTreatmentPlanCreateOptions(open, peopleSearch, peoplePage);
  const mutation = useUpdateTreatmentPlan(plan.id);
  const toast = useToast();
  const defaults = useMemo<UpdateTreatmentPlanInput>(() => ({
    strategy: plan.strategy, description: plan.description, ownerUserId: plan.owner?.id ?? "", targetDate: dateValue(plan.targetDate),
    actions: plan.actions.filter(({ status }) => status !== "cancelled").map((action) => ({
      id: action.id, title: action.title, description: action.description ?? "", assignedToUserId: action.assignee?.id ?? "", dueDate: dateValue(action.dueDate),
    })),
  }), [plan]);
  const { register, control, handleSubmit, reset, formState: { errors, isDirty } } = useForm<UpdateTreatmentPlanInput, unknown, UpdateTreatmentPlanForm>({ resolver: zodResolver(updateTreatmentPlanSchema), defaultValues: defaults });
  const actions = useFieldArray({ control, name: "actions", keyName: "_formKey" });
  useEffect(() => { reset(defaults); }, [defaults, reset]);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);
  useEffect(() => {
    if (!open || !isDirty) return;
    const warn = (event: BeforeUnloadEvent): void => { event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isDirty, open]);
  const people = useMemo(() => {
    const values = new Map<string, { id: string; fullName: string }>();
    if (plan.owner) values.set(plan.owner.id, plan.owner);
    plan.actions.forEach(({ assignee }) => { if (assignee) values.set(assignee.id, assignee); });
    (options.data?.items ?? []).forEach((user) => values.set(user.id, user));
    return [...values.values()];
  }, [options.data?.items, plan]);
  const close = (): void => {
    if (mutation.isPending) return;
    if (isDirty && !window.confirm("You have unsaved changes. Discard them?")) return;
    setMessage(undefined);
    reset(defaults);
    onClose();
  };
  const submit = async (values: UpdateTreatmentPlanForm): Promise<void> => {
    setMessage(undefined);
    try {
      await mutation.mutateAsync({ id: plan.id, data: { ...values, expectedUpdatedAt: plan.updatedAt } });
      toast.success("Treatment plan updated", "The draft changes were saved.");
      onClose();
    } catch (error: unknown) { setMessage(error instanceof Error ? error.message : "Unable to update treatment plan."); }
  };
  return (
    <Dialog title="Edit Risk Treatment Plan" dialogRef={ref} onClose={close} className="max-h-[90vh] w-[min(58rem,calc(100%-2rem))] overflow-y-auto">
      <p className="text-muted text-sm">Update the draft plan for {plan.risk.riskCode}. Approval history and risk linkage cannot be changed.</p>
      {message ? <Alert className="mt-4"><strong className="block">Unable to update treatment plan</strong>{message}</Alert> : null}
      <form className="mt-5 space-y-6" onSubmit={handleSubmit(submit)} noValidate>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField id="edit-plan-strategy" label="Treatment strategy" error={errors.strategy?.message}>
            <Select id="edit-plan-strategy" {...register("strategy")}><option value="avoid">Avoid</option><option value="mitigate">Mitigate</option><option value="transfer">Transfer</option><option value="accept">Accept</option></Select>
          </FormField>
          <FormField id="edit-plan-target" label="Target date" error={errors.targetDate?.message}><Input id="edit-plan-target" type="date" min={today()} {...register("targetDate")} /></FormField>
          <div className="md:col-span-2"><FormField id="edit-plan-description" label="Plan description" error={errors.description?.message}><Textarea id="edit-plan-description" maxLength={5000} {...register("description")} /></FormField></div>
          <FormField id="edit-plan-owner" label="Plan owner" error={errors.ownerUserId?.message}>
            <Select id="edit-plan-owner" {...register("ownerUserId")}><option value="">Select an active owner</option>{people.map((person) => <option key={person.id} value={person.id}>{person.fullName}</option>)}</Select>
          </FormField>
          <div className="md:col-span-2 space-y-2">
            <label className="text-sm font-medium" htmlFor="edit-plan-people-search">Find an owner or assignee</label>
            <Input id="edit-plan-people-search" value={peopleSearch} placeholder="Search by name, email, or employee code" onChange={(event) => { setPeopleSearch(event.target.value); setPeoplePage(1); }} />
            <div className="flex items-center justify-between gap-3 text-sm">
              <Button type="button" variant="secondary" disabled={peoplePage <= 1 || options.isFetching} onClick={() => setPeoplePage((page) => Math.max(1, page - 1))}>Previous people</Button>
              <span className="text-muted">Page {peoplePage} of {Math.max(1, options.data?.pagination.totalPages ?? 1)}</span>
              <Button type="button" variant="secondary" disabled={peoplePage >= (options.data?.pagination.totalPages ?? 1) || options.isFetching} onClick={() => setPeoplePage((page) => page + 1)}>Next people</Button>
            </div>
          </div>
        </div>
        <section>
          <div className="flex items-center justify-between gap-3"><div><h3 className="font-semibold">Treatment actions</h3><p className="text-muted text-sm">Started or completed actions cannot be removed.</p></div><Button type="button" variant="secondary" onClick={() => actions.append({ title: "", description: "", assignedToUserId: "", dueDate: "" })}><Plus className="size-4" /> Add action</Button></div>
          {typeof errors.actions?.message === "string" ? <p className="text-danger mt-2 text-sm">{errors.actions.message}</p> : null}
          <div className="mt-4 space-y-4">{actions.fields.map((field, index) => (
            <article className="border-border rounded-xl border p-4" key={field._formKey}>
              {(() => {
                const original = field.id ? plan.actions.find((action) => action.id === field.id) : undefined;
                const locked = Boolean(original && (original.status !== "pending" || original.progressPercent > 0));
                return <>
              <div className="flex justify-between gap-3"><div><h4 className="font-medium">Action {index + 1}</h4>{locked ? <p className="text-muted text-sm">This action has started and cannot be changed.</p> : null}</div><Button type="button" variant="secondary" disabled={locked} onClick={() => actions.remove(index)}><Trash2 className="size-4" /> Remove</Button></div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <FormField id={`edit-action-${index}-title`} label="Action title" error={errors.actions?.[index]?.title?.message}><Input id={`edit-action-${index}-title`} readOnly={locked} {...register(`actions.${index}.title`)} /></FormField>
                <FormField id={`edit-action-${index}-due`} label="Due date" error={errors.actions?.[index]?.dueDate?.message}><Input id={`edit-action-${index}-due`} type="date" min={today()} readOnly={locked} {...register(`actions.${index}.dueDate`)} /></FormField>
                <FormField id={`edit-action-${index}-assignee`} label="Assignee" error={errors.actions?.[index]?.assignedToUserId?.message}>{locked ? <><input type="hidden" {...register(`actions.${index}.assignedToUserId`)} /><Select id={`edit-action-${index}-assignee`} value={original?.assignee?.id ?? ""} disabled><option value={original?.assignee?.id ?? ""}>{original?.assignee?.fullName ?? "Unassigned"}</option></Select></> : <Select id={`edit-action-${index}-assignee`} {...register(`actions.${index}.assignedToUserId`)}><option value="">Select an active assignee</option>{people.map((person) => <option key={person.id} value={person.id}>{person.fullName}</option>)}</Select>}</FormField>
                <FormField id={`edit-action-${index}-description`} label="Description (optional)" error={errors.actions?.[index]?.description?.message}><Textarea id={`edit-action-${index}-description`} readOnly={locked} {...register(`actions.${index}.description`)} /></FormField>
              </div>
                </>;
              })()}
            </article>
          ))}</div>
        </section>
        <div className="flex justify-end gap-3"><Button type="button" variant="secondary" onClick={close} disabled={mutation.isPending}>Cancel</Button><Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Saving..." : "Save changes"}</Button></div>
      </form>
    </Dialog>
  );
}
