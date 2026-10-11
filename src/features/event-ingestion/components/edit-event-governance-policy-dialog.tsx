"use client";

import {
  Calendar,
  FileCheck,
  Save,
  Sparkles,
} from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useToast } from "@/components/feedback/toast";
import { FormField } from "@/components/forms/form-field";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useUpdateEventGovernancePolicy } from "../hooks/use-event-governance";
import {
  updateEventGovernancePolicySchema,
  type EventGovernancePolicy,
  type GovernancePolicyStatus,
} from "../schemas/event-governance-schema";

export type EditEventGovernancePolicyDialogProps = {
  policy: EventGovernancePolicy | null;
  isOpen: boolean;
  onClose: () => void;
};

const accessScopeOptions = [
  { value: "SECURITY_OPERATIONS", label: "Security Operations Only (SecOps / SOC)" },
  { value: "AUDIT_COMPLIANCE", label: "Audit & Compliance Officers" },
  { value: "ALL_SECURITY_ROLES", label: "All Security Roles & Administrators" },
  { value: "CUSTOM", label: "Custom Access Role / Group..." },
];

const complianceTargetPresets = [
  {
    id: "ISO_27001",
    label: "ISO/IEC 27001:2022 A.8.15 — Logging & Monitoring Compliance Target (90 Days Active + 365 Days Archive)",
    defaultPurpose:
      "Maintain audit trails of user activities and security events to comply with ISO/IEC 27001:2022 Control A.8.15",
    suggestedRetention: 90,
  },
  {
    id: "SOC2_TYPE2",
    label: "SOC 2 Type II Trust Services Criteria CC6.8 / CC7.2 (180 Days Active)",
    defaultPurpose:
      "Maintain access and authentication telemetry records for SOC 2 Type II audit examination and forensic readiness",
    suggestedRetention: 180,
  },
  {
    id: "PCI_DSS",
    label: "PCI-DSS v4.0 Requirement 10.5 & 10.7 — Audit Log History (365 Days)",
    defaultPurpose:
      "Retain cardholder data environment access logs for 365 days in compliance with PCI-DSS Req 10.5 & 10.7",
    suggestedRetention: 365,
  },
  {
    id: "INTERNAL_ISMS",
    label: "Internal Corporate ISMS Policy — Operations & AI Anomaly Detection Baseline",
    defaultPurpose:
      "Internal information security policy baseline for continuous telemetry and AI anomaly detection",
    suggestedRetention: 90,
  },
  {
    id: "CUSTOM",
    label: "Custom / Other Compliance Mandate",
    defaultPurpose: "",
    suggestedRetention: 90,
  },
];

