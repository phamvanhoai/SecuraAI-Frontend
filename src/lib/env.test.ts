import { describe, expect, it } from "vitest";
import { parsePublicEnv } from "./env";

describe("environment", () => {
  it("applies safe local defaults", () => {
    expect(parsePublicEnv({}).NEXT_PUBLIC_APP_NAME).toBe("SecuraAI");
  });

  it("rejects an invalid API URL", () => {
    expect(() => parsePublicEnv({ NEXT_PUBLIC_API_BASE_URL: "not-a-url" })).toThrow();
  });
});
