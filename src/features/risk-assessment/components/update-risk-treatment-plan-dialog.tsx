"use client";
import { useEffect, useRef, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { ApiError } from "@/lib/api/api-error";
import { useToast } from "@/components/feedback/toast";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { RiskRegisterDetail } from "../schemas/risk-register-schema";
import { updateRiskTreatmentPlanSchema } from "../schemas/update-risk-treatment-plan-schema";
import { useRiskTreatmentPlanOptions } from "../hooks/use-create-risk-treatment-plan";
import { useUpdateRiskTreatmentPlan } from "../hooks/use-update-risk-treatment-plan";
type Plan = RiskRegisterDetail["treatmentPlans"][number];
type Draft = Omit<Plan, "actions"> & {
  actions: Array<Omit<Plan["actions"][number], "id"> & { id?: string }>;
};
export function UpdateRiskTreatmentPlanDialog({
  plan,
  onClose,
}: {
  plan: Plan;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [draft, setDraft] = useState<Draft>(plan);
  const [error, setError] = useState("");
  const options = useRiskTreatmentPlanOptions(true);
  const mutation = useUpdateRiskTreatmentPlan(plan.id);
  const toast = useToast();
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  const changeAction = (
    index: number,
    values: Partial<Draft["actions"][number]>,
  ) =>
    setDraft({
      ...draft,
      actions: draft.actions.map((item, i) =>
        i === index ? { ...item, ...values } : item,
      ),
    });
  const submit = async () => {
    const parsed = updateRiskTreatmentPlanSchema.safeParse({
      title: draft.title,
      strategy: draft.strategy,
      ownerUserId: draft.owner?.id ?? "",
      targetDate: draft.targetCompletionDate?.slice(0, 10) ?? "",
      status: draft.status,
      expectedUpdatedAt: draft.updatedAt,
      actions: draft.actions.map((item) => ({
        ...item,
        assignedToUserId: item.assignedToUserId ?? "",
        dueDate: item.dueDate?.slice(0, 10) ?? "",
      })),
    });
    if (!parsed.success)
      return setError(
        parsed.error.issues[0]?.message ?? "Check the plan details.",
      );
    try {
      await mutation.mutateAsync(parsed.data);
      toast.success(
        "Treatment plan updated",
        "Action status and progress were saved.",
      );
      onClose();
    } catch (reason) {
      if (reason instanceof ApiError && [403, 409].includes(reason.status)) {
        toast.warning(
          "Plan changed or access denied",
          "The risk was refreshed. Reopen an eligible plan before editing.",
        );
        onClose();
        return;
      }
      setError(
        reason instanceof Error
          ? reason.message
          : "Unable to update treatment plan.",
      );
    }
  };
  return (
    <Dialog
      title="Update Risk Treatment Plan"
      dialogRef={ref}
      onClose={onClose}
      className="max-h-[90vh] w-[min(56rem,calc(100%-2rem))] overflow-y-auto"
    >
      <form
        className="space-y-5"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        {error ? (
          <Alert className="border-danger/25 bg-danger-soft text-danger">
            {error}
          </Alert>
        ) : null}
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium">
            Plan title
            <Input
              className="mt-1"
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            />
          </label>
          <label className="text-sm font-medium">
            Plan status
            <Select
              className="mt-1"
              value={draft.status}
              onChange={(e) => setDraft({ ...draft, status: e.target.value })}
            >
              {["draft", "active", "completed", "cancelled"].map((value) => (
                <option key={value}>{value}</option>
              ))}
            </Select>
          </label>
          <label className="text-sm font-medium">
            Treatment option
            <Select
              className="mt-1"
              value={draft.strategy}
              onChange={(e) => setDraft({ ...draft, strategy: e.target.value })}
            >
              {["mitigate", "avoid", "transfer", "accept"].map((value) => (
                <option key={value}>{value}</option>
              ))}
            </Select>
          </label>
          <label className="text-sm font-medium">
            Responsible owner
            <Select
              className="mt-1"
              value={draft.owner?.id ?? ""}
              onChange={(e) => {
                const user = options.data?.users.find(
                  (item) => item.id === e.target.value,
                );
                setDraft({
                  ...draft,
                  owner: user
                    ? { id: user.id, fullName: user.fullName, inactive: false }
                    : null,
                });
              }}
            >
              <option value="">Select owner</option>
              {options.data?.users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullName}
                </option>
              ))}
            </Select>
          </label>
          <label className="text-sm font-medium">
            Target date
            <Input
              className="mt-1"
              type="date"
              value={draft.targetCompletionDate?.slice(0, 10) ?? ""}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  targetCompletionDate: `${e.target.value}T00:00:00.000Z`,
                })
              }
            />
          </label>
        </div>
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold">Treatment actions</h3>
              <p className="text-muted text-sm">
                Pending = 0%, in progress = 50%, completed = 100%.
              </p>
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                setDraft({
                  ...draft,
                  actions: [
                    ...draft.actions,
                    {
                      title: "",
                      assignedToUserId: null,
                      dueDate: null,
                      status: "pending",
                    },
                  ],
                })
              }
            >
              <Plus className="size-4" />
              Add action
            </Button>
          </div>
          {draft.actions.map((action, index) => (
            <div
              key={action.id ?? `new-${index}`}
              className="border-border grid gap-3 rounded-lg border p-3 md:grid-cols-[1fr_1fr_10rem_10rem_auto]"
            >
              <Input
                aria-label={`Action ${index + 1} title`}
                value={action.title}
                onChange={(e) => changeAction(index, { title: e.target.value })}
              />
              <Select
                aria-label={`Action ${index + 1} owner`}
                value={action.assignedToUserId ?? ""}
                onChange={(e) =>
                  changeAction(index, { assignedToUserId: e.target.value })
                }
              >
                <option value="">Assign owner</option>
                {options.data?.users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName}
                  </option>
                ))}
              </Select>
              <Input
                aria-label={`Action ${index + 1} due date`}
                type="date"
                value={action.dueDate?.slice(0, 10) ?? ""}
                onChange={(e) =>
                  changeAction(index, {
                    dueDate: `${e.target.value}T00:00:00.000Z`,
                  })
                }
              />
              <Select
                aria-label={`Action ${index + 1} progress`}
                value={action.status}
                onChange={(e) =>
                  changeAction(index, {
                    status: e.target.value as typeof action.status,
                  })
                }
              >
                <option value="pending">0% Pending</option>
                <option value="in_progress">50% In progress</option>
                <option value="completed">100% Completed</option>
                <option value="cancelled">Cancelled</option>
              </Select>
              <Button
                type="button"
                variant="secondary"
                aria-label={`Remove action ${index + 1}`}
                disabled={Boolean(
                  action.id &&
                  plan.actions.some(
                    (saved) =>
                      saved.id === action.id && saved.status !== "pending",
                  ),
                )}
                onClick={() =>
                  setDraft({
                    ...draft,
                    actions: draft.actions.filter((_, i) => i !== index),
                  })
                }
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </section>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
