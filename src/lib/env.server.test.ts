// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("server API address", () => {
  it("uses the internal Docker backend address only on the server", async () => {
    vi.stubEnv("BACKEND_API_BASE_URL", "http://backend:3000/api/v1");
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "http://localhost:3000/api/v1");
    vi.resetModules();
    const { env } = await import("./env");
    expect(env.NEXT_PUBLIC_API_BASE_URL).toBe("http://backend:3000/api/v1");
  });
});
