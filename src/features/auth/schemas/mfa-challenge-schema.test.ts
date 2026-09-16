import { describe, expect, it } from "vitest";
import { mfaChallengeSchema } from "./mfa-challenge-schema";

describe("mfaChallengeSchema", () => {
  it("accepts exactly six digits", () => {
    expect(mfaChallengeSchema.safeParse({ code: "123456" }).success).toBe(true);
  });

  it("accepts a recovery code", () => {
    expect(
      mfaChallengeSchema.safeParse({ code: "AB12-CD34-EF56" }).success,
    ).toBe(true);
  });

  it.each(["12345", "1234567", "12a456", "AB12-CD34", ""])(
    'rejects "%s"',
    (code) => {
      expect(mfaChallengeSchema.safeParse({ code }).success).toBe(false);
    },
  );
});
