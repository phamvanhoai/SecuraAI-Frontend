import { describe, expect, it } from "vitest";
import {
  accountLockBodySchema,
  accountLockParamsSchema,
  accountLockResultSchema,
} from "./account-lock-schema";

describe("account lock boundaries", () => {
  it("matches backend NFKC normalization and trimmed 10–1000 character reasons", () => {
    expect(
      accountLockBodySchema.parse({
        reason: "  Ｓｅｃｕｒｉｔｙ investigation  ",
      }),
    ).toEqual({ reason: "Security investigation" });
    for (const reason of [
      "",
      "         ",
      "123456789",
      "a".repeat(1001),
      null,
      12,
    ]) {
      expect(accountLockBodySchema.safeParse({ reason }).success).toBe(false);
    }
    expect(
      accountLockBodySchema.safeParse({ reason: "a".repeat(10) }).success,
    ).toBe(true);
    expect(
      accountLockBodySchema.safeParse({ reason: "a".repeat(1000) }).success,
    ).toBe(true);
    expect(
      accountLockBodySchema.safeParse({
        reason: "Security investigation",
        status: "active",
      }).success,
    ).toBe(false);
  });

  it("allows only UUID targets and the two implemented actions", () => {
    expect(
      accountLockParamsSchema.safeParse({ userId: "bad-id", action: "lock" })
        .success,
    ).toBe(false);
    expect(
      accountLockParamsSchema.safeParse({
        userId: "00000000-0000-4000-8000-000000000001",
        action: "delete",
      }).success,
    ).toBe(false);
  });

  it("accepts idempotent unlocks retaining the historical last lock time", () => {
    expect(
      accountLockResultSchema.safeParse({
        id: "00000000-0000-4000-8000-000000000001",
        status: "active",
        lastLockedAt: "2026-09-17T08:00:00.000Z",
        updatedAt: "2026-09-17T09:00:00.000Z",
        changed: false,
      }).success,
    ).toBe(true);
    expect(
      accountLockResultSchema.safeParse({
        id: "bad-id",
        status: "disabled",
        changed: "true",
      }).success,
    ).toBe(false);
  });
});
