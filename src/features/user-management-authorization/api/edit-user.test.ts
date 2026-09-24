import { afterEach, describe, expect, it, vi } from "vitest";
import { updateUser } from "./users";

afterEach(() => vi.restoreAllMocks());

describe("edit user API", () => {
  it("sends editable fields and maps empty optional values to null", async () => {
    const response = {
      id: "00000000-0000-4000-8000-000000000010",
      email: "analyst@example.com",
      fullName: "Updated Analyst",
      phone: null,
      employeeCode: null,
      avatarUrl: null,
      status: "active",
      mustChangePassword: false,
      emailVerifiedAt: null,
      lastLoginAt: null,
      lastLockedAt: null,
      disabledAt: null,
      mfaEnabled: false,
      department: null,
      roles: [],
      createdAt: "2026-08-01T00:00:00.000Z",
      updatedAt: "2026-09-21T00:00:00.000Z",
    };
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: response }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    await expect(
      updateUser(response.id, {
        fullName: "Updated Analyst",
        phone: "",
        employeeCode: "",
        departmentId: "",
      }),
    ).resolves.toEqual(response);
    expect(fetchMock).toHaveBeenCalledWith(
      `/api/users/${response.id}`,
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({
          fullName: "Updated Analyst",
          phone: null,
          employeeCode: null,
          departmentId: null,
        }),
      }),
    );
  });
});
