import { describe, expect, it } from "vitest";
import { isSameOriginRequest } from "./same-origin";
describe("same-origin BFF protection", () => {
  it.each(["localhost:3001", "localhost:4000", "127.0.0.1:5000"])(
    "accepts external authority %s despite internal hostname",
    (host) => {
      expect(
        isSameOriginRequest(
          new Request("http://0.0.0.0:3001/api/test", {
            headers: { host, origin: `http://${host}` },
          }),
        ),
      ).toBe(true);
    },
  );
  it.each([
    { origin: "http://evil.test" },
    { origin: "http://localhost:3002" },
    { origin: "https://localhost:3001" },
    { origin: "http://localhost:3001", "sec-fetch-site": "cross-site" },
    { "x-forwarded-host": "evil.test", origin: "http://evil.test" },
    {},
  ])("rejects mismatched, missing or cross-site origin %j", (headers) => {
    expect(
      isSameOriginRequest(
        new Request("http://0.0.0.0:3001/api/test", {
          headers: { host: "localhost:3001", ...headers },
        }),
      ),
    ).toBe(false);
  });
});
