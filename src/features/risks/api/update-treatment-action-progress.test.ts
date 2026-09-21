import { afterEach, describe, expect, it, vi } from "vitest";
import { updateTreatmentActionProgress } from "./update-treatment-action-progress";
import { updateTreatmentActionProgressRequestSchema } from "../schemas/update-treatment-action-progress-schema";

const treatmentPlanId = "11111111-1111-4111-8111-111111111111";
const actionId = "22222222-2222-4222-8222-222222222222";
const input = { treatmentPlanId, actionId, data: { expectedUpdatedAt: "2026-09-21T12:00:00.000Z", progressPercent: 50 } };
afterEach(() => vi.unstubAllGlobals());

describe("update treatment action progress API", () => {
  it("handles the unwrapped success payload and omits an unused note", async () => {
    const data = { treatmentPlanId, actionId, progressPercent: 50, status: "in_progress", completedAt: null,
      updatedAt: "2026-09-21T12:01:00.000Z", planStatus: "in_progress", riskStatus: "in_treatment",
      progressPercentAverage: 50, totalActions: 1, completedActions: 0, allActionsCompleted: false };
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true, data }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(updateTreatmentActionProgress(input)).resolves.toEqual(data);
    expect(fetchMock).toHaveBeenCalledWith(`/api/risks/treatment-plans/${treatmentPlanId}/actions/${actionId}/progress`,
      expect.objectContaining({ method: "PATCH", body: JSON.stringify(input.data) }));
  });
  it("keeps conflicts actionable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: false,
      error: { code: "TREATMENT_ACTION_CHANGED", message: "Reload and try again" } }), { status: 409 })));
    await expect(updateTreatmentActionProgress(input)).rejects.toMatchObject({ status: 409, message: "Reload and try again" });
  });
  it.each(["", "50", null, -1, 101, 1.5])("rejects invalid request progress %s", (progressPercent) => {
    expect(updateTreatmentActionProgressRequestSchema.safeParse({ ...input.data, progressPercent }).success).toBe(false);
  });
});
