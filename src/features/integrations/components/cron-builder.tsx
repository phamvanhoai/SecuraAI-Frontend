"use client";

import {
  Calendar,
  Check,
  Clock,
  Code2,
  HelpCircle,
  Sparkles,
} from "lucide-react";
import { useEffect, useId, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { describeCron, validateCron } from "../utils/cron-utils";

export interface CronBuilderProps {
  value: string;
  onChange: (cron: string) => void;
  className?: string;
}

type FrequencyType = "minutes" | "hourly" | "daily" | "weekly";

const MINUTE_INTERVAL_OPTIONS = [
  { value: 5, label: "Every 5 minutes" },
  { value: 10, label: "Every 10 minutes" },
  { value: 15, label: "Every 15 minutes (Recommended)" },
  { value: 30, label: "Every 30 minutes" },
  { value: 45, label: "Every 45 minutes" },
];

const HOURLY_INTERVAL_OPTIONS = [
  { value: 1, label: "Every hour (1h)" },
  { value: 2, label: "Every 2 hours" },
  { value: 4, label: "Every 4 hours" },
  { value: 6, label: "Every 6 hours" },
  { value: 12, label: "Every 12 hours" },
];

const MINUTE_OFFSET_OPTIONS = [
  { value: 0, label: "00" },
  { value: 15, label: "15" },
  { value: 30, label: "30" },
  { value: 45, label: "45" },
];

const DAYS_OF_WEEK = [
  { value: 1, label: "Mon", short: "M" },
  { value: 2, label: "Tue", short: "T" },
  { value: 3, label: "Wed", short: "W" },
  { value: 4, label: "Thu", short: "T" },
  { value: 5, label: "Fri", short: "F" },
  { value: 6, label: "Sat", short: "S" },
  { value: 0, label: "Sun", short: "S" },
];

const QUICK_PRESETS = [
  { label: "Every 15 min", expr: "*/15 * * * *" },
  { label: "Hourly (00)", expr: "0 * * * *" },
  { label: "Every 6 hours", expr: "0 */6 * * *" },
  { label: "Daily at midnight", expr: "0 0 * * *" },
  { label: "Daily at 02:00", expr: "0 2 * * *" },
  { label: "Weekdays at 06:00", expr: "0 6 * * 1-5" },
];

export function CronBuilder({ value, onChange, className }: CronBuilderProps) {
  const [builderMode, setBuilderMode] = useState<"visual" | "custom">("visual");

  // Visual builder state
  const [frequency, setFrequency] = useState<FrequencyType>("minutes");
  const [minuteInterval, setMinuteInterval] = useState<number>(15);
  const [hourlyInterval, setHourlyInterval] = useState<number>(1);
  const [hourlyMinute, setHourlyMinute] = useState<number>(0);
  const [dailyHour, setDailyHour] = useState<number>(2);
  const [dailyMinute, setDailyMinute] = useState<number>(0);
  const [weeklyDays, setWeeklyDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [weeklyHour, setWeeklyHour] = useState<number>(2);
  const [weeklyMinute, setWeeklyMinute] = useState<number>(0);

  const customCronInputId = useId();

  // Compute description
  const explanation = describeCron(value);

  // Sync visual selections into the generated cron expression
  useEffect(() => {
    if (builderMode !== "visual") return;

    let computed = "";
    if (frequency === "minutes") {
      computed = `*/${minuteInterval} * * * *`;
    } else if (frequency === "hourly") {
      computed =
        hourlyInterval === 1
          ? `${hourlyMinute} * * * *`
          : `${hourlyMinute} */${hourlyInterval} * * *`;
    } else if (frequency === "daily") {
      computed = `${dailyMinute} ${dailyHour} * * *`;
    } else if (frequency === "weekly") {
      const sortedDays =
        weeklyDays.length > 0 ? [...weeklyDays].sort((a, b) => a - b) : [1];
      computed = `${weeklyMinute} ${weeklyHour} * * ${sortedDays.join(",")}`;
    }

    if (computed && computed !== value) {
      onChange(computed);
    }
  }, [
    builderMode,
    frequency,
    minuteInterval,
    hourlyInterval,
    hourlyMinute,
    dailyHour,
    dailyMinute,
    weeklyDays,
    weeklyHour,
    weeklyMinute,
  ]);

  function toggleWeeklyDay(dayValue: number) {
    setWeeklyDays((prev) => {
      if (prev.includes(dayValue)) {
        if (prev.length === 1) return prev; // Keep at least one day selected
        return prev.filter((d) => d !== dayValue);
      }
      return [...prev, dayValue];
    });
  }

  return (
    <div className={cn("space-y-3.5", className)}>
      {/* Mode Switcher Tabs */}
      <div className="flex items-center justify-between border-b border-border pb-2.5">
        <div className="flex items-center gap-1 rounded-lg bg-neutral-soft p-1">
          <button
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              builderMode === "visual"
                ? "bg-surface text-foreground shadow-xs"
                : "text-muted hover:text-foreground",
            )}
            onClick={() => setBuilderMode("visual")}
            type="button"
          >
            <Sparkles className="size-3.5 text-brand" />
            Simple Mode
          </button>
          <button
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              builderMode === "custom"
                ? "bg-surface text-foreground shadow-xs"
                : "text-muted hover:text-foreground",
            )}
            onClick={() => setBuilderMode("custom")}
            type="button"
          >
            <Code2 className="size-3.5" />
            Custom Cron
          </button>
        </div>

        <span className="text-[11px] text-muted flex items-center gap-1">
          <HelpCircle className="size-3" />
          5-field standard
        </span>
      </div>

      {/* Visual Builder Mode */}
      {builderMode === "visual" ? (
        <div className="space-y-3">
          {/* Frequency Type Selector Pills */}
          <div className="space-y-1.5">
            <Label className="text-xs">Frequency</Label>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
              {(
                [
                  { id: "minutes", label: "Every X Minutes" },
                  { id: "hourly", label: "Hourly" },
                  { id: "daily", label: "Daily" },
                  { id: "weekly", label: "Weekly" },
                ] as const
              ).map((f) => (
                <button
                  className={cn(
                    "rounded-lg border px-3 py-2 text-left text-xs transition-colors",
                    frequency === f.id
                      ? "border-brand bg-brand-soft/70 font-semibold text-brand ring-1 ring-brand/30"
                      : "border-border bg-surface text-foreground hover:bg-neutral-soft",
                  )}
                  key={f.id}
                  onClick={() => setFrequency(f.id)}
                  type="button"
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sub-form: Minutes */}
          {frequency === "minutes" ? (
            <div className="space-y-1.5 rounded-lg border border-border bg-surface p-3">
              <Label className="text-xs">Repeat Every</Label>
              <Select
                className="text-xs"
                onChange={(e) => setMinuteInterval(Number(e.target.value))}
                value={minuteInterval}
              >
                {MINUTE_INTERVAL_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </div>
          ) : null}

          {/* Sub-form: Hourly */}
          {frequency === "hourly" ? (
            <div className="grid grid-cols-1 gap-2.5 rounded-lg border border-border bg-surface p-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Interval</Label>
                <Select
                  className="text-xs"
                  onChange={(e) => setHourlyInterval(Number(e.target.value))}
                  value={hourlyInterval}
                >
                  {HOURLY_INTERVAL_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Minute of the hour</Label>
                <Select
                  className="text-xs"
                  onChange={(e) => setHourlyMinute(Number(e.target.value))}
                  value={hourlyMinute}
                >
                  {MINUTE_OFFSET_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          ) : null}

          {/* Sub-form: Daily */}
          {frequency === "daily" ? (
            <div className="space-y-2 rounded-lg border border-border bg-surface p-3">
              <Label className="text-xs">Trigger Time (24-hour UTC)</Label>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <span className="text-[11px] text-muted">Hour</span>
                  <Select
                    className="text-xs"
                    onChange={(e) => setDailyHour(Number(e.target.value))}
                    value={dailyHour}
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i}>
                        {i.toString().padStart(2, "0")}:00 ({i < 12 ? `${i} AM` : i === 12 ? "12 PM" : `${i - 12} PM`})
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] text-muted">Minute</span>
                  <Select
                    className="text-xs"
                    onChange={(e) => setDailyMinute(Number(e.target.value))}
                    value={dailyMinute}
                  >
                    {MINUTE_OFFSET_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
            </div>
          ) : null}

          {/* Sub-form: Weekly */}
          {frequency === "weekly" ? (
            <div className="space-y-3 rounded-lg border border-border bg-surface p-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Repeat On Days</Label>
                <div className="flex flex-wrap gap-1.5">
                  {DAYS_OF_WEEK.map((day) => {
                    const isSelected = weeklyDays.includes(day.value);
                    return (
                      <button
                        className={cn(
                          "flex h-8 w-11 items-center justify-center rounded-md border text-xs font-medium transition-colors",
                          isSelected
                            ? "border-brand bg-brand-soft font-semibold text-brand ring-1 ring-brand/30"
                            : "border-border bg-surface text-muted hover:bg-neutral-soft hover:text-foreground",
                        )}
                        key={day.value}
                        onClick={() => toggleWeeklyDay(day.value)}
                        type="button"
                      >
                        {day.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 border-t border-border pt-2.5">
                <div className="space-y-1">
                  <span className="text-[11px] text-muted">Hour</span>
                  <Select
                    className="text-xs"
                    onChange={(e) => setWeeklyHour(Number(e.target.value))}
                    value={weeklyHour}
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i}>
                        {i.toString().padStart(2, "0")}:00
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] text-muted">Minute</span>
                  <Select
                    className="text-xs"
                    onChange={(e) => setWeeklyMinute(Number(e.target.value))}
                    value={weeklyMinute}
                  >
                    {MINUTE_OFFSET_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        /* Custom Cron Mode */
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs" htmlFor={customCronInputId}>
              Cron Expression (5 fields: minute hour day month weekday)
            </Label>
            <Input
              className="font-mono text-xs"
              id={customCronInputId}
              onChange={(e) => onChange(e.target.value)}
              placeholder="*/15 * * * *"
              required
              value={value}
            />
          </div>

          {/* 5-Field Segment Visual Guide */}
          <div className="grid grid-cols-5 gap-1 rounded-md border border-border bg-neutral-soft/50 p-2 text-center text-[10px]">
            <div>
              <span className="font-semibold text-foreground">Minute</span>
              <p className="text-muted text-[9px]">0 - 59</p>
            </div>
            <div>
              <span className="font-semibold text-foreground">Hour</span>
              <p className="text-muted text-[9px]">0 - 23</p>
            </div>
            <div>
              <span className="font-semibold text-foreground">Day</span>
              <p className="text-muted text-[9px]">1 - 31</p>
            </div>
            <div>
              <span className="font-semibold text-foreground">Month</span>
              <p className="text-muted text-[9px]">1 - 12</p>
            </div>
            <div>
              <span className="font-semibold text-foreground">Weekday</span>
              <p className="text-muted text-[9px]">0 - 6 (Sun-Sat)</p>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="space-y-1.5 pt-1">
            <span className="text-muted text-[11px]">Quick Presets:</span>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_PRESETS.map((preset) => (
                <button
                  className={cn(
                    "rounded-md border px-2 py-1 text-[11px] transition-colors",
                    value === preset.expr
                      ? "border-brand bg-brand-soft font-medium text-brand"
                      : "border-border bg-surface text-foreground hover:bg-neutral-soft",
                  )}
                  key={preset.expr}
                  onClick={() => onChange(preset.expr)}
                  type="button"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Human-Readable Live Explanation Preview */}
      <div
        className={cn(
          "flex flex-col gap-2 rounded-lg border p-3 text-xs sm:flex-row sm:items-center sm:justify-between transition-colors",
          explanation.isValid
            ? "border-brand/25 bg-brand-soft/30 text-foreground"
            : "border-danger/30 bg-danger-soft text-danger",
        )}
      >
        <div className="flex items-center gap-2">
          <Clock className="size-4 shrink-0 text-brand" />
          <div>
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted block">
              Schedule Summary
            </span>
            <span className="font-medium text-xs">
              {explanation.description}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-center">
          <span className="text-[11px] text-muted">Expression:</span>
          <code className="rounded border border-border bg-surface px-2 py-0.5 font-mono text-[11px] font-semibold text-foreground">
            {value.trim() || "* * * * *"}
          </code>
        </div>
      </div>
    </div>
  );
}
