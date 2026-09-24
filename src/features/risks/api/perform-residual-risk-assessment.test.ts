import { afterEach, describe, expect, it, vi } from "vitest";
import { performResidualRiskAssessment } from "./perform-residual-risk-assessment";

const riskAssessmentId = "11111111-1111-4111-8111-111111111111";
const treatmentPlanId = "22222222-2222-4222-8222-222222222222";
const assessedByUserId = "33333333-3333-4333-8333-333333333333";
const timestamp = "2026-09-22T08:00:00.000Z";
const input = {
  riskAssessmentId,
  data: {
    residualLikelihood: 2,
    residualImpact: 3,
    assessmentNote: "Controls were verified as effective.",
    expectedUpdatedAt: timestamp,
  },
};

afterEach(() => vi.unstubAllGlobals());

describe("perform residual risk assessment API", () => {
  it("returns the validated unwrapped result", async () => {
    const data = {
      riskAssessmentId,
      treatmentPlanId,
      riskCode: "RISK-001",
      title: "Credential compromise",
      status: "in_treatment",
      assessedByUserId,
      assessedAt: timestamp,
      inherentRisk: { likelihood: 4, impact: 4, score: 16 },
      residualRisk: {
        likelihood: 2,
        impact: 3,
        score: 6,
        level: "medium",
        reduction: 10,
      },
      updatedAt: timestamp,
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ success: true, data }), { status: 200 }),
      );
    vi.stubGlobal("fetch", fetchMock);

    await expect(performResidualRiskAssessment(input)).resolves.toEqual(data);
    expect(fetchMock).toHaveBeenCalledWith(
      `/api/risks/${riskAssessmentId}/residual-assessment`,
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify(input.data),
      }),
    );
  });

  it("preserves a workflow conflict for the dialog", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            success: false,
            error: {
              code: "TREATMENT_ACTIONS_INCOMPLETE",
              message: "Complete every active treatment action first",
            },
          }),
          { status: 409 },
        ),
      ),
    );

    await expect(performResidualRiskAssessment(input)).rejects.toMatchObject({
      status: 409,
      message: "Complete every active treatment action first",
    });
  });
});
