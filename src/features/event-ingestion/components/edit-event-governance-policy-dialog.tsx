"use client";

import {
  Archive,
  Calendar,
  CheckCircle2,
  FileCheck,
  Globe,
  Lock,
  RotateCcw,
  Save,
  Shield,
  Sparkles,
  Trash2,
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

interface EditEventGovernancePolicyDialogProps {
  policy: EventGovernancePolicy | null;
  isOpen: boolean;
  onClose: () => void;
}

const accessScopeOptions = [
  {
    value: "SECURITY_OPERATIONS",
    label: "SECURITY_OPERATIONS — SOC & Incident Response Team",
  },
  {
    value: "AUDIT_COMPLIANCE",
    label: "AUDIT_COMPLIANCE — Internal & External Compliance Auditors",
  },
  {
    value: "SYSTEM_ADMINISTRATION",
    label: "SYSTEM_ADMINISTRATION — Platform & Infrastructure Admins",
  },
  {
    value: "RESTRICTED_FORENSICS",
    label: "RESTRICTED_FORENSICS — Digital Forensics & Deep Investigation",
  },
  {
    value: "GENERAL_MONITORING",
    label: "GENERAL_MONITORING — Standard IT & Service Operations",
  },
  {
    value: "CUSTOM",
    label: "Custom Access Scope...",
  },
];

const complianceTargetPresets = [
  {
    id: "ISO_27001",
    label: "ISO/IEC 27001:2022 (A.8.10 & A.8.15) — Logging & Information Deletion",
    defaultPurpose:
      "Retain and protect event logging integrity for ISO/IEC 27001 audit compliance and security monitoring",
    suggestedRetention: 90,
  },
  {
    id: "SOC_2",
    label: "SOC 2 Type II (CC6.5 & CC6.8) — Logical Access & Audit Trail Retention",
    defaultPurpose:
      "Retain access logs and administrative activity records for SOC 2 Type II compliance audit trails",
    suggestedRetention: 180,
  },
  {
    id: "GDPR",
    label: "GDPR (Article 5(1)(e) & 32) — Privacy Protection & Storage Limitation",
    defaultPurpose:
      "Enforce data minimization, PII masking, and storage limitation governance under GDPR Article 5",
    suggestedRetention: 90,
  },
  {
    id: "NIST_SP_800_92",
    label: "NIST SP 800-92 — Computer Security Log Lifecycle & Archival Management",
    defaultPurpose:
      "Govern log retention and tiered cold archival lifecycle in accordance with NIST SP 800-92 guidelines",
    suggestedRetention: 180,
  },
  {
    id: "PCI_DSS",
    label: "PCI-DSS v4.0 (Req 10.5 & 10.7) — Cardholder Access Log Retention (1 Year)",
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

export function EditEventGovernancePolicyDialog({
  policy,
  isOpen,
  onClose,
}: EditEventGovernancePolicyDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const toast = useToast();
  const updateMutation = useUpdateEventGovernancePolicy();

  const [name, setName] = useState("");
  const [selectedPreset, setSelectedPreset] = useState("ISO_27001");
  const [purpose, setPurpose] = useState("");
  const [retentionDays, setRetentionDays] = useState<number>(90);
  const [archiveAfterDays, setArchiveAfterDays] = useState<string>("");
  const [deletionEnabled, setDeletionEnabled] = useState<boolean>(true);
  const [exportAllowed, setExportAllowed] = useState<boolean>(true);
  const [selectedScopeOption, setSelectedScopeOption] = useState("SECURITY_OPERATIONS");
  const [customScope, setCustomScope] = useState("");
  const [status, setStatus] = useState<GovernancePolicyStatus>("ACTIVE");
  const [maskingRulesText, setMaskingRulesText] = useState<string>("{}");

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

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

  useEffect(() => {
    if (policy && isOpen) {
      setName(policy.name);
      setPurpose(policy.purpose);

      // Match preset if exists
      const matchedPreset = complianceTargetPresets.find(
        (p) => p.defaultPurpose === policy.purpose,
      );
      if (matchedPreset) {
        setSelectedPreset(matchedPreset.id);
      } else {
        setSelectedPreset("CUSTOM");
      }

      setRetentionDays(policy.retentionDays);
      setArchiveAfterDays(
        policy.archiveAfterDays !== null ? String(policy.archiveAfterDays) : "",
      );
      setDeletionEnabled(policy.deletionEnabled);
      setExportAllowed(policy.exportAllowed);

      // Match scope option
      const currentScope = policy.accessScope || "SECURITY_OPERATIONS";
      const matchedScope = accessScopeOptions.find((o) => o.value === currentScope);
      if (matchedScope && matchedScope.value !== "CUSTOM") {
        setSelectedScopeOption(matchedScope.value);
        setCustomScope("");
      } else {
        setSelectedScopeOption("CUSTOM");
        setCustomScope(currentScope);
      }

      setStatus(policy.status);
      setMaskingRulesText(
        policy.maskingRules
          ? JSON.stringify(policy.maskingRules, null, 2)
          : "{\n  \"maskIp\": true\n}",
      );
      setFieldErrors({});
      setFormError(null);
    }
  }, [policy, isOpen]);

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
    if (!policy) return;

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
    <Dialog
      title={policy ? `Edit Policy: ${policy.name}` : "Configure Event Data Governance Policy"}
      dialogRef={dialogRef}
      onClose={onClose}
      className="max-h-[calc(100dvh-2rem)] w-[min(50rem,calc(100%-2rem))] overflow-y-auto"
    >
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
                <option value="ACTIVE">Active (Enforced)</option>
                <option value="INACTIVE">Inactive (Disabled)</option>
              </Select>
            </FormField>
          </div>

          {/* Compliance Preset Dropdown */}
          <div className="space-y-2">
            <FormField
              id="gov-compliance-preset"
              label="Compliance Framework & Target Mandate"
            >
              <Select
                id="gov-compliance-preset"
                value={selectedPreset}
                onChange={(e) => handlePresetChange(e.target.value)}
                className="text-xs"
              >
                {complianceTargetPresets.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.label}
                  </option>
                ))}
              </Select>
            </FormField>

            {/* Purpose Text Input */}
            <FormField
              id="gov-policy-purpose"
              label="Purpose Description & Specific Statement"
              error={fieldErrors.purpose}
            >
              <Input
                id="gov-policy-purpose"
                value={purpose}
                onChange={(e) => {
                  clearFieldError("purpose");
                  setPurpose(e.target.value);
                }}
                placeholder="Enter specific audit justification..."
                className="text-xs"
                required
              />
            </FormField>
          </div>
        </div>

        {/* Retention & Lifecycle Controls */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <h4 className="text-sm font-semibold text-foreground">
                Retention & Lifecycle Rules
              </h4>
            </div>
            {selectedPreset !== "CUSTOM" ? (
              <button
                type="button"
                onClick={handleApplySuggestedRetention}
                className="text-primary hover:underline text-[11px] flex items-center gap-1 font-medium"
              >
                <Sparkles className="h-3 w-3" />
                <span>Apply framework recommended retention</span>
              </button>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              id="gov-retention-days"
              label="Retention Period (Days)"
              error={fieldErrors.retentionDays}
            >
              <Input
                id="gov-retention-days"
                type="number"
                min={1}
                max={3650}
                value={retentionDays}
                onChange={(e) => {
                  clearFieldError("retentionDays");
                  clearFieldError("archiveAfterDays");
                  setRetentionDays(Number(e.target.value));
                }}
                className="text-xs"
                required
              />
            </FormField>

            <FormField
              id="gov-archive-days"
              label="Cold Archival Threshold (Days)"
              error={fieldErrors.archiveAfterDays}
            >
              <Input
                id="gov-archive-days"
                type="number"
                min={1}
                max={3650}
                value={archiveAfterDays}
                onChange={(e) => {
                  clearFieldError("archiveAfterDays");
                  setArchiveAfterDays(e.target.value);
                }}
                placeholder="Leave empty for no cold tier transition"
                className="text-xs"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Automated Purge Toggle */}
            <div className="flex items-start gap-3 rounded-lg border border-border bg-neutral-soft/20 p-3">
              <input
                id="gov-deletion-enabled"
                type="checkbox"
                checked={deletionEnabled}
                onChange={(e) => setDeletionEnabled(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
              <label htmlFor="gov-deletion-enabled" className="text-xs cursor-pointer">
                <strong className="block text-foreground font-medium">
                  Automated Purge & Disposal
                </strong>
                <span className="text-muted block text-[11px] leading-relaxed">
                  Automatically delete expired events when retention threshold is reached.
                </span>
              </label>
            </div>

            {/* Export Policy Toggle */}
            <div className="flex items-start gap-3 rounded-lg border border-border bg-neutral-soft/20 p-3">
              <input
                id="gov-export-allowed"
                type="checkbox"
                checked={exportAllowed}
                onChange={(e) => setExportAllowed(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
              <label htmlFor="gov-export-allowed" className="text-xs cursor-pointer">
                <strong className="block text-foreground font-medium">
                  Allow Data Export
                </strong>
                <span className="text-muted block text-[11px] leading-relaxed">
                  Permit authorized operators to export raw logs for external investigations.
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Access Scope & Masking Rules */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-2">
            <Shield className="h-4 w-4 text-primary" />
            <h4 className="text-sm font-semibold text-foreground">
              Access Scope & PII Masking Rules
            </h4>
          </div>

          {/* Standardized Access Scope Dropdown */}
          <div className="space-y-2">
            <FormField
              id="gov-access-scope-select"
              label="Standardized Access Scope (RBAC)"
              error={fieldErrors.accessScope}
            >
              <Select
                id="gov-access-scope-select"
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
            </FormField>

            {selectedScopeOption === "CUSTOM" ? (
              <FormField
                id="gov-custom-scope-input"
                label="Custom Scope Identifier"
                error={fieldErrors.accessScope}
              >
                <Input
                  id="gov-custom-scope-input"
                  value={customScope}
                  onChange={(e) => {
                    clearFieldError("accessScope");
                    setCustomScope(e.target.value);
                  }}
                  placeholder="e.g. SPECIALIZED_SECURITY_TEAM"
                  className="text-xs"
                  required
                />
              </FormField>
            ) : null}
          </div>

          <FormField
            id="gov-masking-rules"
            label="Masking & PII Rules (JSON)"
            error={fieldErrors.maskingRules}
          >
            <textarea
              id="gov-masking-rules"
              rows={4}
              value={maskingRulesText}
              onChange={(e) => {
                clearFieldError("maskingRules");
                setMaskingRulesText(e.target.value);
              }}
              className="w-full rounded-lg border border-border bg-surface p-2.5 font-mono text-xs leading-relaxed text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder='{\n  "maskIp": true,\n  "hashToken": true\n}'
            />
          </FormField>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="text-xs"
            disabled={updateMutation.isPending}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            variant="primary"
            className="flex items-center gap-1.5 text-xs"
            disabled={updateMutation.isPending}
          >
            <Save className="h-3.5 w-3.5" />
            <span>{updateMutation.isPending ? "Saving..." : "Save Changes"}</span>
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
