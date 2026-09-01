import { describe, expect, it } from "vitest";
import { normalizeApiError } from "./api-error";

describe("normalizeApiError", () => {
  it("maps known status and safely reads the backend envelope", () => {
    const error = normalizeApiError(422, { error: { message: "Invalid input" } });
    expect(error.code).toBe("VALIDATION_FAILED");
    expect(error.message).toBe("Invalid input");
  });
});
