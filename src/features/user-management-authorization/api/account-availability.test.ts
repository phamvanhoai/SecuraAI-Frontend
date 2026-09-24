import { afterEach, describe, expect, it, vi } from "vitest";
import { changeAccountAvailability } from "./account-availability";

afterEach(() => vi.restoreAllMocks());

const userId = "00000000-0000-4000-8000-000000000010";
const response = (action: "deactivate" | "remove") => ({
  id: userId,
  status: action === "deactivate" ? "disabled" : "active",
  disabledAt: action === "deactivate" ? "2026-09-22T00:00:00.000Z" : null,
  deletedAt: action === "remove" ? "2026-09-22T00:00:00.000Z" : null,
  updatedAt: "2026-09-22T00:00:00.000Z",
  changed: true,
});

describe("account availability API", () => {
  it.each(["deactivate", "remove"] as const)("sends %s with an audited reason", async (action) => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: response(action) }), {
        status: 200, headers: { "content-type": "application/json" },
      }),
    );
    await expect(changeAccountAvailability({ userId, action, body: {
      reason: "Account action approved by HR",
    } })).resolves.toMatchObject({ id: userId, changed: true });
    expect(fetchMock).toHaveBeenCalledWith(
      action === "deactivate" ? `/api/users/${userId}/deactivate` : `/api/users/${userId}`,
      expect.objectContaining({
        method: action === "deactivate" ? "POST" : "DELETE",
        body: JSON.stringify({ reason: "Account action approved by HR" }),
      }),
    );
  });

  it("rejects an unverifiable result", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: response("deactivate") }), {
        status: 200, headers: { "content-type": "application/json" },
      }),
    );
    await expect(changeAccountAvailability({ userId, action: "remove", body: {
      reason: "Account action approved by HR",
    } })).rejects.toThrow("Unable to verify");
  });
});
