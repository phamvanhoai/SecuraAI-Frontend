"use client";
import { AcceptanceCostFields } from "./acceptance-cost-fields";
import { emptyAcceptanceCost } from "../schemas/acceptance-cost-schema";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useToast } from "@/components/feedback/toast";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { TreatmentActionOwnerPicker } from "./treatment-action-owner-picker";
import { useRiskRecord } from "../hooks/use-risk-register";
import { createRiskTreatmentPlanSchema } from "../schemas/create-risk-treatment-plan-schema";
import {
  useCreateRiskTreatmentPlan,
  useRiskTreatmentPlanOptions,
} from "../hooks/use-create-risk-treatment-plan";

type Action = {
  rowKey: number;
  title: string;
  assignedToUserId: string;
  dueDate: string;
};
export function CreateRiskTreatmentPlanDialog({
  riskId,
  riskLabel,
  onClose,
}: {
  riskId: string | null;
  riskLabel: string;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const nextActionKey = useRef(1);
  const toast = useToast();
  const options = useRiskTreatmentPlanOptions(riskId);
  const mutation = useCreateRiskTreatmentPlan();
  const risk = useRiskRecord(riskId);
  const current = risk.data?.assessments
    .filter(
      (item) =>
        item.residualRating !== null && item.type !== "target_definition",
    )
    .toSorted((a, b) => Date.parse(b.assessedAt) - Date.parse(a.assessedAt))[0];
  const rank = { low: 1, medium: 2, high: 3, critical: 4 } as const;
  const [title, setTitle] = useState("");
  const [strategy, setStrategy] = useState("mitigate");
  const [acceptanceCost, setAcceptanceCost] = useState({ ...emptyAcceptanceCost });
  const [owner, setOwner] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [targetRisk, setTargetRisk] = useState("low");
  const [controls, setControls] = useState<string[]>([]);
  const [actions, setActions] = useState<Action[]>([
    { rowKey: 0, title: "", assignedToUserId: "", dueDate: "" },
  ]);
  const [error, setError] = useState("");
  useEffect(() => {
    if (riskId) ref.current?.showModal();
    else ref.current?.close();
  }, [riskId]);
  const close = () => {
    ref.current?.close();
    onClose();
    setError("");
    setTitle("");
    setStrategy("mitigate");
    setAcceptanceCost({ ...emptyAcceptanceCost });
    setOwner("");
    setTargetDate("");
    setTargetRisk("low");
    setControls([]);
    nextActionKey.current = 1;
    setActions([{ rowKey: 0, title: "", assignedToUserId: "", dueDate: "" }]);
  };
  const submit = async () => {
    if (!riskId) return;
    const parsed = createRiskTreatmentPlanSchema.safeParse({
      riskId,
      title,
      strategy,
      ownerUserId: owner,
      targetDate,
      targetRisk,
      controlIds: controls,
      acceptanceCost: strategy === "accept" ? acceptanceCost : null,
      actions: (strategy === "accept" ? [] : actions).map(({ title, assignedToUserId, dueDate }) => ({
        title,
        assignedToUserId,
        dueDate,
      })),
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check the plan details.");
      return;
    }
    if (
      current?.residualRating &&
      rank[parsed.data.targetRisk] > rank[current.residualRating]
    ) {
      setError("Target risk cannot exceed current residual risk.");
      return;
    }
    try {
      await mutation.mutateAsync(parsed.data);
      toast.success("Treatment plan created", riskLabel);
      close();
    } catch (reason: unknown) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Unable to create the treatment plan. Check the data and try again.",
      );
    }
  };
  const blocked = Boolean(
    risk.data &&
    (!["open", "under_treatment"].includes(risk.data.status) ||
      risk.data.acceptances.some((item) => item.decision === "pending") ||
      risk.data.activeTreatmentPlan),
  );
  const selectedRank = rank[targetRisk as keyof typeof rank];
  const outsideThreshold = Boolean(
    (current?.riskTolerance && selectedRank > rank[current.riskTolerance]) ||
    (current?.riskAppetite && selectedRank > rank[current.riskAppetite]),
  );
  return (
    <Dialog
      title="Create Risk Treatment Plan"
      dialogRef={ref}
      onClose={close}
      className="max-h-[90vh] w-[min(56rem,calc(100%-2rem))] overflow-y-auto"
    >
      <form
        className="space-y-5"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        {blocked ? (
          <Alert>
            This Risk is finalized, has pending acceptance, or already has a
            Draft/Active plan. Create is unavailable.
          </Alert>
        ) : null}
        {risk.isError || options.isError ? (
          <Alert>
            Unable to load Risk or options. Close and reopen to try again.
          </Alert>
        ) : null}
        {outsideThreshold ? (
          <Alert className="border-warning/30 bg-warning-soft text-warning">
            The intended target is outside the applicable appetite/tolerance.
            Review whether the planned actions are sufficient.
          </Alert>
        ) : null}
        <p className="text-muted text-sm">{riskLabel}</p>
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
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>
          <label className="text-sm font-medium">
            Treatment option
            <Select
              className="mt-1"
              value={strategy}
              onChange={(e) => setStrategy(e.target.value)}
            >
              <option value="mitigate">Mitigate</option>
              <option value="avoid">Avoid</option>
              <option value="transfer">Transfer</option>
              <option value="accept">Accept</option>
            </Select>
          </label>
          <label className="text-sm font-medium">
            Responsible owner
            <Select
              className="mt-1"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
            >
              <option value="">Select owner</option>
              {options.data?.users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullName} — {u.email}
                </option>
              ))}
            </Select>
          </label>
          <label className="text-sm font-medium">
            Due date
            <Input
              className="mt-1"
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
            />
          </label>
          <label className="text-sm font-medium">
            Target risk
            <Select
              className="mt-1"
              value={targetRisk}
              onChange={(e) => setTargetRisk(e.target.value)}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </Select>
          </label>
        </div>
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">
            Controls addressed by this plan
          </legend>
          <p className="text-muted text-xs">
            Mitigate requires a related Control. Avoid, Transfer and Accept may
            have none. Available Controls are already linked to this Risk.
          </p>
          <div className="border-border grid max-h-40 gap-2 overflow-y-auto rounded-lg border p-3 md:grid-cols-2">
            {options.data?.controls.length ? (
              options.data.controls.map((c) => (
                <Label key={c.id} className="flex min-h-10 items-start gap-2">
                  <input
                    className="mt-0.5 size-4"
                    type="checkbox"
                    checked={controls.includes(c.id)}
                    onChange={(e) =>
                      setControls(
                        e.target.checked
                          ? [...controls, c.id]
                          : controls.filter((id) => id !== c.id),
                      )
                    }
                  />
                  <span>
                    {c.code} — {c.name}
                  </span>
                </Label>
              ))
            ) : (
              <p className="text-muted text-sm md:col-span-2">
                No eligible Controls are linked to this Risk.
              </p>
            )}
          </div>
        </fieldset>
        {strategy === "accept" ? <AcceptanceCostFields value={acceptanceCost} onChange={setAcceptanceCost} /> : <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Required actions</h3>
              <p className="text-muted text-sm">
                Record the work needed to carry out the selected treatment.
              </p>
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                setActions([
                  ...actions,
                  {
                    rowKey: nextActionKey.current++,
                    title: "",
                    assignedToUserId: "",
                    dueDate: "",
                  },
                ])
              }
            >
              <Plus className="size-4" />
              Add action
            </Button>
          </div>
          {actions.map((action, index) => (
            <div
              key={action.rowKey}
              className="border-border grid items-start gap-3 rounded-lg border p-3 md:grid-cols-[1fr_1fr_10rem_auto]"
            >
              <Input
                aria-label={`Action ${index + 1} title`}
                placeholder="Action description"
                value={action.title}
                onChange={(e) =>
                  setActions(
                    actions.map((a, i) =>
                      i === index ? { ...a, title: e.target.value } : a,
                    ),
                  )
                }
              />
              <TreatmentActionOwnerPicker
                riskId={riskId}
                actionNumber={index + 1}
                users={options.data?.users ?? []}
                value={action.assignedToUserId}
                onChange={(id) =>
                  setActions(
                    actions.map((a, i) =>
                      i === index ? { ...a, assignedToUserId: id } : a,
                    ),
                  )
                }
              />
              <Input
                aria-label={`Action ${index + 1} due date`}
                type="date"
                value={action.dueDate}
                onChange={(e) =>
                  setActions(
                    actions.map((a, i) =>
                      i === index ? { ...a, dueDate: e.target.value } : a,
                    ),
                  )
                }
              />
              <Button
                type="button"
                variant="secondary"
                aria-label={`Remove action ${index + 1}`}
                onClick={() =>
                  setActions(actions.filter((_, i) => i !== index))
                }
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </section>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={close}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={
              blocked ||
              risk.isPending ||
              risk.isError ||
              options.isError ||
              mutation.isPending ||
              options.isPending
            }
          >
            {mutation.isPending ? "Creating..." : "Create plan"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
