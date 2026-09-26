import { afterEach, describe, expect, it, vi } from "vitest";
import { rejectPolicy } from "./policy-publication";

const policyId = "00000000-0000-4000-8000-000000000010";
const versionId = "00000000-0000-4000-8000-000000000011";
const timestamp = "2026-09-26T08:00:00.000Z";

afterEach(() => vi.unstubAllGlobals());

describe("reject policy API", () => {
  it("posts the reason through the same-origin BFF and validates the response", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: {
            policyId,
            policyCode: "ISP-001",
            title: "Information Security Policy",
            description: null,
            ownerUserId: null,
            policyStatus: "draft",
            updatedAt: timestamp,
            version: {
              id: versionId,
              versionNumber: "1.0",
              content: "Policy content",
              changeSummary: null,
              status: "rejected",
              effectiveDate: null,
              createdByUserId: null,
              createdAt: timestamp,
            },
            decision: {
              id: "00000000-0000-4000-8000-000000000013",
              action: "REJECTED",
              comment: "Missing required controls.",
              actorUserId: "00000000-0000-4000-8000-000000000014",
              decidedAt: timestamp,
            },
          },
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      rejectPolicy({
        policyId,
        versionId,
        body: { reason: "Missing required controls." },
      }),
    ).resolves.toMatchObject({
      version: { status: "rejected" },
      decision: { action: "REJECTED" },
    });
    expect(fetchMock).toHaveBeenCalledWith(
      `/api/compliance/policies/${policyId}/versions/${versionId}/reject`,
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ reason: "Missing required controls." }),
      }),
    );
  });
});
