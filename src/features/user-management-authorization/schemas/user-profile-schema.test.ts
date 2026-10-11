import { describe, expect, it } from "vitest";
import { createUserSchema, updateUserSchema } from "./user-schema";

describe("user profile form validation", () => {
  it("rejects malformed phone numbers and employee codes", () => {
    const result = createUserSchema.safeParse({
      email: "user@example.com",
      fullName: "Test User",
      phone: "phone-number",
      employeeCode: "EMP 001",
      departmentId: "",
      role: "EMPLOYEE",
    });
    expect(result.success).toBe(false);
  });

  it("accepts an editable database status", () => {
    const result = updateUserSchema.safeParse({
      fullName: "Test User",
      phone: "0901234567",
      employeeCode: "EMP-001",
      departmentId: "",
      status: "locked",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a phone that is not exactly ten digits and a non-letter name", () => {
    const result = updateUserSchema.safeParse({
      fullName: "Test User 01",
      phone: "090 123 4567",
      employeeCode: "EMP-001",
      departmentId: "",
      status: "active",
    });
    expect(result.success).toBe(false);
  });
});
