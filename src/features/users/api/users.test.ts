import { afterEach, describe, expect, it, vi } from "vitest";
import { getUser, listUsers } from "./users";

const userId = "00000000-0000-4000-8000-000000000010";

afterEach(() => vi.restoreAllMocks());

describe("getUser", () => {
  it("loads and validates user details through the same-origin BFF", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: {
            id: userId,
            email: "analyst@example.com",
            fullName: "Security Analyst",
            phone: null,
            employeeCode: "SEC-010",
            avatarUrl: null,
            status: "active",
            mustChangePassword: false,
            emailVerifiedAt: null,
            lastLoginAt: null,
            disabledAt: null,
            department: null,
            roles: [],
            createdAt: "2026-08-01T00:00:00.000Z",
            updatedAt: "2026-09-19T00:00:00.000Z",
          },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );

    const result = await getUser(userId);

    expect(result.fullName).toBe("Security Analyst");
    expect(fetchMock).toHaveBeenCalledWith(
      `/api/users/${userId}`,
      expect.objectContaining({ method: "GET", credentials: "include" }),
    );
  });

  it("rejects an invalid backend contract", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: { id: "invalid" } }), {
        status: 200,
      }),
    );

    await expect(getUser(userId)).rejects.toMatchObject({ status: 502 });
  });
});

describe("listUsers", () => {
  it("forwards search and filters and preserves employee data", async () => {
    const departmentId = "00000000-0000-4000-8000-000000000020";
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: {
            items: [
              {
                id: userId,
                email: "employee@example.com",
                fullName: "Employee Test",
                employeeCode: "DEV-EMP-001",
                status: "active",
                department: {
                  id: departmentId,
                  code: "IT",
                  name: "Information Technology",
                },
                roles: [{ code: "EMPLOYEE", name: "Employee" }],
              },
            ],
            pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
            summary: { active: 1, inactive: 0, disabled: 0 },
          },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );

    const result = await listUsers({
      page: 1,
      limit: 20,
      q: "employee",
      departmentId,
      roleCode: "EMPLOYEE",
      status: "active",
    });

    expect(result.items[0]).toMatchObject({
      employeeCode: "DEV-EMP-001",
      department: { id: departmentId, name: "Information Technology" },
    });
    expect(fetchMock).toHaveBeenCalledOnce();
    const requestedUrl = String(fetchMock.mock.calls[0]?.[0]);
    expect(requestedUrl).toContain("q=employee");
    expect(requestedUrl).toContain(`departmentId=${departmentId}`);
    expect(requestedUrl).toContain("roleCode=EMPLOYEE");
    expect(requestedUrl).toContain("status=active");
  });
});
