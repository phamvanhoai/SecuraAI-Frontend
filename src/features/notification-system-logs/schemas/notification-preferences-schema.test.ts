import { describe, expect, it } from "vitest";
import { updateNotificationPreferencesInputSchema } from "./notification-preferences-schema";

describe("notification preferences contract", () => {
  it("accepts a supported selection", () => {
    expect(
      updateNotificationPreferencesInputSchema.parse({
        channels: { inSystem: true, email: false },
      }),
    ).toEqual({ channels: { inSystem: true, email: false } });
  });

  it("requires at least one channel", () => {
    expect(
      updateNotificationPreferencesInputSchema.safeParse({
        channels: { inSystem: false, email: false },
      }).success,
    ).toBe(false);
  });
});
