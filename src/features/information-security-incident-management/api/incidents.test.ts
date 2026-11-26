import { beforeEach, expect, it, vi } from "vitest";
vi.mock("@/lib/api/api-client", () => ({ apiRequest: vi.fn() }));
import { apiRequest } from "@/lib/api/api-client";
import { reportIncident } from "./incidents";
const input = { creationMode: "manual" as const, sourceId: "", title: "Ransomware PC-KT-01",
  description: "Files were encrypted and require investigation.", severity: "high" as const,
  occurredAt: "2026-11-26T08:00" };
beforeEach(() => { vi.clearAllMocks(); vi.mocked(apiRequest).mockRejectedValue(new Error("test boundary")); });
it("sends detection time using the backend contract without override on the first attempt", async () => {
  await expect(reportIncident(input)).rejects.toThrow("test boundary");
  expect(apiRequest).toHaveBeenCalledWith("/api/incidents", expect.objectContaining({ body: {
    sourceType: "manual", title: input.title, description: input.description, severity: "high",
    detectedAt: new Date(input.occurredAt).toISOString(),
  } }));
});
it("retries the same source details with the reason and reviewed incident identifiers", async () => {
  const id = "00000000-0000-4000-8000-000000000010";
  await expect(reportIncident({ ...input, creationMode: "source", sourceId: id,
    separateReason: "Different attack campaign.", reviewedIncidentIds: [id] })).rejects.toThrow("test boundary");
  expect(apiRequest).toHaveBeenCalledWith("/api/incidents", expect.objectContaining({ body: expect.objectContaining({
    sourceType: "finding", sourceId: id, reviewedIncidentIds: [id], separateReason: "Different attack campaign.",
  }) }));
});
