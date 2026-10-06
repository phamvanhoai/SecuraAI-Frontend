"use client";

import { BellRing, CheckCircle2, Info, Mail, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { ProductPanel } from "@/components/data-display/static-product";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

type Channel = "in-system" | "email";

export function PersonalNotificationChannelManager({
  email,
}: {
  email: string;
}) {
  const [channels, setChannels] = useState<Channel[]>(["in-system", "email"]);
  const hasChannel = channels.length > 0;

  const toggleChannel = (channel: Channel) => {
    setChannels((current) =>
      current.includes(channel)
        ? current.filter((item) => item !== channel)
        : [...current, channel],
    );
  };

  return (
    <ProductPanel
      title="Configure Personal Notification Channel"
      description="Choose where SecuraAI should deliver eligible notifications for your account."
    >
      <div className="grid gap-6 p-5 lg:grid-cols-[minmax(0,1fr)_20rem] lg:p-6">
        <div className="space-y-5">
          <Alert className="border-info/25 bg-info-soft text-info">
            <div className="flex items-start gap-2">
              <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              <p>
                UI preview for UC41. Saving and applying these preferences will
                be connected when the backend preference API is implemented.
              </p>
            </div>
          </Alert>

          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold">
              Preferred channels
            </legend>
            <p className="text-muted text-sm">
              Select at least one channel. These choices apply only when a
              notification supports the selected delivery method.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <ChannelOption
                checked={channels.includes("in-system")}
                description="Show notifications and reminders inside SecuraAI."
                icon={BellRing}
                label="In-system notifications"
                onChange={() => toggleChannel("in-system")}
              />
              <ChannelOption
                checked={channels.includes("email")}
                description={`Send supported notifications to ${email}.`}
                icon={Mail}
                label="Email notifications"
                onChange={() => toggleChannel("email")}
              />
            </div>
          </fieldset>

          {!hasChannel ? (
            <Alert className="border-warning/25 bg-warning-soft text-warning">
              Select at least one notification channel before reviewing your
              preferences.
            </Alert>
          ) : null}

          <div className="border-border flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-muted text-xs">
              Critical security notices may still use mandatory channels defined
              by the organization.
            </p>
            <Button disabled={!hasChannel} type="button">
              Review preferences
            </Button>
          </div>
        </div>

        <aside className="bg-neutral-soft border-border h-fit rounded-xl border p-4">
          <div className="flex items-center gap-2">
            <ShieldCheck
              aria-hidden="true"
              className="text-brand size-5"
              strokeWidth={1.8}
            />
            <h3 className="text-sm font-semibold">Current selection</h3>
          </div>
          <div className="mt-4 space-y-3">
            <SelectionStatus
              enabled={channels.includes("in-system")}
              label="In-system"
            />
            <SelectionStatus
              enabled={channels.includes("email")}
              label="Email"
            />
          </div>
          <p className="text-muted mt-4 text-xs leading-5">
            Preferences affect future eligible notifications after they are
            saved.
          </p>
        </aside>
      </div>
    </ProductPanel>
  );
}

function ChannelOption({
  checked,
  description,
  icon: Icon,
  label,
  onChange,
}: {
  checked: boolean;
  description: string;
  icon: typeof BellRing;
  label: string;
  onChange: () => void;
}) {
  return (
    <label className="border-border bg-surface hover:bg-neutral-soft flex min-h-32 cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors">
      <Checkbox
        checked={checked}
        className="mt-1 shrink-0"
        onChange={onChange}
      />
      <span className="min-w-0">
        <span className="flex items-center gap-2 font-semibold">
          <Icon
            aria-hidden="true"
            className="text-brand size-5 shrink-0"
            strokeWidth={1.8}
          />
          {label}
        </span>
        <span className="text-muted mt-2 block text-sm leading-5 break-words">
          {description}
        </span>
      </span>
    </label>
  );
}

function SelectionStatus({
  enabled,
  label,
}: {
  enabled: boolean;
  label: string;
}) {
  return (
    <div className="border-border bg-surface flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5">
      <span className="text-sm font-medium">{label}</span>
      <span className="flex items-center gap-1.5 text-xs font-medium">
        {enabled ? (
          <CheckCircle2 aria-hidden="true" className="text-success size-4" />
        ) : null}
        {enabled ? "Enabled" : "Disabled"}
      </span>
    </div>
  );
}
