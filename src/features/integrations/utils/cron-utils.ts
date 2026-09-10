/**
 * Utilities for parsing, explaining, and validating standard 5-field cron expressions.
 * Format: [minute] [hour] [day-of-month] [month] [day-of-week]
 */

const DAY_NAMES: Record<number, string> = {
  0: "Sunday",
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
  7: "Sunday",
};

export interface CronDescription {
  isValid: boolean;
  description: string;
}

export function validateCron(expression: string): boolean {
  const trimmed = expression.trim();
  if (!trimmed) return false;

  const parts = trimmed.split(/\s+/);
  if (parts.length !== 5) return false;

  const [min, hr, dom, mon, dow] = parts;
  if (!min || !hr || !dom || !mon || !dow) return false;

  return true;
}

/**
 * Returns a human-friendly description of a 5-field cron expression.
 */
export function describeCron(expression: string): CronDescription {
  const trimmed = expression.trim();
  if (!trimmed) {
    return { isValid: false, description: "Please enter a cron expression" };
  }

  const parts = trimmed.split(/\s+/);
  if (parts.length !== 5) {
    return {
      isValid: false,
      description: "Must contain exactly 5 fields: minute, hour, day, month, weekday",
    };
  }

  const [min, hr, dom, mon, dow] = parts as [string, string, string, string, string];

  // Pattern: Every X minutes (*/X * * * *)
  if (min.startsWith("*/") && hr === "*" && dom === "*" && mon === "*" && dow === "*") {
    const interval = min.slice(2);
    if (/^\d+$/.test(interval)) {
      return { isValid: true, description: `Runs every ${interval} minutes` };
    }
  }

  // Pattern: Every minute (* * * * *)
  if (min === "*" && hr === "*" && dom === "*" && mon === "*" && dow === "*") {
    return { isValid: true, description: "Runs every minute" };
  }

  // Pattern: Hourly at specific minute (M * * * *)
  if (/^\d+$/.test(min) && hr === "*" && dom === "*" && mon === "*" && dow === "*") {
    const m = Number.parseInt(min, 10);
    return {
      isValid: true,
      description:
        m === 0
          ? "Runs every hour, on the hour (00)"
          : `Runs every hour at minute ${m.toString().padStart(2, "0")}`,
    };
  }

  // Pattern: Every X hours at minute M (M */X * * *)
  if (/^\d+$/.test(min) && hr.startsWith("*/") && dom === "*" && mon === "*" && dow === "*") {
    const interval = hr.slice(2);
    const m = Number.parseInt(min, 10);
    return {
      isValid: true,
      description: `Runs every ${interval} hours at minute ${m.toString().padStart(2, "0")}`,
    };
  }

  // Pattern: Daily at specific time (M H * * *)
  if (/^\d+$/.test(min) && /^\d+$/.test(hr) && dom === "*" && mon === "*" && dow === "*") {
    const m = Number.parseInt(min, 10);
    const h = Number.parseInt(hr, 10);
    const timeStr = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
    if (h === 0 && m === 0) {
      return { isValid: true, description: "Runs daily at midnight (00:00)" };
    }
    return { isValid: true, description: `Runs daily at ${timeStr}` };
  }

  // Pattern: Weekdays (M H * * 1-5)
  if (/^\d+$/.test(min) && /^\d+$/.test(hr) && dom === "*" && mon === "*" && (dow === "1-5" || dow === "MON-FRI")) {
    const m = Number.parseInt(min, 10);
    const h = Number.parseInt(hr, 10);
    const timeStr = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
    return { isValid: true, description: `Runs Monday through Friday at ${timeStr}` };
  }

  // Pattern: Specific days of week (M H * * D,D,...)
  if (/^\d+$/.test(min) && /^\d+$/.test(hr) && dom === "*" && mon === "*" && dow !== "*") {
    const m = Number.parseInt(min, 10);
    const h = Number.parseInt(hr, 10);
    const timeStr = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
    const days = dow
      .split(",")
      .map((d) => {
        const num = Number.parseInt(d.trim(), 10);
        return DAY_NAMES[num] ?? d.trim();
      })
      .join(", ");
    return { isValid: true, description: `Runs every ${days} at ${timeStr}` };
  }

  // Pattern: Specific day of month (M H D * *)
  if (/^\d+$/.test(min) && /^\d+$/.test(hr) && /^\d+$/.test(dom) && mon === "*" && dow === "*") {
    const m = Number.parseInt(min, 10);
    const h = Number.parseInt(hr, 10);
    const timeStr = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
    return { isValid: true, description: `Runs on day ${dom} of every month at ${timeStr}` };
  }

  return {
    isValid: true,
    description: `Active schedule: ${min} ${hr} ${dom} ${mon} ${dow}`,
  };
}
