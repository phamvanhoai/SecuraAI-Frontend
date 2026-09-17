import { describe, expect, it } from "vitest";
import { reportIncidentFormSchema } from "./report-incident-schema";
describe("reportIncidentFormSchema", () => {
  it("accepts a complete report", () =>
    expect(
      reportIncidentFormSchema.safeParse({
        title: "Suspicious email",
        description:
          "The sender requested credentials through an unknown link.",
        category: "phishing",
        occurredAt: "",
      }).success,
    ).toBe(true));
  it("requires a useful description", () =>
    expect(
      reportIncidentFormSchema.safeParse({
        title: "Suspicious email",
        description: "Too short",
        category: "phishing",
        occurredAt: "",
      }).success,
    ).toBe(false));
});
