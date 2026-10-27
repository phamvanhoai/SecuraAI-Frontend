"use client";

import { useState, type FormEvent } from "react";
import {
  CheckCircle2,
  Database,
  FileText,
  Globe,
  KeyRound,
  Layers,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { FormField } from "@/components/forms/form-field";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/feedback/toast";
import { ApiError } from "@/lib/api/api-error";
import { cn } from "@/lib/utils";
import { useCreateEventSource } from "../hooks/use-event-sources";
import {
  eventFamilies,
  eventSourceStatuses,
  registerEventSourceFormSchema,
  type RegisterEventSourceFormValues,
  type EventSourceResponse,
} from "../schemas/event-source-schema";

const defaultValues: RegisterEventSourceFormValues = {
  name: "",
  sourceType: "WAZUH",
  endpoint: "",
  ingestionMethod: "API",
  authenticationType: "BEARER_TOKEN",
  secretToken: "",
  username: "",
  password: "",
  status: "ACTIVE",
  description: "",
  eventFamilies: ["AUTHENTICATION"],
};

const FAMILY_METADATA = {
  AUTHENTICATION: {
    label: "Authentication & Identity",
    description:
      "Windows logon events (4624, 4625, 4740), Linux SSH/PAM auth, and brute-force attempts.",
    badgeClass:
      "border-sky-500/25 bg-sky-500/10 text-sky-700 dark:text-sky-300 dark:border-sky-500/30",
  },
  VPN_SSO: {
    label: "VPN & Remote SSO Access",
    description:
      "Remote access via OpenVPN, Cisco, Fortinet gateways, and Keycloak/Okta/Azure AD SSO logs.",
    badgeClass:
      "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 dark:border-emerald-500/30",
  },
  APPLICATION_ACCESS: {
    label: "Application & Privilege Access",
    description:
      "Application logins, database authentications, and Windows/Linux privilege use (4672).",
    badgeClass:
      "border-purple-500/25 bg-purple-500/10 text-purple-700 dark:text-purple-300 dark:border-purple-500/30",
  },
} as const;

export interface RegisterEventSourceFormProps {
  onSuccess?: ((created: EventSourceResponse) => void) | undefined;
  onCancel?: (() => void) | undefined;
  hideHeader?: boolean | undefined;
}

export function RegisterEventSourceForm({
  onSuccess,
  onCancel,
  hideHeader = false,
}: RegisterEventSourceFormProps) {
  const toast = useToast();
  const [form, setForm] = useState<RegisterEventSourceFormValues>(defaultValues);
  const [fieldErrors, setFieldErrors] = useState<
    Record<string, string | undefined>
  >({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const createMutation = useCreateEventSource();

  const handleFamilyToggle = (family: (typeof eventFamilies)[number]) => {
    setForm((prev) => {
      const exists = prev.eventFamilies.includes(family);
      const updated = exists
        ? prev.eventFamilies.filter((f) => f !== family)
        : [...prev.eventFamilies, family];
      return { ...prev, eventFamilies: updated };
    });
    if (fieldErrors["eventFamilies"]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next["eventFamilies"];
        return next;
      });
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError(null);

    const validation = registerEventSourceFormSchema.safeParse({
      ...form,
      sourceType: "WAZUH",
      ingestionMethod: "API",
    });

    if (!validation.success) {
      const formattedErrors: Record<string, string> = {};
      for (const issue of validation.error.issues) {
        const path = String(issue.path[0]);
        if (path && !formattedErrors[path]) {
          formattedErrors[path] = issue.message;
        }
      }
      setFieldErrors(formattedErrors);
      return;
    }

    setFieldErrors({});

    try {
      const result = await createMutation.mutateAsync(validation.data);
      toast.success(
        "Event source registered",
        `Wazuh source "${result.name}" has been successfully configured for Webhook push ingestion.`,
      );
      setForm(defaultValues);
      onSuccess?.(result);
    } catch (err: unknown) {
      const isDuplicate =
        (err instanceof ApiError && (err.status === 409 || err.code === "CONFLICT")) ||
        (err instanceof Error &&
          (err.message.toLowerCase().includes("already exists") ||
            err.message.toLowerCase().includes("trùng")));
      const message =
        err instanceof Error
          ? err.message
          : "Unable to register event source. Please try again.";
      if (isDuplicate) {
        setFieldErrors((prev) => ({ ...prev, name: message }));
      }
      setSubmitError(message);
      toast.error("Registration failed", message);
    }
  };

  return (
    <div className="space-y-6">
      {!hideHeader ? (
        <div className="border-border bg-surface rounded-xl border p-5 shadow-xs">
          <h2 className="text-base font-semibold text-foreground">
            Register Wazuh SIEM Event Source
          </h2>
          <p className="text-muted mt-1 text-xs leading-relaxed">
            Configure SecuraAI to accept Normalized Security Events pushed from Wazuh Edge Normalizer (custom-securaai).
          </p>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        {submitError ? (
          <Alert className="border-danger/25 bg-danger-soft text-danger">
            <strong className="block font-semibold">Registration Error</strong>
            <p>{submitError}</p>
          </Alert>
        ) : null}

        {/* SECTION 1: Event Source Identity */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-2.5">
            <Database className="size-4 text-brand" strokeWidth={1.8} />
            <h3 className="text-sm font-semibold text-foreground">
              1. Event Source Identity
            </h3>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              id="event-source-name"
              label="Event source name *"
              error={fieldErrors["name"]}
            >
              <Input
                id="event-source-name"
                placeholder="Wazuh Production Manager"
                value={form.name}
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, name: e.target.value }));
                  if (submitError) {
                    setSubmitError(null);
                  }
                  if (fieldErrors["name"]) {
                    setFieldErrors((p) => {
                      const n = { ...p };
                      delete n["name"];
                      return n;
                    });
                  }
                }}
                disabled={createMutation.isPending}
              />
            </FormField>

            <FormField
              id="event-source-status"
              label="Status *"
              error={fieldErrors["status"]}
            >
              <Select
                id="event-source-status"
                value={form.status}
                onChange={(e) => {
                  setForm((prev) => ({
                    ...prev,
                    status: e.target.value as (typeof eventSourceStatuses)[number],
                  }));
                }}
                disabled={createMutation.isPending}
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </Select>
            </FormField>
          </div>
        </div>

        {/* SECTION 2: Ingestion Webhook & Authentication */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-2.5">
            <Globe className="size-4 text-brand" strokeWidth={1.8} />
            <h3 className="text-sm font-semibold text-foreground">
              2. Ingestion Webhook & Authentication (Push Model)
            </h3>
          </div>

          <FormField
            id="event-source-endpoint"
            label="SecuraAI Ingestion Webhook Endpoint *"
            error={fieldErrors["endpoint"]}
          >
            <Input
              id="event-source-endpoint"
              placeholder="/api/v1/integrations/wazuh/events"
              value={form.endpoint ?? ""}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, endpoint: e.target.value }));
                if (fieldErrors["endpoint"]) {
                  setFieldErrors((p) => {
                    const n = { ...p };
                    delete n["endpoint"];
                    return n;
                  });
                }
              }}
              disabled={createMutation.isPending}
            />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              id="event-source-method"
              label="Ingestion method *"
              error={fieldErrors["ingestionMethod"]}
            >
              <Input
                id="event-source-method"
                value="Webhook / REST API (Push)"
                readOnly
                disabled
                className="bg-neutral-soft/50 text-foreground cursor-not-allowed"
              />
            </FormField>

            <FormField
              id="event-source-auth"
              label="Authentication method *"
              error={fieldErrors["authenticationType"]}
            >
              <Input
                id="event-source-auth"
                value="API Token / Secret Key (Bearer)"
                readOnly
                disabled
                className="bg-neutral-soft/50 text-foreground cursor-not-allowed"
              />
            </FormField>
          </div>

          <div className="flex items-start gap-2.5 rounded-lg border border-info/20 bg-info-soft/30 p-3 text-xs text-foreground">
            <KeyRound className="mt-0.5 size-4 shrink-0 text-brand" strokeWidth={1.8} />
            <span>
              No secret is stored on the event source. The <code className="rounded bg-neutral-soft px-1 py-0.5 font-mono text-xs">custom-securaai</code> integration on Wazuh Manager authenticates with an ingestion API key sent in its <code>&lt;api_key&gt;</code> setting. Create and manage that key (scope <code>events:ingest</code>, linked to this source) under Integration API Keys after registering the source.
            </span>
          </div>
        </div>

        {/* SECTION 3: Supported Event Families */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-2.5">
            <Layers className="size-4 text-brand" strokeWidth={1.8} />
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                3. Supported Event Families
              </h3>
              <p className="text-xs text-muted">
                Select the security event families filtered and normalized by Wazuh Edge Normalizer for AI analysis.
              </p>
            </div>
          </div>

          {fieldErrors["eventFamilies"] ? (
            <p className="text-xs font-medium text-danger">{fieldErrors["eventFamilies"]}</p>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-3">
            {eventFamilies.map((family) => {
              const meta = FAMILY_METADATA[family];
              const isSelected = form.eventFamilies.includes(family);

              return (
                <button
                  key={family}
                  type="button"
                  onClick={() => handleFamilyToggle(family)}
                  className={cn(
                    "flex flex-col items-start rounded-xl border p-3.5 text-left transition-all focus:outline-none focus:ring-2 focus:ring-brand",
                    isSelected
                      ? "border-brand bg-brand-soft/40 shadow-xs ring-1 ring-brand"
                      : "border-border bg-surface hover:border-border/80 hover:bg-neutral-soft/30 text-foreground",
                  )}
                  disabled={createMutation.isPending}
                >
                  <div className="flex w-full items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">
                      {meta.label}
                    </span>
                    {isSelected ? (
                      <CheckCircle2 className="size-4 text-brand" strokeWidth={2} />
                    ) : (
                      <div className="size-4 rounded-full border border-border" />
                    )}
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-muted">
                    {meta.description}
                  </p>
                  <span
                    className={cn(
                      "mt-3 inline-block rounded-md border px-2 py-0.5 text-[10px] font-mono font-medium",
                      meta.badgeClass,
                    )}
                  >
                    {family}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* SECTION 4: Description */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-2.5">
            <FileText className="size-4 text-brand" strokeWidth={1.8} />
            <h3 className="text-sm font-semibold text-foreground">
              4. Description & Operational Notes
            </h3>
          </div>

          <FormField
            id="event-source-description"
            label="Description"
            error={fieldErrors["description"]}
          >
            <Textarea
              id="event-source-description"
              rows={3}
              placeholder="Describe the operational scope, monitored hosts, or special ingestion notes..."
              value={form.description ?? ""}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, description: e.target.value }));
                if (fieldErrors["description"]) {
                  setFieldErrors((previous) => {
                    const next = { ...previous };
                    delete next["description"];
                    return next;
                  });
                }
              }}
              disabled={createMutation.isPending}
            />
          </FormField>
        </div>

        {/* FORM ACTIONS */}
        <div className="flex items-center justify-end gap-2.5 border-t border-border pt-4">
          {onCancel ? (
            <Button
              type="button"
              variant="secondary"
              onClick={onCancel}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
          ) : null}

          <Button
            type="submit"
            disabled={createMutation.isPending}
            className="flex items-center gap-2"
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="size-4" strokeWidth={1.8} />
                <span>Register event source</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
