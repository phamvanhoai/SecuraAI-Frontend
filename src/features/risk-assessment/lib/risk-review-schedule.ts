import { riskToday } from "../schemas/risk-review-date";

/** Review dates are stored as calendar dates (UTC midnight), not appointment instants. */
export function riskReviewSchedule(reviewDate: string | null, today = riskToday()) {
  if (!reviewDate) return { status: "unscheduled", daysOverdue: 0 } as const;
  const date = reviewDate.slice(0, 10);
  const days = Math.round(
    (Date.parse(`${today}T00:00:00Z`) - Date.parse(`${date}T00:00:00Z`)) / 86_400_000,
  );
  if (days > 0) return { status: "overdue", daysOverdue: days } as const;
  return { status: days === 0 ? "today" : "upcoming", daysOverdue: 0 } as const;
}
