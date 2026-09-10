import { describe, expect, it } from "vitest";
import { roleFormSchema, roleListSchema } from "./role-schema";

const permissionId = "11111111-1111-4111-8111-111111111111";
const roleId = "22222222-2222-4222-8222-222222222222";

describe("role schemas", () => {
  it("accepts the backend role-list contract", () => {
    const result = roleListSchema.parse({
      items: [
        {
          id: roleId,
          code: "ADMIN",
          name: "Administrator",
          description: null,
          isSystem: true,
          permissions: [
            {
              id: permissionId,
              code: "roles.read",
              module: "access-control",
              action: "read",
              description: null,
            },
          ],
          assignedUserCount: 1,
          workflowStepCount: 0,
          createdAt: "2026-09-10T00:00:00.000Z",
          updatedAt: "2026-09-10T00:00:00.000Z",
        },
      ],
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
    });

    expect(result.items[0]?.permissions[0]?.code).toBe("roles.read");
  });

  it("enforces the backend role input boundaries", () => {
    expect(
      roleFormSchema.safeParse({
        code: "risk reviewer",
        name: "Risk Reviewer",
        description: "",
        permissionIds: [],
      }).success,
    ).toBe(false);
    expect(
      roleFormSchema.parse({
        code: " RISK_REVIEWER ",
        name: " Risk Reviewer ",
        description: " Reviews risks ",
        permissionIds: [permissionId],
      }),
    ).toEqual({
      code: "RISK_REVIEWER",
      name: "Risk Reviewer",
      description: "Reviews risks",
      permissionIds: [permissionId],
    });
  });
});
