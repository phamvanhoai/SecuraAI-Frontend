import { describe, expect, it } from "vitest";
import {
  trainingReminderListSchema,
  trainingReminderSchema,
} from "./reminder-schema";

const reminder = {
  notificationId: "00000000-0000-5000-8000-000000000001",
  enrollmentId: "00000000-0000-4000-8000-000000000002",
  title: "Training deadline approaching",
  message: "Complete your assigned course",
  isRead: false,
  createdAt: "2026-09-16T01:00:00.000Z",
  readAt: null,
};
describe("training reminder boundary", () => {
  it("accepts the real inbox and read responses", () => {
    expect(trainingReminderSchema.safeParse(reminder).success).toBe(true);
    expect(
      trainingReminderListSchema.safeParse({
        items: [reminder],
        summary: { total: 4, unread: 2 },
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      }).success,
    ).toBe(true);
  });
  it("rejects invalid IDs, timestamps, boolean flags and pagination", () => {
    expect(
      trainingReminderSchema.safeParse({ ...reminder, isRead: "false" })
        .success,
    ).toBe(false);
    expect(
      trainingReminderSchema.safeParse({
        ...reminder,
        notificationId: "invalid",
      }).success,
    ).toBe(false);
    expect(
      trainingReminderSchema.safeParse({ ...reminder, createdAt: "yesterday" })
        .success,
    ).toBe(false);
    expect(
      trainingReminderListSchema.safeParse({
        items: [],
        summary: { total: -1, unread: 0 },
        pagination: { page: 1, limit: 1000, total: -1, totalPages: 0 },
      }).success,
    ).toBe(false);
  });
});
