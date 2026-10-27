import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { RiskReviewDate } from "./risk-review-date";
beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date("2026-10-27T10:00:00Z")); });
afterEach(() => { cleanup(); vi.useRealTimers(); });
it("keeps the date visible with the overdue status", () => {
  render(<RiskReviewDate value="2026-10-16T00:00:00Z" />);
  expect(screen.getByText("16/10/2026")).toBeVisible();
  expect(screen.getByText("Overdue — 11 days")).toBeVisible();
});
it("renders today, upcoming and unscheduled distinctly", () => {
  const { rerender } = render(<RiskReviewDate value="2026-10-27T00:00:00Z" />);
  expect(screen.getByText("Due today")).toBeVisible();
  rerender(<RiskReviewDate value="2026-10-28T00:00:00Z" />);
  expect(screen.queryByText("Due today")).not.toBeInTheDocument();
  expect(screen.getByText("28/10/2026")).toBeVisible();
  rerender(<RiskReviewDate value={null} />);
  expect(screen.getByText("Not scheduled")).toBeVisible();
});
it("refreshes the status while the page remains open across midnight", () => {
  vi.setSystemTime(new Date("2026-10-27T16:59:50Z"));
  render(<RiskReviewDate value="2026-10-27T00:00:00Z" />);
  expect(screen.getByText("Due today")).toBeVisible();
  act(() => { vi.advanceTimersByTime(30_000); });
  expect(screen.getByText("Overdue — 1 day")).toBeVisible();
});
