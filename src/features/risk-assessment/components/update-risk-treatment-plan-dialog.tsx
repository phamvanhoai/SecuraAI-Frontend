"use client";
import { AcceptanceCostFields, AcceptanceCostSummary } from "./acceptance-cost-fields";
import { emptyAcceptanceCost } from "../schemas/acceptance-cost-schema";
import { useEffect, useRef, useState } from "react";
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
import { cn } from "@/lib/utils";
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

const planStatuses = ["draft", "active", "completed", "cancelled"] as const;

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
  const options = useRiskTreatmentPlanOptions(plan.riskId);
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
    if (
      draft.status === "completed" &&
      draft.strategy !== "accept" &&
      !draft.actions.some((item) => item.status === "completed")
    ) {
      setError(
        "A plan with every action cancelled must be cancelled, not completed.",
      );
      return;
    }
    const parsed = updateRiskTreatmentPlanSchema.safeParse({
      title: draft.title,
      strategy: draft.strategy,
      ownerUserId: draft.owner?.id ?? "",
      targetDate: draft.targetCompletionDate?.slice(0, 10) ?? "",
      status: draft.status,
      expectedUpdatedAt: draft.updatedAt,
      acceptanceCost:
        draft.strategy === "accept" ? draft.acceptanceCost ?? null : null,
      controlIds: draft.controls.map((item) => item.id),
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
            <span className="font-mono font-semibold text-muted">
              {plan.status.toUpperCase()}
            </span>
            <span className="text-foreground font-semibold break-words">
              {plan.title}
            </span>
          </div>
          <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 text-muted">
            <span>
              Strategy:{" "}
              <span className="font-medium capitalize">{plan.strategy}</span>
            </span>
            {plan.targetCompletionDate ? (
              <span>
                Due:{" "}
                <span className="font-medium">
                  {new Intl.DateTimeFormat("en-GB", {
                    dateStyle: "medium",
                  }).format(new Date(plan.targetCompletionDate))}
                </span>
              </span>
            ) : null}
          </div>
        </div>

        {/* Alerts */}
        {error ? (
          <Alert className="border-danger/25 bg-danger-soft text-danger">
            {error}
          </Alert>
        ) : null}

        {/* Section — Plan details */}
        <section aria-labelledby="update-plan-details-heading" className="space-y-4">
          <div className="flex items-start gap-2 border-b border-border pb-2">
            <ClipboardList
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0 text-brand"
              strokeWidth={1.8}
            />
            <div>
              <h3
                id="update-plan-details-heading"
                className="text-sm font-semibold text-foreground"
              >
                Plan details
              </h3>
              <p className="text-xs text-muted">
                Update the title, status, owner and target date for this plan.
              </p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label
                htmlFor="update-plan-title"
                className="text-sm font-medium text-foreground"
              >
                Plan title
              </label>
              <Input
                id="update-plan-title"
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="update-plan-status"
                className="text-sm font-medium text-foreground"
              >
                Plan status
              </label>
              <Select
                id="update-plan-status"
                value={draft.status}
                onChange={(e) =>
                  setDraft({ ...draft, status: e.target.value })
                }
              >
                {planStatuses.map((value) => (
                  <option
                    key={value}
                    value={value}
                    disabled={
                      (plan.status === "active" && value === "draft") ||
                      (plan.status === "draft" && value === "completed")
                    }
                  >
                    {value.charAt(0).toUpperCase() + value.slice(1)}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="update-plan-owner"
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
                id="update-plan-owner"
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
                    {u.fullName} — {u.email}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="update-plan-due-date"
                className="text-sm font-medium text-foreground"
              >
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays
                    aria-hidden="true"
                    className="size-3.5 text-muted"
                    strokeWidth={1.8}
                  />
                  Target date
                </span>
              </label>
              <Input
                id="update-plan-due-date"
                type="date"
                value={draft.targetCompletionDate?.slice(0, 10) ?? ""}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    targetCompletionDate: `${e.target.value}T00:00:00.000Z`,
                  })
                }
              />
            </div>
          </div>
        </section>

        {/* Section — Treatment strategy */}
        <section aria-labelledby="update-plan-strategy-heading" className="space-y-3">
          <div className="flex items-start gap-2 border-b border-border pb-2">
            <Target
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0 text-brand"
              strokeWidth={1.8}
            />
            <div>
              <h3
                id="update-plan-strategy-heading"
                className="text-sm font-semibold text-foreground"
              >
                Treatment strategy
              </h3>
              <p className="text-xs text-muted">
                Changing to Accept requires cancelling existing actions first.
              </p>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-4">
            {strategies.map((s) => (
              <label
                key={s.value}
                className={cn(
                  "border-border flex cursor-pointer flex-col gap-1 rounded-xl border p-3 text-sm transition-colors",
                  draft.strategy === s.value
                    ? "border-brand bg-brand/5"
                    : "bg-surface hover:bg-neutral-soft",
                )}
              >
                <input
                  type="radio"
                  className="sr-only"
                  name="update-treatment-strategy"
                  value={s.value}
                  checked={draft.strategy === s.value}
                  onChange={() => setDraft({ ...draft, strategy: s.value })}
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
        <section aria-labelledby="update-plan-controls-heading" className="space-y-3">
          <div className="flex items-start gap-2 border-b border-border pb-2">
            <ShieldCheck
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0 text-brand"
              strokeWidth={1.8}
            />
            <div>
              <h3
                id="update-plan-controls-heading"
                className="text-sm font-semibold text-foreground"
              >
                Controls addressed by this plan
                <span className="text-muted ml-1.5 text-xs font-normal">
                  (optional)
                </span>
              </h3>
              <p className="text-xs text-muted">
                Only controls already linked to this risk are available.
                Existing selections cannot be removed after the plan is active.
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
                  {options.data.controls.map((control) => {
                    const checked = draft.controls.some(
                      (item) => item.id === control.id,
                    );
                    const locked =
                      plan.status === "active" &&
                      plan.controls.some((item) => item.id === control.id);
                    return (
                      <label
                        key={control.id}
                        className={cn(
                          "flex min-h-11 cursor-pointer items-start gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                          checked
                            ? "bg-brand/5 border border-brand"
                            : "hover:bg-neutral-soft",
                          locked && "cursor-not-allowed opacity-70",
                        )}
                      >
                        <input
                          className="mt-0.5 size-4 accent-brand shrink-0"
                          type="checkbox"
                          checked={checked}
                          disabled={locked}
                          onChange={(event) =>
                            setDraft({
                              ...draft,
                              controls: event.target.checked
                                ? [
                                    ...draft.controls,
                                    {
                                      id: control.id,
                                      code: control.code,
                                      name: control.name,
                                    },
                                  ]
                                : draft.controls.filter(
                                    (item) => item.id !== control.id,
                                  ),
                            })
                          }
                        />
                        <span className="min-w-0 break-words">
                          {control.code} — {control.name}
                          {locked ? (
                            <span className="text-muted block text-xs">
                              Locked while plan is active
                            </span>
                          ) : null}
                        </span>
                      </label>
                    );
                  })}
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

        {/* Section — Acceptance cost (Accept strategy) */}
        {draft.strategy === "accept" ? (
          <section aria-labelledby="update-plan-acceptance-heading" className="space-y-3">
            <div className="flex items-start gap-2 border-b border-border pb-2">
              <CheckSquare
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 text-brand"
                strokeWidth={1.8}
              />
              <div>
                <h3
                  id="update-plan-acceptance-heading"
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
            {draft.status === "cancelled" ? (
              <AcceptanceCostSummary value={draft.acceptanceCost} />
            ) : (
              <AcceptanceCostFields
                value={draft.acceptanceCost ?? emptyAcceptanceCost}
                onChange={(acceptanceCost) =>
                  setDraft({ ...draft, acceptanceCost })
                }
              />
            )}
          </section>
        ) : null}

        {/* Section — Treatment actions */}
        {draft.strategy !== "accept" || draft.actions.length > 0 ? (
          <section aria-labelledby="update-plan-actions-heading" className="space-y-3">
            <div className="flex items-start justify-between gap-2 border-b border-border pb-2">
              <div className="flex items-start gap-2">
                <CheckSquare
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0 text-brand"
                  strokeWidth={1.8}
                />
                <div>
                  <h3
                    id="update-plan-actions-heading"
                    className="text-sm font-semibold text-foreground"
                  >
                    Treatment actions
                  </h3>
                  <p className="text-xs text-muted">
                    {draft.strategy === "accept"
                      ? "Cancel existing actions explicitly before changing to Accept. Completed actions remain immutable."
                      : "Pending = 0%, in progress = 50%, completed = 100%."}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="secondary"
                disabled={draft.strategy === "accept"}
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
                <Plus aria-hidden="true" className="size-4" strokeWidth={1.8} />
                Add action
              </Button>
            </div>
            <div className="space-y-2">
              {draft.actions.map((action, index) => {
                const savedStatus = plan.actions.find(
                  (saved) => saved.id === action.id,
                )?.status;
                const isTerminal = ["completed", "cancelled"].includes(
                  savedStatus ?? "",
                );
                return (
                  <div
                    key={action.id ?? `new-${index}`}
                    className="border-border bg-surface grid items-start gap-3 rounded-xl border p-3 md:grid-cols-[1fr_1fr_10rem_10rem_auto]"
                  >
                    <Input
                      disabled={isTerminal}
                      aria-label={`Action ${index + 1} title`}
                      value={action.title}
                      onChange={(e) =>
                        changeAction(index, { title: e.target.value })
                      }
                    />
                    <Select
                      disabled={isTerminal}
                      aria-label={`Action ${index + 1} owner`}
                      value={action.assignedToUserId ?? ""}
                      onChange={(e) =>
                        changeAction(index, {
                          assignedToUserId: e.target.value,
                        })
                      }
                    >
                      <option value="">Assign owner</option>
                      {options.data?.users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.fullName} — {u.email}
                        </option>
                      ))}
                    </Select>
                    <Input
                      disabled={isTerminal}
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
                      disabled={isTerminal}
                      aria-label={`Action ${index + 1} progress`}
                      value={action.status}
                      onChange={(e) =>
                        changeAction(index, {
                          status: e.target.value as typeof action.status,
                        })
                      }
                    >
                      <option
                        value="pending"
                        disabled={savedStatus === "in_progress"}
                      >
                        0% Pending
                      </option>
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
                              saved.id === action.id &&
                              saved.status !== "pending",
                          ),
                      )}
                      onClick={() =>
                        setDraft({
                          ...draft,
                          actions: draft.actions.filter((_, i) => i !== index),
                        })
                      }
                    >
                      <Trash2
                        aria-hidden="true"
                        className="size-4"
                        strokeWidth={1.8}
                      />
                    </Button>
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}

        {/* Info hint */}
        <div className="border-border bg-neutral-soft/30 flex gap-2.5 rounded-xl border p-3.5">
          <Info
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0 text-muted"
            strokeWidth={1.8}
          />
          <p className="text-xs text-muted">
            Completed and cancelled actions are immutable. Marking the plan
            Completed requires at least one completed action. Stale edits
            (409) will be flagged — reopen the plan to retry.
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border pt-4">
          <div />
          <div className="flex items-center gap-3">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? (
                <>
                  <Loader2
                    aria-hidden="true"
                    className="size-4 animate-spin"
                  />
                  Saving…
                </>
              ) : (
                <>
                  <ClipboardList
                    aria-hidden="true"
                    className="size-4"
                    strokeWidth={1.8}
                  />
                  Save changes
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </Dialog>
  );
}
