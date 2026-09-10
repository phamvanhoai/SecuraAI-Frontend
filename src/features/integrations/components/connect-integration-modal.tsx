"use client";

import { Check, Flame, Plus, Server, Shield, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useToast } from "@/components/feedback/toast";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api/api-error";
import { useCreateIntegration } from "../hooks/use-integrations";
import type { IntegrationType } from "../schemas/integration-schema";

type PresetTemplate = {
  id: string;
  name: string;
  type: IntegrationType;
  defaultUrl: string;
  description: string;
  defaultConfig: Record<string, unknown>;
  icon: "siem" | "firewall" | "api";
};

const PRESETS: readonly PresetTemplate[] = [
  {
    id: "splunk",
    name: "Splunk Enterprise SIEM",
    type: "siem",
    defaultUrl: "https://splunk.enterprise.local:8089",
    description: "Collect security logs, threat indicators and SOC alerts from Splunk",
    defaultConfig: {
      authType: "bearer_token",
      token: "splunk_api_token_here",
      index: "security_alerts",
      verifySsl: true,
    },
    icon: "siem",
  },
  {
    id: "wazuh",
    name: "Wazuh SIEM / XDR Manager",
    type: "siem",
    defaultUrl: "https://wazuh.enterprise.local:55000",
    description: "Synchronize endpoint security events, vulnerabilities and anomaly detections",
    defaultConfig: {
      authType: "basic",
      username: "wazuh_admin",
      password: "password_here",
      verifySsl: true,
    },
    icon: "siem",
  },
  {
    id: "fortigate",
    name: "Fortinet FortiGate Firewall",
    type: "firewall",
    defaultUrl: "https://fortigate.enterprise.local/api/v2",
    description: "Monitor network traffic, firewall policies and IDS/IPS logs",
    defaultConfig: {
      authType: "api_key",
      apiKey: "fortigate_api_key_here",
      vdom: "root",
      verifySsl: true,
    },
    icon: "firewall",
  },
  {
    id: "paloalto",
    name: "Palo Alto PAN-OS Firewall",
    type: "firewall",
    defaultUrl: "https://paloalto.enterprise.local/api",
    description: "Integrate access logs, security rules and Threat Prevention alerts",
    defaultConfig: {
      authType: "api_key",
      apiKey: "pan_os_api_key_here",
      logType: "threat",
      verifySsl: true,
    },
    icon: "firewall",
  },
  {
    id: "elastic",
    name: "Elastic SIEM / Elasticsearch",
    type: "siem",
    defaultUrl: "https://elastic.enterprise.local:9200",
    description: "Query ECS logs, alerts and anomaly indices from Elasticsearch",
    defaultConfig: {
      authType: "api_key",
      apiKey: "elastic_api_key_here",
      indexPattern: ".siem-signals-*",
      verifySsl: true,
    },
    icon: "siem",
  },
  {
    id: "custom-api",
    name: "Custom Security API / Log Source",
    type: "api",
    defaultUrl: "https://api.security.local/v1",
    description: "Connect custom enterprise security monitoring system or REST feed",
    defaultConfig: {
      headers: { "X-API-Key": "custom_key" },
    },
    icon: "api",
  },
];

