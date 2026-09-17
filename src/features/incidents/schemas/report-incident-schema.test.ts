import { describe, expect, it } from "vitest";
import {
  classifyIncidentFormSchema,
  reportIncidentFormSchema,
} from "./report-incident-schema";
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
describe("classifyIncidentFormSchema", () => {
  it("accepts an approved severity with rationale", () =>
    expect(
      classifyIncidentFormSchema.safeParse({
        severity: "high",
        rationale:
          "The incident affects a production service and remains active.",
      }).success,
    ).toBe(true));
  it("rejects unsupported severity", () =>
    expect(
      classifyIncidentFormSchema.safeParse({
        severity: "urgent",
        rationale:
          "The incident affects a production service and remains active.",
      }).success,
    ).toBe(false));
});
