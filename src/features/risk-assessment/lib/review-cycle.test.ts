import { expect, it } from "vitest";
import { recommendedReviewDate } from "./review-cycle";
it.each([
  ['2026-10-27', 'critical', '2026-11-27'], ['2026-10-27', 'high', '2027-01-27'],
  ['2026-10-27', 'medium', '2027-04-27'], ['2026-10-27', 'low', '2027-10-27'],
  ['2026-01-31', 'critical', '2026-02-28'], ['2028-01-31', 'critical', '2028-02-29'],
  ['2028-02-29', 'low', '2029-02-28'],
])('suggests bounded calendar deadline %s %s', (today, rating, expected) => {
  expect(recommendedReviewDate(today, rating)).toBe(expected);
});
