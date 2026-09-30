import { afterEach, describe, expect, it, vi } from "vitest";
import { assignUserAccess, getAccessAssignmentOptions } from "./assign-user-roles";

afterEach(() => vi.restoreAllMocks());

describe("user access assignment API", () => {
  it("loads role, scope, and ownership options", async () => {
    const options = {
      roles: [{ code: "EMPLOYEE", name: "Employee" }],
      scopeCodes: [{ code: "AUDIT_VIEW", name: "View audit information" }], targetTypes: ["GLOBAL", "BUSINESS_SERVICE", "ASSET"],
      businessServices: [], assets: [],
    };
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(
      JSON.stringify({ success: true, data: options }),
      { status: 200, headers: { "content-type": "application/json" } },
    ));
    await expect(getAccessAssignmentOptions()).resolves.toEqual(options);
    expect(fetchMock).toHaveBeenCalledWith("/api/users/access-assignment-options", expect.objectContaining({ method: "GET" }));
  });

  it("replaces the complete access assignment", async () => {
    const result = { changed: true, role: "EXECUTIVE", scopeCount: 1 };
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(
      JSON.stringify({ success: true, data: result }),
      { status: 200, headers: { "content-type": "application/json" } },
    ));
    const id = "00000000-0000-4000-8000-000000000010";
    const payload = { role: "EXECUTIVE" as const, scopes: [{ scopeCode: "AUDIT_VIEW", targetType: "GLOBAL" as const, expiresAt: null }] };
    await expect(assignUserAccess(id, payload)).resolves.toEqual(result);
    expect(fetchMock).toHaveBeenCalledWith(`/api/users/${id}/access-assignment`, expect.objectContaining({ method: "PUT", body: JSON.stringify(payload) }));
  });
});
