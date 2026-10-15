/** Risk review dates are calendar dates in the application's UTC+7 timezone. */
export function riskToday(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (type: string) =>
    parts.find((value) => value.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function nextRiskReviewDate(now = new Date()): string {
  const date = new Date(`${riskToday(now)}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

export function reviewDatePreview(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return "DD/MM/YYYY";
  return `${value.slice(8, 10)}/${value.slice(5, 7)}/${value.slice(0, 4)}`;
}
