import { afterEach, describe, expect, it, vi } from "vitest";
import { createUser, getUserCreateOptions } from "./users";

afterEach(() => vi.restoreAllMocks());

describe("add user API", () => {
  it("loads and validates departments and roles through the BFF", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: {
            departments: [
              {
                id: "00000000-0000-4000-8000-000000000020",
                code: "SEC",
                name: "Security",
              },
            ],
            roles: [
              {
                id: "00000000-0000-4000-8000-000000000029",
                code: "ALL",
                name: "ALL",
                description: "Unrestricted aggregate role",
                isSystem: true,
              },
              {
                id: "00000000-0000-4000-8000-000000000030",
                code: "EMPLOYEE",
                name: "Employee",
                description: null,
                isSystem: true,
              },
            ],
          },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );

    const result = await getUserCreateOptions();
    expect(result.departments[0]?.name).toBe("Security");
    expect(result.roles[0]?.code).toBe("EMPLOYEE");
    expect(result.roles.some((role) => role.code === "ALL")).toBe(false);
  });

  it("sends every required account field", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: {
            id: "00000000-0000-4000-8000-000000000010",
            email: "new@example.com",
            fullName: "New User",
          },
        }),
        { status: 201, headers: { "content-type": "application/json" } },
      ),
    );

    await createUser({
      email: "new@example.com",
      fullName: "New User",
      employeeCode: "EMP-010",
      departmentId: "00000000-0000-4000-8000-000000000020",
      roleCodes: ["EMPLOYEE"],
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/users",
      expect.objectContaining({
        body: JSON.stringify({
          email: "new@example.com",
          fullName: "New User",
          employeeCode: "EMP-010",
          departmentId: "00000000-0000-4000-8000-000000000020",
          roleCodes: ["EMPLOYEE"],
        }),
      }),
    );
  });

  it("surfaces the backend conflict when email or employee code exists", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "USER_ALREADY_EXISTS",
            message: "Email or employee code already exists",
          },
        }),
        { status: 409, headers: { "content-type": "application/json" } },
      ),
    );

    await expect(
      createUser({
        email: "existing@example.com",
        fullName: "Existing User",
        employeeCode: "EMP-001",
        departmentId: "00000000-0000-4000-8000-000000000020",
        roleCodes: ["EMPLOYEE"],
      }),
    ).rejects.toMatchObject({
      status: 409,
      message: "Email or employee code already exists",
    });
  });
});
