import { describe, expect, it, vi } from "vitest";
import { apiRequest } from "@/lib/api/api-client";
import { getRiskCreateOptions } from "./get-risk-create-options";
vi.mock("@/lib/api/api-client", () => ({ apiRequest: vi.fn() }));
describe("risk create options API", () => {
  it("sends encoded search, a limit of ten and AbortSignal to the existing BFF", async () => {
    vi.mocked(apiRequest).mockResolvedValue({
      assets: [],
      owners: [],
      businessServices: [],
    });
    const signal = new AbortController().signal;
    await getRiskCreateOptions(signal, " DB & app ");
    expect(apiRequest).toHaveBeenCalledWith(
      "/api/risks/create-options?q=DB+%26+app&limit=10",
      expect.objectContaining({ signal, target: "same-origin" }),
    );
  });
  it("rejects malformed server data rather than fabricating options", async () => {
    vi.mocked(apiRequest).mockResolvedValue({ owners: [] });
    await expect(getRiskCreateOptions()).rejects.toThrow("invalid format");
  });
});
