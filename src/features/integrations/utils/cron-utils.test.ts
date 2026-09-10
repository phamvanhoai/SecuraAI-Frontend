import { describe, expect, it } from "vitest";
import { describeCron, validateCron } from "./cron-utils";

describe("cron-utils", () => {
  describe("validateCron", () => {
    it("validates 5-field expressions", () => {
      expect(validateCron("*/15 * * * *")).toBe(true);
      expect(validateCron("0 0 * * *")).toBe(true);
      expect(validateCron("0 2 * * 1-5")).toBe(true);
      expect(validateCron("")).toBe(false);
      expect(validateCron("*/15 * * *")).toBe(false);
      expect(validateCron("*/15 * * * * *")).toBe(false);
    });
  });

  describe("describeCron", () => {
    it("describes every X minutes", () => {
      expect(describeCron("*/15 * * * *").description).toBe("Runs every 15 minutes");
      expect(describeCron("*/5 * * * *").description).toBe("Runs every 5 minutes");
      expect(describeCron("* * * * *").description).toBe("Runs every minute");
    });

    it("describes hourly patterns", () => {
      expect(describeCron("0 * * * *").description).toBe("Runs every hour, on the hour (00)");
      expect(describeCron("30 * * * *").description).toBe("Runs every hour at minute 30");
      expect(describeCron("0 */6 * * *").description).toBe("Runs every 6 hours at minute 00");
      expect(describeCron("15 */2 * * *").description).toBe("Runs every 2 hours at minute 15");
    });

    it("describes daily patterns", () => {
      expect(describeCron("0 0 * * *").description).toBe("Runs daily at midnight (00:00)");
      expect(describeCron("30 2 * * *").description).toBe("Runs daily at 02:30");
      expect(describeCron("0 14 * * *").description).toBe("Runs daily at 14:00");
    });

    it("describes weekdays and specific days", () => {
      expect(describeCron("0 9 * * 1-5").description).toBe("Runs Monday through Friday at 09:00");
      expect(describeCron("0 3 * * 1,3,5").description).toBe(
        "Runs every Monday, Wednesday, Friday at 03:00",
      );
    });

    it("describes day of month", () => {
      expect(describeCron("0 0 1 * *").description).toBe("Runs on day 1 of every month at 00:00");
    });

    it("flags invalid expressions", () => {
      expect(describeCron("invalid").isValid).toBe(false);
      expect(describeCron("").isValid).toBe(false);
    });
  });
});
