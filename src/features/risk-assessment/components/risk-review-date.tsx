"use client";

import { useSyncExternalStore } from "react";
import { StatusBadge } from "@/components/data-display/static-product";
import { riskReviewSchedule } from "../lib/risk-review-schedule";
import { reviewDatePreview, riskToday } from "../schemas/risk-review-date";

function subscribe(onChange: () => void) {
  const timer = window.setInterval(onChange, 30_000);
  window.addEventListener("focus", onChange);
  document.addEventListener("visibilitychange", onChange);
  return () => {
    window.clearInterval(timer);
    window.removeEventListener("focus", onChange);
    document.removeEventListener("visibilitychange", onChange);
  };
}
const getToday = () => riskToday();
const serverToday = () => null;

export function RiskReviewDate({ value }: { value: string | null }) {
  // Server markup shows the date only; browser hydration adds the current Vietnam-day status.
  const today = useSyncExternalStore(subscribe, getToday, serverToday);
  if (!value) return <span className="text-muted">Not scheduled</span>;
  const date = value.slice(0, 10);
  const schedule = today ? riskReviewSchedule(value, today) : null;
  return (
    <span className="flex flex-col items-start gap-1" title="Review schedule — Vietnam time (UTC+7)">
      <time dateTime={date} className="tabular-nums">{reviewDatePreview(date)}</time>
      {schedule?.status === "today" ? <StatusBadge tone="warning">Due today</StatusBadge> : null}
      {schedule?.status === "overdue" ? (
        <StatusBadge tone="danger">Overdue — {schedule.daysOverdue} {schedule.daysOverdue === 1 ? "day" : "days"}</StatusBadge>
      ) : null}
    </span>
  );
}
