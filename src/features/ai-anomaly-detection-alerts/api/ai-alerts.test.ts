import { afterEach, describe, expect, it, vi } from "vitest";
import { markAiAlertFurtherInvestigation, startAiAlertTriage } from "./ai-alerts";

const alertId = "c82662ff-8cb7-4e97-b5f6-b0b1d9cb54c8";
const analystId = "9a9bf33a-02db-48e4-a8ad-90517278d7f2";

afterEach(() => vi.unstubAllGlobals());

describe("AI alert triage API", () => {
  it("starts triage through the authenticated BFF route", async () => {
    const result = {
      id: alertId,
      alertCode: "ALT-C82662FF",
      status: "reviewing",
      assignedToUserId: analystId,
      triageStartedAt: "2026-10-01T00:00:00.000Z",
      changed: true,
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValue(Response.json({ success: true, data: result }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(startAiAlertTriage(alertId)).resolves.toEqual(result);
    expect(fetchMock).toHaveBeenCalledWith(
      `/api/ai-alerts/${alertId}/triage/start`,
      expect.objectContaining({ method: "POST", credentials: "include" }),
    );
  });

  it("marks an alert as needing further investigation", async () => {
    const result = {
      id: alertId,
      alertCode: "ALT-C82662FF",
      status: "needs_investigation",
      reviewedByUserId: analystId,
      reviewedAt: "2026-10-01T00:00:00.000Z",
      changed: true,
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValue(Response.json({ success: true, data: result }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      markAiAlertFurtherInvestigation(alertId, {
        reason: "Correlate with endpoint telemetry.",
      }),
    ).resolves.toEqual(result);
    expect(fetchMock).toHaveBeenCalledWith(
      `/api/ai-alerts/${alertId}/further-investigation`,
      expect.objectContaining({ method: "POST", credentials: "include" }),
    );
  });
});
