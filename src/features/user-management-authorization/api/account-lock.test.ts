import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/api-error";
import { changeAccountLock } from "./account-lock";

const userId = "00000000-0000-4000-8000-000000000002";
const result = {
  id: userId,
  status: "locked",
  lastLockedAt: "2026-09-17T08:00:00.000Z",
  updatedAt: "2026-09-17T08:00:00.000Z",
  changed: true,
};
afterEach(() => vi.restoreAllMocks());

describe("changeAccountLock", () => {
  it("posts the normalized reason to the same-origin BFF and validates the result", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(Response.json({ success: true, data: result }));
    await expect(
      changeAccountLock({
        userId,
        action: "lock",
        input: { reason: "  Security investigation  " },
      }),
    ).resolves.toEqual(result);
    expect(fetchMock).toHaveBeenCalledWith(
      `/api/users/${userId}/lock`,
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        body: JSON.stringify({ reason: "Security investigation" }),
      }),
    );
  });

  it("preserves backend business errors without retrying mutations", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json(
        {
          success: false,
          error: { code: "LAST_ACCOUNT_MANAGER", message: "Last manager" },
        },
        { status: 409 },
      ),
    );
    await expect(
      changeAccountLock({
        userId,
        action: "lock",
        input: { reason: "Security investigation" },
      }),
    ).rejects.toMatchObject({
      status: 409,
      details: { error: { code: "LAST_ACCOUNT_MANAGER" } },
    });
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("rejects mismatched account IDs or statuses rather than announcing success", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    for (const data of [
      { ...result, id: "00000000-0000-4000-8000-000000000003" },
      { ...result, status: "active" },
      {},
    ]) {
      fetchMock.mockResolvedValue(Response.json({ success: true, data }));
      await expect(
        changeAccountLock({
          userId,
          action: "lock",
          input: { reason: "Security investigation" },
        }),
      ).rejects.toBeInstanceOf(ApiError);
    }
  });
});
