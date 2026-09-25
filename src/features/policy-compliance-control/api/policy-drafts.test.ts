import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createPolicyDraft,
  listPolicyDrafts,
  submitPolicyForReview,
} from "./policy-drafts";

afterEach(() => vi.unstubAllGlobals());

const policyId = "00000000-0000-4000-8000-000000000010";
const versionId = "00000000-0000-4000-8000-000000000020";

describe("policy drafts API", () => {
  it("loads the authenticated user's drafts through the same-origin BFF", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: {
            items: [],
            pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
          },
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      listPolicyDrafts({ page: 1, limit: 20, sortOrder: "desc" }),
    ).resolves.toMatchObject({ pagination: { total: 0 } });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/compliance/policies/drafts/mine?page=1&limit=20&sortOrder=desc",
      expect.objectContaining({
        credentials: "include",
        headers: expect.objectContaining({ Accept: "application/json" }),
      }),
    );
  });

  it("creates a draft and validates the backend response", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: {
            id: policyId,
            policyCode: "POL-SEC-001",
            title: "Chính sách an toàn thông tin",
            description: null,
            ownerUserId: null,
            status: "draft",
            currentVersion: {
              id: versionId,
              versionNumber: "1.0",
              content: "Nội dung",
              status: "draft",
              createdAt: "2026-09-11T00:00:00.000Z",
            },
            createdAt: "2026-09-11T00:00:00.000Z",
            updatedAt: "2026-09-11T00:00:00.000Z",
          },
        }),
        { status: 201 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      createPolicyDraft({
        policyCode: "POL-SEC-001",
        title: "Chính sách an toàn thông tin",
        versionNumber: "1.0",
        content: "Nội dung",
      }),
    ).resolves.toMatchObject({
      id: policyId,
      currentVersion: { id: versionId },
    });
  });

  it("submits a draft for Admin review through the same-origin BFF", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: {
            policyId,
            policyCode: "POL-SEC-001",
            title: "Information security policy",
            policyStatus: "DRAFT",
            ownerUserId: "00000000-0000-4000-8000-000000000030",
            version: {
              id: versionId,
              versionNumber: "1.0",
              status: "IN_REVIEW",
              createdByUserId: "00000000-0000-4000-8000-000000000030",
              createdAt: "2026-09-25T00:00:00.000Z",
            },
            submittedAt: "2026-09-25T01:00:00.000Z",
          },
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(submitPolicyForReview(policyId, versionId)).resolves.toMatchObject({
      policyId,
      version: { status: "IN_REVIEW" },
    });
    expect(fetchMock).toHaveBeenCalledWith(
      `/api/compliance/policies/${policyId}/versions/${versionId}/submit`,
      expect.objectContaining({ method: "POST", credentials: "include" }),
    );
  });
});