function EditPolicyForm({
  policy,
  onClose,
}: {
  policy: EventGovernancePolicy;
  onClose: () => void;
}) {
  const toast = useToast();
  const updateMutation = useUpdateEventGovernancePolicy();

  const matchedPresetInit = complianceTargetPresets.find(
    (p) => p.defaultPurpose === policy.purpose,
  );
  const currentScopeInit = policy.accessScope || "SECURITY_OPERATIONS";
  const matchedScopeInit = accessScopeOptions.find((o) => o.value === currentScopeInit);

  const [name, setName] = useState(policy.name);
  const [selectedPreset, setSelectedPreset] = useState(matchedPresetInit ? matchedPresetInit.id : "CUSTOM");
  const [purpose, setPurpose] = useState(policy.purpose);
  const [retentionDays, setRetentionDays] = useState<number>(policy.retentionDays);
  const [archiveAfterDays, setArchiveAfterDays] = useState<string>(
    policy.archiveAfterDays !== null ? String(policy.archiveAfterDays) : "",
  );
  const [deletionEnabled, setDeletionEnabled] = useState<boolean>(policy.deletionEnabled);
  const [exportAllowed, setExportAllowed] = useState<boolean>(policy.exportAllowed);
  const [selectedScopeOption, setSelectedScopeOption] = useState(
    matchedScopeInit && matchedScopeInit.value !== "CUSTOM" ? matchedScopeInit.value : "CUSTOM",
  );
  const [customScope, setCustomScope] = useState(
    matchedScopeInit && matchedScopeInit.value !== "CUSTOM" ? "" : currentScopeInit,
  );
  const [status, setStatus] = useState<GovernancePolicyStatus>(policy.status);
  const [maskingRulesText, setMaskingRulesText] = useState<string>(
    policy.maskingRules
      ? JSON.stringify(policy.maskingRules, null, 2)
      : '{\n  "maskIp": true\n}',
  );

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const handlePresetChange = (presetId: string) => {
    setSelectedPreset(presetId);
    clearFieldError("purpose");
    const found = complianceTargetPresets.find((p) => p.id === presetId);
    if (found && found.id !== "CUSTOM") {
      setPurpose(found.defaultPurpose);
    }
  };

  const handleApplySuggestedRetention = () => {
    const found = complianceTargetPresets.find((p) => p.id === selectedPreset);
    if (found && found.suggestedRetention) {
      setRetentionDays(found.suggestedRetention);
      toast.info(`Applied ${found.suggestedRetention} days retention recommendation`);
    }
  };

  const clearFieldError = (field: string) => {
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    setFormError(null);
    const errors: Record<string, string> = {};

    let parsedMaskingRules: Record<string, unknown> | null = null;
    if (maskingRulesText.trim()) {
      try {
        const parsed = JSON.parse(maskingRulesText.trim());
        if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
          errors.maskingRules = "Masking rules must be a valid JSON object";
        } else {
          parsedMaskingRules = parsed as Record<string, unknown>;
        }
      } catch {
        errors.maskingRules = "Invalid JSON syntax in masking rules";
      }
    }

    const archiveVal =
      archiveAfterDays.trim() === "" ? null : Number(archiveAfterDays.trim());

    if (archiveVal !== null && (Number.isNaN(archiveVal) || archiveVal <= 0)) {
      errors.archiveAfterDays = "Archival days must be a positive integer";
    }

    if (archiveVal !== null && archiveVal >= retentionDays) {
      errors.archiveAfterDays = `Archival threshold (${archiveVal}d) must be less than retention period (${retentionDays}d)`;
    }

    const resolvedScope =
      selectedScopeOption === "CUSTOM"
        ? customScope.trim() || null
        : selectedScopeOption;

    if (selectedScopeOption === "CUSTOM" && !customScope.trim()) {
      errors.accessScope = "Custom access scope cannot be empty";
    }

    if (!purpose.trim()) {
      errors.purpose = "Business purpose & compliance target is required";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    const payload = {
      name: name.trim(),
      purpose: purpose.trim(),
      retentionDays: Number(retentionDays),
      archiveAfterDays: archiveVal,
      deletionEnabled,
      exportAllowed,
      accessScope: resolvedScope,
      maskingRules: parsedMaskingRules,
      status,
    };

    const validated = updateEventGovernancePolicySchema.safeParse(payload);
    if (!validated.success) {
      const issues = validated.error.issues;
      const nextErrors: Record<string, string> = {};
      for (const issue of issues) {
        const key = issue.path[0];
        if (typeof key === "string") {
          nextErrors[key] = issue.message;
        }
      }
      setFieldErrors(nextErrors);
      return;
    }

    try {
      await updateMutation.mutateAsync({
        id: policy.id,
        values: validated.data,
      });
      toast.success("Event data governance policy updated successfully");
      onClose();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update policy settings";
      setFormError(message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 pt-2">
      {formError ? <Alert>{formError}</Alert> : null}

      {/* Basic Information */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-border pb-2">
          <FileCheck className="h-4 w-4 text-primary" />
          <h4 className="text-sm font-semibold text-foreground">
            Policy Identification & Compliance Target
          </h4>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            id="gov-policy-name"
            label="Policy Name"
            error={fieldErrors.name}
          >
            <Input
              id="gov-policy-name"
              value={name}
              onChange={(e) => {
                clearFieldError("name");
                setName(e.target.value);
              }}
              placeholder="e.g. Authentication Log Retention Policy"
              className="text-xs"
              required
            />
          </FormField>

          <FormField
            id="gov-policy-status"
            label="Enforcement Status"
            error={fieldErrors.status}
          >
            <Select
              id="gov-policy-status"
              value={status}
              onChange={(e) => {
                clearFieldError("status");
                setStatus(e.target.value as GovernancePolicyStatus);
              }}
              className="text-xs"
            >
              <option value="ACTIVE">Active (Enforcing Rules)</option>
              <option value="INACTIVE">Inactive (Paused)</option>
            </Select>
          </FormField>
        </div>

        <FormField
          id="gov-policy-target-preset"
          label="Compliance Target / Legal Mandate Preset"
        >
          <Select
            id="gov-policy-target-preset"
            value={selectedPreset}
            onChange={(e) => handlePresetChange(e.target.value)}
            className="text-xs"
          >
            {complianceTargetPresets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </Select>
          <p className="text-[11px] text-muted mt-1">
            Select a pre-configured retention standard or choose custom mandate.
          </p>
        </FormField>

        <FormField
          id="gov-policy-purpose"
          label="Business Purpose & Retention Justification"
          error={fieldErrors.purpose}
        >
          <textarea
            id="gov-policy-purpose"
            value={purpose}
            onChange={(e) => {
              clearFieldError("purpose");
              setPurpose(e.target.value);
            }}
            placeholder="e.g. Comply with ISO/IEC 27001:2022 A.8.15 requirements..."
            rows={2}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-xs text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-primary"
            required
          />
          <p className="text-[11px] text-muted mt-1">
            State specific regulatory mandate or operational necessity for storing this telemetry.
          </p>
        </FormField>
      </div>

      {/* Retention & Lifecycle Configuration */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <h4 className="text-sm font-semibold text-foreground">
              Lifecycle & Retention Schedule
            </h4>
          </div>
          {selectedPreset !== "CUSTOM" ? (
            <Button
              type="button"
              variant="secondary"
              onClick={handleApplySuggestedRetention}
              className="text-[11px] h-7 gap-1"
            >
              <Sparkles className="h-3 w-3 text-amber-400" />
              Apply Recommended Retention
            </Button>
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            id="gov-policy-retention-days"
            label="Active Retention Period (Days)"
            error={fieldErrors.retentionDays}
          >
            <Input
              id="gov-policy-retention-days"
              type="number"
              min={1}
              max={3650}
              value={retentionDays}
              onChange={(e) => {
                clearFieldError("retentionDays");
                setRetentionDays(Number(e.target.value));
              }}
              className="text-xs"
              required
            />
            <p className="text-[11px] text-muted mt-1">
              Number of days events are retained in operational database.
            </p>
          </FormField>

          <FormField
            id="gov-policy-archive-days"
            label="Cold Storage Archival After (Days)"
            error={fieldErrors.archiveAfterDays}
          >
            <Input
              id="gov-policy-archive-days"
              type="number"
              min={1}
              value={archiveAfterDays}
              onChange={(e) => {
                clearFieldError("archiveAfterDays");
                setArchiveAfterDays(e.target.value);
              }}
              placeholder="e.g. 30 (Leave empty if no cold archival)"
              className="text-xs"
            />
            <p className="text-[11px] text-muted mt-1">
              Optional: Days before archiving to cold storage (must be less than retention).
            </p>
          </FormField>
        </div>

        <div className="grid grid-cols-1 gap-3 rounded-lg border border-border bg-neutral-soft/30 p-3 sm:grid-cols-2">
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={deletionEnabled}
              onChange={(e) => setDeletionEnabled(e.target.checked)}
              className="mt-0.5 rounded border-border text-primary focus:ring-primary h-4 w-4"
            />
            <div className="text-xs">
              <span className="font-medium text-foreground block">
                Automated Expiration Deletion
              </span>
              <span className="text-muted text-[11px]">
                Purge expired telemetry automatically once retention limit is reached.
              </span>
            </div>
          </label>

          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={exportAllowed}
              onChange={(e) => setExportAllowed(e.target.checked)}
              className="mt-0.5 rounded border-border text-primary focus:ring-primary h-4 w-4"
            />
            <div className="text-xs">
              <span className="font-medium text-foreground block">
                Permit Data Export / External SIEM Forwarding
              </span>
              <span className="text-muted text-[11px]">
                Allow exporting normalized events governed by this policy.
              </span>
            </div>
          </label>
        </div>
      </div>

      {/* Access Scope & Privacy Controls */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-border pb-2">
          <FileCheck className="h-4 w-4 text-primary" />
          <h4 className="text-sm font-semibold text-foreground">
            Access Scope & PII Masking Controls
          </h4>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            id="gov-policy-access-scope"
            label="Authorized Access Scope"
            error={fieldErrors.accessScope}
          >
            <Select
              id="gov-policy-access-scope"
              value={selectedScopeOption}
              onChange={(e) => {
                clearFieldError("accessScope");
                setSelectedScopeOption(e.target.value);
              }}
              className="text-xs"
            >
              {accessScopeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
            <p className="text-[11px] text-muted mt-1">
              Define which security roles/teams are permitted to query these events.
            </p>
          </FormField>

          {selectedScopeOption === "CUSTOM" ? (
            <FormField
              id="gov-policy-custom-scope"
              label="Custom Role / Scope Name"
              error={fieldErrors.accessScope}
            >
              <Input
                id="gov-policy-custom-scope"
                value={customScope}
                onChange={(e) => {
                  clearFieldError("accessScope");
                  setCustomScope(e.target.value);
                }}
                placeholder="e.g. INCIDENT_RESPONSE_TIER2"
                className="text-xs"
                required
              />
              <p className="text-[11px] text-muted mt-1">
                Enter internal group or capability identifier.
              </p>
            </FormField>
          ) : (
            <div className="flex items-center text-xs text-muted pt-6">
              Standard role-based policy enforcement applies.
            </div>
          )}
        </div>

        <FormField
          id="gov-policy-masking-rules"
          label="PII & Sensitive Field Masking Rules (JSON)"
          error={fieldErrors.maskingRules}
        >
          <textarea
            id="gov-policy-masking-rules"
            value={maskingRulesText}
            onChange={(e) => {
              clearFieldError("maskingRules");
              setMaskingRulesText(e.target.value);
            }}
            rows={3}
            className="font-mono text-xs w-full rounded-md border border-border bg-surface px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <p className="text-[11px] text-muted mt-1">
            Define field masking transformations (e.g. IP anonymization, user pseudonymization).
          </p>
        </FormField>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
        <Button
          type="button"
          variant="secondary"
          onClick={onClose}
          disabled={updateMutation.isPending}
          className="text-xs"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={updateMutation.isPending}
          className="text-xs gap-1.5"
        >
          <Save className="h-3.5 w-3.5" />
          {updateMutation.isPending ? "Saving Changes..." : "Save Policy Changes"}
        </Button>
      </div>
    </form>
  );
}

export function EditEventGovernancePolicyDialog({
  policy,
  isOpen,
  onClose,
}: EditEventGovernancePolicyDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) {
      dialog.showModal();
    }
    if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  return (
    <Dialog
      title={policy ? `Edit Policy: ${policy.name}` : "Configure Event Data Governance Policy"}
      dialogRef={dialogRef}
      onClose={onClose}
      className="max-h-[calc(100dvh-2rem)] w-[min(50rem,calc(100%-2rem))] overflow-y-auto"
    >
      {policy && isOpen ? (
        <EditPolicyForm key={policy.id} policy={policy} onClose={onClose} />
      ) : null}
    </Dialog>
  );
}
