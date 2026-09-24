import { describe, expect, it } from "vitest";
import { logSourceFormSchema } from "./log-source-schema";

describe("logSourceFormSchema", () => {
  it("accepts a valid log source configuration", () => {
    expect(
      logSourceFormSchema.parse({
        name: "Core firewall",
        sourceType: "firewall",
        status: "active",
        format: "syslog",
        timezone: "UTC",
        collectRawPayload: true,
      }),
    ).toMatchObject({ name: "Core firewall", format: "syslog" });
  });

  it("rejects an out-of-range polling interval", () => {
    expect(
      logSourceFormSchema.safeParse({
        name: "Source",
        sourceType: "system",
        status: "active",
        format: "json",
        timezone: "UTC",
        collectRawPayload: false,
        pollingIntervalSeconds: 0,
      }).success,
    ).toBe(false);
  });
});
