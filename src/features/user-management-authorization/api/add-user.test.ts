import { afterEach, describe, expect, it, vi } from "vitest";
import { createUser } from "./users";

afterEach(() => vi.restoreAllMocks());

describe("add user API", () => {
  it("sends the V2 account fields", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: {
            id: "00000000-0000-4000-8000-000000000010",
            email: "new@example.com",
            fullName: "New User",
            username: "new-12345678",
            role: "EXECUTIVE",
            status: "ACTIVE",
          },
        }),
        { status: 201, headers: { "content-type": "application/json" } },
      ),
    );

    await createUser({
      email: "new@example.com",
      fullName: "New User",
      role: "EXECUTIVE",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/users",
      expect.objectContaining({
        body: JSON.stringify({
          email: "new@example.com",
          fullName: "New User",
          role: "EXECUTIVE",
        }),
      }),
    );
  });

  it("surfaces the backend conflict when email exists", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "USER_ALREADY_EXISTS",
            message: "A user with this email already exists",
          },
        }),
        { status: 409, headers: { "content-type": "application/json" } },
      ),
    );

    await expect(
      createUser({
        email: "existing@example.com",
        fullName: "Existing User",
        role: "EMPLOYEE",
      }),
    ).rejects.toMatchObject({
      status: 409,
      message: "A user with this email already exists",
    });
  });
});
