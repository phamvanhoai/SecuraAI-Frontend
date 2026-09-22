import { afterEach, describe, expect, it, vi } from "vitest";
import { assignUserRoles, listAssignableRoles } from "./assign-user-roles";

afterEach(() => vi.restoreAllMocks());

describe("assign user roles API", () => {
  it("loads the assignable role catalog", async () => {
    const roles = [{ code: "EMPLOYEE", name: "Employee", description: null, isSystem: true }];
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(
      JSON.stringify({ success: true, data: roles }),
      { status: 200, headers: { "content-type": "application/json" } },
    ));
    await expect(listAssignableRoles()).resolves.toEqual(roles);
    expect(fetchMock).toHaveBeenCalledWith("/api/users/assignable-roles", expect.objectContaining({ method: "GET" }));
  });

  it("sends only role codes to the dedicated endpoint", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(
      JSON.stringify({ success: true, data: { assignedRoleCodes: ["EMPLOYEE"], changed: true } }),
      { status: 200, headers: { "content-type": "application/json" } },
    ));
    const id = "00000000-0000-4000-8000-000000000010";
    await expect(assignUserRoles(id, ["EMPLOYEE"])).resolves.toEqual({ assignedRoleCodes: ["EMPLOYEE"], changed: true });
    expect(fetchMock).toHaveBeenCalledWith(`/api/users/${id}/roles`, expect.objectContaining({
      method: "POST", body: JSON.stringify({ roleCodes: ["EMPLOYEE"] }),
    }));
  });
});
