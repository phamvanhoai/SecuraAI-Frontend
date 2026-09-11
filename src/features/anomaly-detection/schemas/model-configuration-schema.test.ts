import { describe, expect, it } from "vitest";
import { modelConfigurationFormSchema } from "./model-configuration-schema";

const validForm = {
  modelName: "security-anomaly",
  algorithm: "rule-based",
  version: "1.0.0",
  provider: "ollama",
  modelPath: "",
  ollamaModel: "qwen3:4b",
  rules: [
    {
      id: "failed-login",
      name: "Failed login threshold",
      eventType: "authentication.failed",
      threshold: 5,
      windowSeconds: 300,
      groupBy: "sourceIp" as const,
      severity: "high" as const,
      enabled: true,
    },
  ],
};

describe("modelConfigurationFormSchema", () => {
  it("accepts a backend-compatible configuration", () => {
    expect(modelConfigurationFormSchema.safeParse(validForm).success).toBe(
      true,
    );
  });

  it("rejects thresholds outside the backend boundary", () => {
    expect(
      modelConfigurationFormSchema.safeParse({
        ...validForm,
        rules: [{ ...validForm.rules[0], threshold: 0 }],
      }).success,
    ).toBe(false);
  });

  it("rejects duplicate rule IDs", () => {
    expect(
      modelConfigurationFormSchema.safeParse({
        ...validForm,
        rules: [validForm.rules[0], validForm.rules[0]],
      }).success,
    ).toBe(false);
  });
});
