"use client";
import { AcceptanceCostFields } from "./acceptance-cost-fields";
import { emptyAcceptanceCost } from "../schemas/acceptance-cost-schema";
import {
  CalendarDays,
  CheckSquare,
  ClipboardList,
  Info,
  Loader2,
  Plus,
  ShieldCheck,
  Target,
  Trash2,
  User,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/feedback/toast";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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

const strategies = [
  {
    value: "mitigate",
    label: "Mitigate",
    description: "Implement controls to reduce likelihood or impact.",
  },
  {
    value: "avoid",
    label: "Avoid",
    description: "Eliminate the activity that gives rise to the risk.",
  },
  {
    value: "transfer",
    label: "Transfer",
    description: "Share the risk through insurance or third parties.",
  },
  {
    value: "accept",
    label: "Accept",
    description: "Acknowledge and tolerate the risk within appetite.",
  },
] as const;

const targetRiskOptions = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
] as const;

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
  const [acceptanceCost, setAcceptanceCost] = useState({
    ...emptyAcceptanceCost,
  });
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
      actions: (strategy === "accept" ? [] : actions).map(
        ({ title: t, assignedToUserId, dueDate }) => ({
          title: t,
          assignedToUserId,
          dueDate,
        }),
      ),
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

  const cannotSave =
    blocked ||
    risk.isPending ||
    risk.isError ||
    options.isError ||
    mutation.isPending ||
    options.isPending;

  return (
    <Dialog
      title="Create Risk Treatment Plan"
      dialogRef={ref}
      onClose={close}
      className="max-h-[calc(100dvh-2rem)] w-[min(56rem,calc(100%-2rem))] overflow-y-auto"
    >
      <form
        className="space-y-6"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        {/* Context bar */}
        <div className="border-border bg-neutral-soft/30 rounded-lg border p-3.5 text-xs">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <ClipboardList
              aria-hidden="true"
              className="size-3.5 shrink-0 text-muted"
              strokeWidth={1.8}
            />
            <span className="text-foreground font-semibold break-words">
              {riskLabel}
            </span>
          </div>
          {blocked ? (
            <p className="text-warning mt-1.5 font-medium">
              This Risk is finalized, has a pending acceptance, or already has a
              Draft/Active plan. Create is unavailable.
            </p>
          ) : null}
        </div>

        {/* Alerts */}
        {risk.isError || options.isError ? (
          <Alert className="border-danger/25 bg-danger-soft text-danger">
            Unable to load Risk or options. Close and reopen to try again.
          </Alert>
        ) : null}
        {outsideThreshold ? (
          <Alert className="border-warning/30 bg-warning-soft text-warning">
            The intended target is outside the applicable appetite/tolerance.
            Review whether the planned actions are sufficient.
          </Alert>
        ) : null}
        {error ? (
          <Alert className="border-danger/25 bg-danger-soft text-danger">
            {error}
          </Alert>
        ) : null}

        {/* Section — Plan details */}
        <section aria-labelledby="plan-details-heading" className="space-y-4">
          <div className="flex items-start gap-2 border-b border-border pb-2">
            <ClipboardList
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0 text-brand"
              strokeWidth={1.8}
            />
            <div>
              <h3
                id="plan-details-heading"
                className="text-sm font-semibold text-foreground"
              >
                Plan details
              </h3>
              <p className="text-xs text-muted">
                Basic information about the treatment plan.
              </p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label
                htmlFor="plan-title"
                className="text-sm font-medium text-foreground"
              >
                Plan title
              </label>
              <Input
                id="plan-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Q3 Patch Management Initiative"
                disabled={cannotSave}
              />
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="plan-owner"
                className="text-sm font-medium text-foreground"
              >
                <span className="inline-flex items-center gap-1.5">
                  <User
                    aria-hidden="true"
                    className="size-3.5 text-muted"
                    strokeWidth={1.8}
                  />
                  Responsible owner
                </span>
              </label>
              <Select
                id="plan-owner"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                disabled={cannotSave}
              >
                <option value="">Select owner</option>
                {options.data?.users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName} — {u.email}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="plan-due-date"
                className="text-sm font-medium text-foreground"
              >
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays
                    aria-hidden="true"
                    className="size-3.5 text-muted"
                    strokeWidth={1.8}
                  />
                  Due date
                </span>
              </label>
              <Input
                id="plan-due-date"
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                disabled={cannotSave}
              />
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="plan-target-risk"
                className="text-sm font-medium text-foreground"
              >
                <span className="inline-flex items-center gap-1.5">
                  <Target
                    aria-hidden="true"
                    className="size-3.5 text-muted"
                    strokeWidth={1.8}
                  />
                  Target risk level
                </span>
              </label>
              <Select
                id="plan-target-risk"
                value={targetRisk}
                onChange={(e) => setTargetRisk(e.target.value)}
                disabled={cannotSave}
              >
                {targetRiskOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </section>

        {/* Section — Treatment strategy */}
        <section aria-labelledby="plan-strategy-heading" className="space-y-3">
          <div className="flex items-start gap-2 border-b border-border pb-2">
            <Target
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0 text-brand"
              strokeWidth={1.8}
            />
            <div>
              <h3
                id="plan-strategy-heading"
                className="text-sm font-semibold text-foreground"
              >
                Treatment strategy
              </h3>
              <p className="text-xs text-muted">
                Choose how this risk will be addressed.
              </p>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-4">
            {strategies.map((s) => (
              <label
                key={s.value}
                className={cn(
                  "border-border flex cursor-pointer flex-col gap-1 rounded-xl border p-3 text-sm transition-colors",
                  strategy === s.value
                    ? "border-brand bg-brand/5"
                    : "bg-surface hover:bg-neutral-soft",
                  cannotSave && "cursor-not-allowed opacity-60",
                )}
              >
                <input
                  type="radio"
                  className="sr-only"
                  name="treatment-strategy"
                  value={s.value}
                  checked={strategy === s.value}
                  onChange={() => setStrategy(s.value)}
                  disabled={cannotSave}
                />
                <span className="font-semibold">{s.label}</span>
                <span className="text-muted text-xs leading-snug">
                  {s.description}
                </span>
              </label>
            ))}
          </div>
        </section>

        {/* Section — Security controls */}
        <section aria-labelledby="plan-controls-heading" className="space-y-3">
          <div className="flex items-start gap-2 border-b border-border pb-2">
            <ShieldCheck
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0 text-brand"
              strokeWidth={1.8}
            />
            <div>
              <h3
                id="plan-controls-heading"
                className="text-sm font-semibold text-foreground"
              >
                Controls addressed by this plan
                <span className="text-muted ml-1.5 text-xs font-normal">
                  (optional)
                </span>
              </h3>
              <p className="text-xs text-muted">
                Mitigate requires a related control. Avoid, Transfer and Accept
                may have none. Available controls are already linked to this
                risk.
              </p>
            </div>
          </div>
          <div className="border-border overflow-hidden rounded-xl border">
            <div className="max-h-44 overflow-y-auto p-1.5">
              {options.isPending ? (
                <p className="text-muted px-3 py-4 text-sm">
                  Loading controls…
                </p>
              ) : options.data?.controls.length ? (
                <div className="grid gap-1 md:grid-cols-2">
                  {options.data.controls.map((c) => (
                    <label
                      key={c.id}
                      className={cn(
                        "flex min-h-11 cursor-pointer items-start gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                        controls.includes(c.id)
                          ? "bg-brand/5 border border-brand"
                          : "hover:bg-neutral-soft",
                        cannotSave && "cursor-not-allowed opacity-60",
                      )}
                    >
                      <input
                        className="mt-0.5 size-4 accent-brand shrink-0"
                        type="checkbox"
                        checked={controls.includes(c.id)}
                        disabled={cannotSave}
                        onChange={(e) =>
                          setControls(
                            e.target.checked
                              ? [...controls, c.id]
                              : controls.filter((id) => id !== c.id),
                          )
                        }
                      />
                      <span className="min-w-0 break-words">
                        {c.code} — {c.name}
                      </span>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="px-3 py-5 text-center">
                  <ShieldCheck
                    aria-hidden="true"
                    className="text-muted mx-auto mb-2 size-6"
                    strokeWidth={1.5}
                  />
                  <p className="text-sm font-medium text-foreground">
                    No eligible controls
                  </p>
                  <p className="text-muted mt-0.5 text-xs">
                    No controls are linked to this risk yet.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Section — Accept or Actions */}
        {strategy === "accept" ? (
          <section aria-labelledby="plan-acceptance-heading" className="space-y-3">
            <div className="flex items-start gap-2 border-b border-border pb-2">
              <CheckSquare
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 text-brand"
                strokeWidth={1.8}
              />
              <div>
                <h3
                  id="plan-acceptance-heading"
                  className="text-sm font-semibold text-foreground"
                >
                  Acceptance cost justification
                </h3>
                <p className="text-xs text-muted">
                  No additional actions — existing controls and monitoring
                  continue. This is a proposal, not an approval.
                </p>
              </div>
            </div>
            <AcceptanceCostFields
              value={acceptanceCost}
              onChange={setAcceptanceCost}
            />
          </section>
        ) : (
          <section aria-labelledby="plan-actions-heading" className="space-y-3">
            <div className="flex items-start justify-between gap-2 border-b border-border pb-2">
              <div className="flex items-start gap-2">
                <CheckSquare
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0 text-brand"
                  strokeWidth={1.8}
                />
                <div>
                  <h3
                    id="plan-actions-heading"
                    className="text-sm font-semibold text-foreground"
                  >
                    Required actions
                  </h3>
                  <p className="text-xs text-muted">
                    Record the work needed to carry out the selected treatment.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="secondary"
                disabled={cannotSave}
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
                <Plus aria-hidden="true" className="size-4" strokeWidth={1.8} />
                Add action
              </Button>
            </div>
            <div className="space-y-2">
              {actions.map((action, index) => (
                <div
                  key={action.rowKey}
                  className="border-border bg-surface grid items-start gap-3 rounded-xl border p-3 md:grid-cols-[1fr_1fr_10rem_auto]"
                >
                  <Input
                    aria-label={`Action ${index + 1} title`}
                    placeholder="Action description"
                    value={action.title}
                    disabled={cannotSave}
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
                    disabled={cannotSave}
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
                    disabled={cannotSave || actions.length <= 1}
                    onClick={() =>
                      setActions(actions.filter((_, i) => i !== index))
                    }
                  >
                    <Trash2
                      aria-hidden="true"
                      className="size-4"
                      strokeWidth={1.8}
                    />
                  </Button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Info hint */}
        <div className="border-border bg-neutral-soft/30 flex gap-2.5 rounded-xl border p-3.5">
          <Info
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0 text-muted"
            strokeWidth={1.8}
          />
          <p className="text-xs text-muted">
            Creating a treatment plan moves the risk to Under treatment. An
            Accept strategy requires a separate approval step before it takes
            effect. Only one active plan is allowed per risk at a time.
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border pt-4">
          <div />
          <div className="flex items-center gap-3">
            <Button type="button" variant="secondary" onClick={close}>
              Cancel
            </Button>
            <Button type="submit" disabled={cannotSave}>
              {mutation.isPending ? (
                <>
                  <Loader2
                    aria-hidden="true"
                    className="size-4 animate-spin"
                  />
                  Creating…
                </>
              ) : (
                <>
                  <ClipboardList
                    aria-hidden="true"
                    className="size-4"
                    strokeWidth={1.8}
                  />
                  Create plan
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </Dialog>
  );
}
