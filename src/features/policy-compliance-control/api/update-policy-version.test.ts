import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/api-error";
import {
  listPublishedPoliciesForNewVersion,
  updatePolicyAndCreateVersion,
} from "./update-policy-version";

afterEach(() => vi.unstubAllGlobals());

const policyId = "00000000-0000-4000-8000-000000000010";
const responseData = {
  policyId,
  policyCode: "ISP-001",
  title: "Information Security Policy",
  description: null,
  ownerUserId: "00000000-0000-4000-8000-000000000001",
  policyStatus: "draft",
  version: {
    id: "00000000-0000-4000-8000-000000000011",
    versionNumber: "1.1",
    content: "Updated content",
    changeSummary: "Updated access controls",
    status: "draft",
    createdByUserId: "00000000-0000-4000-8000-000000000001",
    createdAt: "2026-09-13T00:00:00.000Z",
  },
  updatedAt: "2026-09-13T00:00:00.000Z",
};

describe("updatePolicyAndCreateVersion", () => {
  it("posts the backend contract through the authenticated same-origin BFF", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: responseData }), {
        status: 201,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      updatePolicyAndCreateVersion(policyId, {
        versionNumber: "1.1",
        content: "Updated content",
        changeSummary: "Updated access controls",
      }),
    ).resolves.toEqual(responseData);

    expect(fetchMock).toHaveBeenCalledWith(
      `/api/compliance/policies/${policyId}/versions`,
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        body: JSON.stringify({
          versionNumber: "1.1",
          content: "Updated content",
          changeSummary: "Updated access controls",
        }),
      }),
    );
  });

  it("rejects a malformed successful response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            success: true,
            data: { ...responseData, version: null },
          }),
          { status: 201 },
        ),
      ),
    );

    await expect(
      updatePolicyAndCreateVersion(policyId, {
        versionNumber: "1.1",
        content: "Updated content",
        changeSummary: "Updated access controls",
      }),
    ).rejects.toBeInstanceOf(ApiError);
  });
});

describe("listPublishedPoliciesForNewVersion", () => {
  it("loads eligible policies through the authenticated BFF", async () => {
    const policy = {
      id: policyId,
      policyCode: "ISP-001",
      title: "Information Security Policy",
      description: null,
      currentVersion: "1.0",
      updatedAt: "2026-09-13T00:00:00.000Z",
    };
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: [policy] }), {
        status: 200,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(listPublishedPoliciesForNewVersion()).resolves.toEqual([
      policy,
    ]);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/compliance/policies/published/mine",
      expect.objectContaining({ credentials: "include" }),
    );
  });
});
