"use client";

import { useId, useState } from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { acceptanceCostSchema, type AcceptanceCost } from "../schemas/acceptance-cost-schema";

export function AcceptanceCostFields({ value, onChange }: { value: AcceptanceCost; onChange: (value: AcceptanceCost) => void }) {
  const prefix = useId();
  const [visited, setVisited] = useState<Partial<Record<keyof AcceptanceCost, boolean>>>({});
  const result = acceptanceCostSchema.safeParse(value);
  const error = (field: keyof AcceptanceCost) => visited[field] && !result.success ? result.error.issues.find((issue) => issue.path[0] === field)?.message : undefined;
  const validation = (field: keyof AcceptanceCost) => ({
    onBlur: () => setVisited((prior) => ({ ...prior, [field]: true })),
    "aria-invalid": Boolean(error(field)),
    "aria-describedby": error(field) ? `${prefix}-${field}-error` : undefined,
  });
  const feedback = (field: keyof AcceptanceCost) => error(field) ? <p id={`${prefix}-${field}-error`} className="text-danger text-sm" role="alert">{error(field)}</p> : null;
  return <fieldset className="border-border space-y-4 rounded-lg border p-4">
    <legend className="px-1 font-semibold">Acceptance cost justification</legend>
    <p className="text-muted text-sm">No additional treatment action (không làm gì thêm). Existing controls and monitoring continue. This is a proposal, not approval.</p>
    <p className="text-muted text-sm">Compare the total cost to fix and total expected loss over the same period, in the same currency. Include one-time and operating costs in the estimate. These figures do not automatically authorize acceptance.</p>
    <div className="grid gap-4 sm:grid-cols-2">
      <div><label className="space-y-1 text-sm font-medium">Cost to fix *<Input {...validation("costToFix")} value={value.costToFix} inputMode="decimal" maxLength={15} required pattern="(0|[1-9][0-9]{0,11})(\.[0-9]{1,2})?" onChange={(e) => onChange({ ...value, costToFix: e.target.value })} /></label>{feedback("costToFix")}</div>
      <div><label className="space-y-1 text-sm font-medium">Expected loss *<Input {...validation("expectedLoss")} value={value.expectedLoss} inputMode="decimal" maxLength={15} required pattern="(0|[1-9][0-9]{0,11})(\.[0-9]{1,2})?" onChange={(e) => onChange({ ...value, expectedLoss: e.target.value })} /></label>{feedback("expectedLoss")}</div>
      <label className="space-y-1 text-sm font-medium">Currency *<Select value={value.currency} onChange={(e) => onChange({ ...value, currency: e.target.value === "USD" ? "USD" : "VND" })}><option value="VND">VND</option><option value="USD">USD</option></Select></label>
      <div><label className="space-y-1 text-sm font-medium">Comparison period (months) *<Input {...validation("periodMonths")} type="number" min={1} max={120} step={1} required value={value.periodMonths || ""} onChange={(e) => onChange({ ...value, periodMonths: Number(e.target.value) })} /></label>{feedback("periodMonths")}</div>
    </div>
    <div><label className="block space-y-1 text-sm font-medium">Estimation basis and acceptance rationale *<Textarea {...validation("basis")} value={value.basis} minLength={10} maxLength={2000} required rows={3} onChange={(e) => onChange({ ...value, basis: e.target.value })} /></label>{feedback("basis")}</div>
    <p className="text-muted text-xs">Use whole VND amounts, or up to two decimal places for USD. Enter numbers without grouping separators. Expected loss is an estimate, not a guaranteed outcome.</p>
  </fieldset>;
}

export function AcceptanceCostSummary({ value }: { value: AcceptanceCost | null | undefined }) {
  if (!value) return <p className="text-warning text-sm">Acceptance cost justification not recorded. Update the eligible plan before submitting a new acceptance.</p>;
  const display = (amount: string) => `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(Number(amount))} ${value.currency}`;
  return <section aria-label="Acceptance cost justification" className="border-border space-y-2 rounded-lg border p-3 text-sm">
    <p className="font-medium">No additional treatment action — acceptance requires approval.</p>
    <dl className="grid gap-2 sm:grid-cols-2"><div><dt className="text-muted">Cost to fix</dt><dd>{display(value.costToFix)}</dd></div><div><dt className="text-muted">Expected loss</dt><dd>{display(value.expectedLoss)}</dd></div></dl>
    <p>Comparison period: {value.periodMonths} months (same currency and period).</p>
    <p className="whitespace-pre-wrap wrap-anywhere">{value.basis}</p>
    <p className="text-muted">Financial estimates support the decision; they do not automatically approve it.</p>
  </section>;
}
