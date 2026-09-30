"use client";

import { useState, type FormEvent } from "react";
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Database,
  Globe,
  Info,
  KeyRound,
  Layers,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { ProductPanel } from "@/components/data-display/static-product";
import { FormField } from "@/components/forms/form-field";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/feedback/toast";
import { useCreateEventSource } from "../hooks/use-event-sources";
import {
  eventFamilies,
  eventSourceStatuses,
  registerEventSourceFormSchema,
  type RegisterEventSourceFormValues,
  type EventSourceResponse,
} from "../schemas/event-source-schema";
import { TestEventSourceDialog } from "./test-event-source-dialog";

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
    badgeClass: "border-blue-500/30 bg-blue-500/10 text-blue-400",
  },
  VPN_SSO: {
    label: "VPN & Remote SSO Access",
    description:
      "Remote access via OpenVPN, Cisco, Fortinet gateways, and Keycloak/Okta/Azure AD SSO logs.",
    badgeClass: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  },
  APPLICATION_ACCESS: {
    label: "Application & Privilege Access",
    description:
      "Application logins, database authentications, and Windows/Linux privilege use (4672).",
    badgeClass: "border-purple-500/30 bg-purple-500/10 text-purple-400",
  },
} as const;

export interface RegisterEventSourceFormProps {
  onSuccess?: (created: EventSourceResponse) => void;
  onCancel?: () => void;
}

export function RegisterEventSourceForm({
  onSuccess,
  onCancel,
}: RegisterEventSourceFormProps) {
  const toast = useToast();
  const [form, setForm] = useState<RegisterEventSourceFormValues>(defaultValues);
  const [fieldErrors, setFieldErrors] = useState<
    Record<string, string | undefined>
  >({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [connectionHealth, setConnectionHealth] = useState<{
    connected: boolean;
    message: string;
    latencyMs: number;
  } | null>(null);

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
      const message =
        err instanceof Error
          ? err.message
          : "Unable to register event source. Please try again.";
      setSubmitError(message);
      toast.error("Registration failed", message);
    }
  };

  return (
    <ProductPanel
      title="Register Wazuh SIEM Event Source"
      description="Configure SecuraAI to accept Normalized Security Events pushed from Wazuh Edge Normalizer (custom-securaai)."
    >
      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-7" noValidate>
          {submitError ? (
            <Alert className="border-danger/25 bg-danger-soft text-danger">
              <strong className="block font-semibold">Registration Error</strong>
              <p>{submitError}</p>
            </Alert>
          ) : null}

          {/* SECTION 1: Event Source Identity */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-2.5">
              <Database className="h-4 w-4 text-brand" />
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
              <Globe className="h-4 w-4 text-brand" />
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

            <FormField
              id="event-source-secret"
              label="Ingestion Secret Token / API Key"
              error={fieldErrors["secretToken"]}
            >
              <Input
                id="event-source-secret"
                placeholder="YOUR_SECURA_AI_INGEST_TOKEN"
                value={form.secretToken ?? ""}
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, secretToken: e.target.value }));
                }}
                disabled={createMutation.isPending}
              />
            </FormField>

            <div className="flex items-start gap-2.5 rounded-lg border border-info/20 bg-info-soft/40 p-3 text-xs text-foreground">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-info" />
              <span>
                Wazuh Manager (via <code>custom-securaai</code> Edge Normalizer) pushes normalized JSON events to SecuraAI using this webhook endpoint and secret key.
              </span>
            </div>

            {connectionHealth ? (
              connectionHealth.connected ? (
                <div className="border-border bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 flex items-center gap-2.5 rounded-lg border border-emerald-500/20 px-3.5 py-2.5 text-xs">
                  <Activity className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <span className="font-semibold">Connection Verified:</span> Wazuh Manager is reachable and responding ({connectionHealth.latencyMs}ms latency).
                  </div>
                </div>
              ) : (
                <div className="border-border bg-rose-500/10 text-rose-700 dark:text-rose-400 flex items-start gap-2.5 rounded-lg border border-rose-500/20 p-3 text-xs">
                  <AlertCircle className="size-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="font-semibold">Connection Check Failed</p>
                    <p className="text-muted-foreground">{connectionHealth.message}</p>
                  </div>
                </div>
              )
            ) : null}
          </div>

          {/* SECTION 3: Supported Event Families */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-2.5">
              <Layers className="h-4 w-4 text-brand" />
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
                    className={`flex flex-col items-start rounded-lg border p-3.5 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-brand ${
                      isSelected
                        ? "border-brand bg-brand/5 shadow-xs"
                        : "border-border bg-surface hover:border-border/80"
                    }`}
                    disabled={createMutation.isPending}
                  >
                    <div className="flex w-full items-center justify-between">
                      <span className="text-xs font-semibold text-foreground">
                        {meta.label}
                      </span>
                      {isSelected ? (
                        <CheckCircle2 className="h-4 w-4 text-brand" />
                      ) : (
                        <div className="h-4 w-4 rounded-full border border-border" />
                      )}
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-muted">
                      {meta.description}
                    </p>
                    <span
                      className={`mt-3 inline-block rounded-md border px-2 py-0.5 text-[10px] font-mono ${meta.badgeClass}`}
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
              <KeyRound className="h-4 w-4 text-brand" />
              <h3 className="text-sm font-semibold text-foreground">
                4. Description & Operational Notes
              </h3>
            </div>

            <FormField
              id="event-source-description"
              label="Description"
              error={fieldErrors["description"]}
            >
              <textarea
                id="event-source-description"
                rows={3}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-brand focus:outline-none focus:ring-3 focus:ring-brand/15"
                placeholder="Describe the operational scope, monitored hosts, or special ingestion notes..."
                value={form.description ?? ""}
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, description: e.target.value }));
                }}
                disabled={createMutation.isPending}
              />
            </FormField>
          </div>

          {/* FORM ACTIONS */}
          <div className="flex items-center justify-between border-t border-border pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setTestModalOpen(true)}
              className="flex items-center gap-1.5"
            >
              <Activity aria-hidden="true" className="size-4" strokeWidth={1.8} />
              <span>Test connection</span>
            </Button>

            <div className="flex items-center gap-3">
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
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4" />
                    Register event source
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>

      {testModalOpen ? (
        <TestEventSourceDialog
          initialEndpoint={form.endpoint || "https://127.0.0.1:56000"}
          initialUsername={form.username || "wazuh-wui"}
          isOpen={testModalOpen}
          onClose={() => setTestModalOpen(false)}
          onTestComplete={(result) => {
            setConnectionHealth({
              connected: result.connected,
              message: result.message,
              latencyMs: result.latencyMs,
            });
          }}
        />
      ) : null}
    </ProductPanel>
  );
}
