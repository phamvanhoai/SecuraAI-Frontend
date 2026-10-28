import { describe, expect, it } from "vitest";
import { riskReviewSchedule } from "./risk-review-schedule";
import { riskToday } from "../schemas/risk-review-date";

describe("Vietnam review calendar", () => {
  it("counts an October 16 deadline as 11 days overdue on October 27", () => {
    expect(riskReviewSchedule("2026-10-16T00:00:00Z", "2026-10-27")).toEqual({ status: "overdue", daysOverdue: 11 });
  });
  it("changes at Vietnam midnight even while the UTC date remains unchanged", () => {
    const deadline = "2026-10-27T00:00:00Z";
    expect(riskReviewSchedule(deadline, riskToday(new Date("2026-10-27T16:59:59Z"))).status).toBe("today");
    expect(riskReviewSchedule(deadline, riskToday(new Date("2026-10-27T17:00:00Z")))).toEqual({ status: "overdue", daysOverdue: 1 });
  });
  it("handles missing dates, upcoming dates and leap/year boundaries", () => {
    expect(riskReviewSchedule(null, "2026-10-27").status).toBe("unscheduled");
    expect(riskReviewSchedule("2026-10-28T00:00:00Z", "2026-10-27").status).toBe("upcoming");
    expect(riskReviewSchedule("2028-02-28T00:00:00Z", "2028-03-01").daysOverdue).toBe(2);
    expect(riskReviewSchedule("2026-12-31T00:00:00Z", "2027-01-01").daysOverdue).toBe(1);
  });
});
