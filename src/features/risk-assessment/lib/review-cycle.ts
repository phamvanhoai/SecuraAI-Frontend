export function recommendedReviewDate(today: string, rating: string): string | null {
  const months: Record<string, number> = { critical: 1, high: 3, medium: 6, low: 12 };
  const count = months[rating];
  if (!count) return null;
  const date = new Date(`${today}T00:00:00Z`);
  const day = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + count);
  const last = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  date.setUTCDate(Math.min(day, last));
  return date.toISOString().slice(0, 10);
}
