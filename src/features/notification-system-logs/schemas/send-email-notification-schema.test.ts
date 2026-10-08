import { describe, expect, it } from "vitest";
import {
  sendEmailNotificationInputSchema,
  sentEmailNotificationSchema,
} from "./send-email-notification-schema";

describe("send email notification contract", () => {
  it("accepts a bounded recipient list and delivery result", () => {
    const id = "11111111-1111-4111-8111-111111111111";
    expect(
      sendEmailNotificationInputSchema.safeParse({
        subject: "Review required",
        message: "Review the latest finding.",
        userIds: [id],
      }).success,
    ).toBe(true);
    expect(
      sentEmailNotificationSchema.safeParse({
        id,
        recipientCount: 1,
        sentCount: 1,
        failedCount: 0,
        queuedAt: "2026-10-08T06:00:00.000Z",
      }).success,
    ).toBe(true);
  });

  it("rejects an empty recipient list", () => {
    expect(
      sendEmailNotificationInputSchema.safeParse({
        subject: "Review required",
        message: "Review the latest finding.",
        userIds: [],
      }).success,
    ).toBe(false);
  });
});
