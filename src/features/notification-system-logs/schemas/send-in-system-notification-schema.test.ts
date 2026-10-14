import { describe, expect, it } from "vitest";
import {
  sendInSystemNotificationInputSchema,
  sentInSystemNotificationSchema,
} from "./send-in-system-notification-schema";

describe("send in-system notification contract", () => {
  it("accepts a bounded role audience", () => {
    expect(
      sendInSystemNotificationInputSchema.safeParse({
        title: "Review required",
        message: "Review the latest finding.",
        priority: "IMPORTANT",
        audience: { type: "roles", roles: ["SECURITY_OFFICER"] },
      }).success,
    ).toBe(true);
  });

  it("rejects empty audiences and unsupported priorities", () => {
    expect(
      sendInSystemNotificationInputSchema.safeParse({
        title: "Review required",
        message: "Review the latest finding.",
        priority: "HIGH",
        audience: { type: "users", userIds: [] },
      }).success,
    ).toBe(false);
  });

  it("validates the backend result", () => {
    expect(
      sentInSystemNotificationSchema.safeParse({
        id: "11111111-1111-4111-8111-111111111111",
        recipientCount: 2,
        sentAt: "2026-10-08T06:00:00.000Z",
      }).success,
    ).toBe(true);
  });
});
