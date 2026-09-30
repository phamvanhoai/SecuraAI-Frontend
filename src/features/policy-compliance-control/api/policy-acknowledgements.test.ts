import { afterEach, describe, expect, it, vi } from "vitest";
import { acknowledgePolicy } from "./policy-acknowledgements";

afterEach(() => vi.unstubAllGlobals());

describe("acknowledgePolicy", () => {
  it("posts the Employee acknowledgement through the authenticated BFF", async () => {
    const policyId = "00000000-0000-4000-8000-000000000010";
    const versionId = "00000000-0000-4000-8000-000000000011";
    const response = {
      policyId,
      versionId,
      acknowledgedAt: "2026-09-30T00:00:00.000Z",
      alreadyAcknowledged: false,
    };
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: response }), {
        status: 200,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(acknowledgePolicy(policyId, versionId)).resolves.toEqual(response);
    expect(fetchMock).toHaveBeenCalledWith(
      `/api/compliance/policies/${policyId}/versions/${versionId}/acknowledgements`,
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        body: JSON.stringify({}),
      }),
    );
  });
});
