"use client";

import { BellRing, CheckCircle2, Info, Mail, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { ProductPanel } from "@/components/data-display/static-product";
import { useToast } from "@/components/feedback/toast";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ApiError } from "@/lib/api/api-error";
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from "../hooks/use-notification-preferences";
import type { NotificationChannels } from "../schemas/notification-preferences-schema";

type Channel = keyof NotificationChannels;

export function PersonalNotificationChannelManager({
  email,
}: {
  email: string;
}) {
  const toast = useToast();
  const preferences = useNotificationPreferences();
  const updatePreferences = useUpdateNotificationPreferences();
  const [draft, setDraft] = useState<NotificationChannels | null>(null);
  const channels = draft ?? preferences.data?.channels ?? { inSystem: true, email: true };
  const hasChannel = channels.inSystem || channels.email;
  const isDirty =
    draft !== null &&
    (draft.inSystem !== preferences.data?.channels.inSystem ||
      draft.email !== preferences.data?.channels.email);

  const toggleChannel = (channel: Channel) => {
    setDraft((current) => {
      const base = current ?? channels;
      return { ...base, [channel]: !base[channel] };
    });
  };

  const save = () => {
    if (!hasChannel || !isDirty || updatePreferences.isPending) return;
    updatePreferences.mutate(
      { channels },
      {
        onSuccess: () => {
          setDraft(null);
          toast.success(
            "Notification preferences saved",
            "Your choices will apply to future eligible notifications.",
          );
        },
        onError: (error) =>
          toast.error(
            "Preferences were not saved",
            error instanceof ApiError ? error.message : "Review your choices and try again.",
          ),
      },
    );
  };

  return (
    <ProductPanel
      title="Configure Personal Notification Channel"
      description="Choose where SecuraAI should deliver eligible notifications for your account."
    >
      <div className="grid gap-6 p-5 lg:grid-cols-[minmax(0,1fr)_20rem] lg:p-6">
        <div className="space-y-5">
          {preferences.isError ? (
            <Alert className="border-danger/25 bg-danger-soft text-danger">
              Unable to load your saved preferences. Retry before making changes.
            </Alert>
          ) : (
            <Alert className="border-info/25 bg-info-soft text-info">
              <div className="flex items-start gap-2">
                <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                <p>
                  Your choices apply to future notifications that support the
                  selected channels.
                </p>
              </div>
            </Alert>
          )}

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
                checked={channels.inSystem}
                description="Show notifications and reminders inside SecuraAI."
                disabled={preferences.isPending || preferences.isError}
                icon={BellRing}
                label="In-system notifications"
                onChange={() => toggleChannel("inSystem")}
              />
              <ChannelOption
                checked={channels.email}
                description={`Send supported notifications to ${email}.`}
                disabled={preferences.isPending || preferences.isError}
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
            <Button
              disabled={
                !hasChannel ||
                !isDirty ||
                preferences.isPending ||
                preferences.isError ||
                updatePreferences.isPending
              }
              onClick={save}
              type="button"
            >
              {updatePreferences.isPending ? "Saving…" : "Save preferences"}
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
              enabled={channels.inSystem}
              label="In-system"
            />
            <SelectionStatus
              enabled={channels.email}
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
  disabled,
  icon: Icon,
  label,
  onChange,
}: {
  checked: boolean;
  description: string;
  disabled: boolean;
  icon: typeof BellRing;
  label: string;
  onChange: () => void;
}) {
  return (
    <label className="border-border bg-surface hover:bg-neutral-soft flex min-h-32 cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors has-disabled:cursor-not-allowed has-disabled:opacity-60">
      <Checkbox
        checked={checked}
        className="mt-1 shrink-0"
        disabled={disabled}
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
