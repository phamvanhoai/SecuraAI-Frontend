import { describe, expect, it } from "vitest";
import {
  loginHistoryListSchema,
  loginHistoryQuerySchema,
} from "./login-history-schema";

describe("login history boundaries", () => {
  it("uses bounded defaults and validates IPv4/IPv6 and timezone-aware timestamps", () => {
    expect(loginHistoryQuerySchema.parse({})).toEqual({
      page: 1,
      limit: 20,
      sortBy: "loginTime",
      sortOrder: "desc",
    });
    expect(
      loginHistoryQuerySchema.safeParse({
        ipAddress: "::1",
        from: "2026-09-18T00:00:00+07:00",
      }).success,
    ).toBe(true);
  });
  it.each([
    { limit: 101 },
    { page: 0 },
    { status: "active" },
    { userId: "wrong" },
    { ipAddress: "hostname" },
    { sortBy: "email" },
    { search: " " },
    { token: "private" },
    { from: "2026-09-19T00:00:00Z", to: "2026-09-18T00:00:00Z" },
  ])("rejects invalid query %j", (query) => {
    expect(loginHistoryQuerySchema.safeParse(query).success).toBe(false);
  });
  it("accepts unknown users but rejects malformed server dates and result statuses", () => {
    const item = {
      id: "11111111-1111-4111-8111-111111111111",
      userId: null,
      userName: null,
      email: "unknown@example.test",
      loginTime: "2026-09-18T08:00:00Z",
      status: "failed",
      ipAddress: null,
      userAgent: null,
      failureReason: "INVALID_CREDENTIALS",
    };
    const payload = {
      items: [item],
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
    };
    expect(loginHistoryListSchema.safeParse(payload).success).toBe(true);
    expect(
      loginHistoryListSchema.safeParse({
        ...payload,
        items: [{ ...item, loginTime: "invalid" }],
      }).success,
    ).toBe(false);
    expect(
      loginHistoryListSchema.safeParse({
        ...payload,
        items: [{ ...item, status: "active" }],
      }).success,
    ).toBe(false);
  });
});
