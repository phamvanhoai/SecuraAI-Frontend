import { describe, expect, it } from "vitest";
import {
  decideMfaRecoverySchema,
  mfaRecoveryListSchema,
} from "./mfa-recovery-schema";

describe("MFA recovery schemas", () => {
  it("accepts the backend list contract and converts dates", () => {
    const result = mfaRecoveryListSchema.parse({
      items: [
        {
          id: "00000000-0000-4000-8000-000000000001",
          status: "pending",
          submittedAt: "2026-09-16T01:00:00.000Z",
          completedAt: null,
          user: {
            id: "00000000-0000-4000-8000-000000000002",
            email: "user@example.com",
            fullName: "Example User",
          },
          decision: null,
        },
      ],
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
    });
    expect(result.items[0]?.submittedAt).toBeInstanceOf(Date);
  });

  it("requires an auditable decision reason", () => {
    expect(
      decideMfaRecoverySchema.safeParse({ reason: "too short" }).success,
    ).toBe(false);
    expect(
      decideMfaRecoverySchema.safeParse({
        reason: "Identity was verified by the administrator.",
      }).success,
    ).toBe(true);
  });
});