export function ConnectIntegrationModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const toast = useToast();
  const createMutation = useCreateIntegration();

  const [selectedPreset, setSelectedPreset] = useState<string>("splunk");
  const [name, setName] = useState("Splunk Enterprise SIEM");
  const [integrationType, setIntegrationType] = useState<IntegrationType>("siem");
  const [baseUrl, setBaseUrl] = useState("https://splunk.enterprise.local:8089");
  const [configJson, setConfigJson] = useState(
    JSON.stringify(
      {
        authType: "bearer_token",
        token: "splunk_api_token_here",
        index: "security_alerts",
        verifySsl: true,
      },
      null,
      2,
    ),
  );
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  function applyPreset(preset: PresetTemplate) {
    setSelectedPreset(preset.id);
    setName(preset.name);
    setIntegrationType(preset.type);
    setBaseUrl(preset.defaultUrl);
    setConfigJson(JSON.stringify(preset.defaultConfig, null, 2));
    setFormError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    let parsedConfig: Record<string, unknown> | null = null;
    if (configJson.trim()) {
      try {
        parsedConfig = JSON.parse(configJson) as Record<string, unknown>;
        if (typeof parsedConfig !== "object" || parsedConfig === null) {
          setFormError("Configuration must be a valid JSON object.");
          return;
        }
      } catch {
        setFormError("Invalid JSON syntax for configuration. Please check the JSON format.");
        return;
      }
    }

    try {
      await createMutation.mutateAsync({
        name: name.trim(),
        integrationType,
        baseUrl: baseUrl.trim() || null,
        configuration: parsedConfig,
      });

      toast.success(
        "Integration Connected",
        `Successfully registered "${name}". You can now test the connection.`,
      );
      onOpenChange(false);
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : "Unable to create integration. Please try again.";
      setFormError(msg);
    }
  }

  return (
    <dialog
      aria-labelledby="connect-modal-title"
      className="border-border bg-surface text-foreground m-auto max-h-[calc(100dvh-2rem)] w-[min(42rem,calc(100%-2rem))] overflow-y-auto rounded-xl border p-6 backdrop:bg-[#07110f]/55"
      onCancel={(e) => {
        e.preventDefault();
        onOpenChange(false);
      }}
      ref={dialogRef}
    >
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Plus className="text-brand size-5" />
          <h2 id="connect-modal-title" className="text-lg font-semibold">
            Connect New SIEM / Firewall
          </h2>
        </div>
        <button
          aria-label="Close"
          className="text-muted hover:text-foreground p-1"
          onClick={() => onOpenChange(false)}
          type="button"
        >
          <X className="size-4" />
        </button>
      </div>

      <p className="text-muted text-xs mt-2">
        Register an external security information system or firewall API endpoint into SecuraAI.
      </p>

      <form className="space-y-4 py-3" onSubmit={handleSubmit}>
        {formError ? (
          <Alert className="border-danger/25 bg-danger-soft text-danger">
            <p className="text-xs">{formError}</p>
          </Alert>
        ) : null}

        {/* Presets Selector */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted">
            1. Select Preset Template
          </Label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {PRESETS.map((preset) => {
              const isSelected = selectedPreset === preset.id;
              return (
                <button
                  className={`flex flex-col items-start rounded-lg border p-2.5 text-left transition-all ${
                    isSelected
                      ? "border-brand bg-brand-soft/40 ring-brand/30 ring-1"
                      : "border-border hover:bg-neutral-soft/60"
                  }`}
                  key={preset.id}
                  onClick={() => applyPreset(preset)}
                  type="button"
                >
                  <div className="flex w-full items-center justify-between">
                    <div className="text-brand">
                      {preset.icon === "siem" && <Shield className="size-4" />}
                      {preset.icon === "firewall" && <Flame className="size-4" />}
                      {preset.icon === "api" && <Server className="size-4" />}
                    </div>
                    {isSelected ? <Check className="text-brand size-3.5" /> : null}
                  </div>
                  <span className="mt-1.5 text-xs font-semibold leading-tight line-clamp-1">
                    {preset.name}
                  </span>
                  <span className="text-muted mt-0.5 text-[10px] leading-tight line-clamp-2">
                    {preset.description}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-3 pt-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted">
            2. Connection Parameters
          </Label>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs" htmlFor="integration-name">
                Connection Name *
              </Label>
              <Input
                id="integration-name"
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Splunk Production SIEM"
                required
                value={name}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs" htmlFor="integration-type">
                Integration Type *
              </Label>
              <Select
                id="integration-type"
                onChange={(e) =>
                  setIntegrationType(e.target.value as IntegrationType)
                }
                value={integrationType}
              >
                <option value="siem">SIEM (Security Information & Event)</option>
                <option value="firewall">Firewall</option>
                <option value="log_source">Security Log Source</option>
                <option value="api">Custom REST API</option>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs" htmlFor="integration-url">
              Server Base URL (Endpoint) *
            </Label>
            <Input
              id="integration-url"
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://siem.enterprise.local:8089"
              required
              type="url"
              value={baseUrl}
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-xs" htmlFor="integration-config">
                Authentication & Config Headers (JSON)
              </Label>
              <span className="text-muted text-[10px]">Optional</span>
            </div>
            <Textarea
              className="font-mono text-xs"
              id="integration-config"
              onChange={(e) => setConfigJson(e.target.value)}
              rows={4}
              value={configJson}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-border">
          <Button
            className="min-h-9 px-3 text-xs bg-surface text-foreground ring-border hover:bg-neutral-soft ring-1"
            onClick={() => onOpenChange(false)}
            type="button"
          >
            Cancel
          </Button>
          <Button
            className="min-h-9 px-3 text-xs"
            disabled={createMutation.isPending || !name.trim() || !baseUrl.trim()}
            type="submit"
          >
            {createMutation.isPending ? "Connecting..." : "Save & Connect"}
          </Button>
        </div>
      </form>
    </dialog>
  );
}
