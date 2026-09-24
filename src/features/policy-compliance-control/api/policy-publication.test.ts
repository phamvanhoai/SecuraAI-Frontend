import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getPolicyReview,
  listPublishablePolicies,
  publishPolicyVersion,
} from "./policy-publication";

const policyId = "00000000-0000-4000-8000-000000000010";
const versionId = "00000000-0000-4000-8000-000000000011";
const timestamp = "2026-09-11T08:00:00.000Z";

afterEach(() => vi.unstubAllGlobals());

describe("policy publication API", () => {
  it("lists publishable drafts through the same-origin BFF", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: {
            items: [
              {
                id: policyId,
                policyCode: "ISP-001",
                title: "Information Security Policy",
                description: null,
                ownerUserId: null,
                status: "draft",
                draftVersion: {
                  id: versionId,
                  versionNumber: "1.0",
                  status: "draft",
                  createdByUserId: null,
                  createdAt: timestamp,
                },
                updatedAt: timestamp,
              },
            ],
            pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
          },
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      listPublishablePolicies({
        page: 1,
        limit: 20,
        sortBy: "updatedAt",
        sortOrder: "desc",
      }),
    ).resolves.toMatchObject({ pagination: { total: 1 } });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/compliance/policies/drafts/reviewable?page=1&limit=20&sortBy=updatedAt&sortOrder=desc",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("loads review detail and publishes the selected version", async () => {
    const detail = {
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
        status: "draft",
        effectiveDate: null,
        createdByUserId: null,
        createdAt: timestamp,
      },
    };
    const published = {
      policyId,
      policyCode: "ISP-001",
      title: "Information Security Policy",
      status: "published",
      publishedVersion: {
        id: versionId,
        versionNumber: "1.0",
        status: "published",
        effectiveDate: timestamp,
        publishedByUserId: null,
        publishedAt: timestamp,
        createdAt: timestamp,
      },
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true, data: detail }), {
          status: 200,
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true, data: published }), {
          status: 200,
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    await expect(getPolicyReview(policyId, versionId)).resolves.toMatchObject({
      policyCode: "ISP-001",
    });
    await expect(
      publishPolicyVersion({
        policyId,
        versionId,
        effectiveDate: "2026-09-11",
      }),
    ).resolves.toMatchObject({ status: "published" });
    expect(fetchMock.mock.calls[1]?.[1]).toMatchObject({
      method: "POST",
      body: JSON.stringify({ effectiveDate: "2026-09-11" }),
    });
  });
});
