"use client";

import {
  Archive,
  Clock3,
  Database,
  Info,
  Pencil,
  ShieldCheck,
} from "lucide-react";
import { useRef } from "react";
import {
  ProductPanel,
  StatusBadge,
} from "@/components/data-display/static-product";
import { useToast } from "@/components/feedback/toast";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

const retentionRules = [
  {
    dataClass: "Normalized security events",
    activeRetention: "90 days",
    archiveRetention: "12 months",
    finalAction: "Secure deletion",
  },
  {
    dataClass: "AI anomaly alerts",
    activeRetention: "12 months",
    archiveRetention: "24 months",
    finalAction: "Secure deletion",
  },
  {
    dataClass: "Incident-linked events",
    activeRetention: "Until incident closure",
    archiveRetention: "7 years after closure",
    finalAction: "Compliance review",
  },
  {
    dataClass: "Audit records",
    activeRetention: "24 months",
    archiveRetention: "7 years",
    finalAction: "Secure deletion",
  },
] as const;

const lifecycleSteps = [
  {
    name: "Ingest",
    description:
      "Validate source, normalize timestamps to UTC, and assign an immutable event identifier.",
  },
  {
    name: "Active storage",
    description:
      "Keep searchable event data available to detection, triage, and investigation workflows.",
  },
  {
    name: "Archive",
    description:
      "Move eligible records to encrypted archive storage after the active retention period.",
  },
  {
    name: "Dispose or retain",
    description:
      "Securely delete expired records unless a legal hold or linked investigation requires retention.",
  },
] as const;

export function EventDataGovernancePolicy() {
  const updateDialog = useRef<HTMLDialogElement>(null);
  const toast = useToast();
  return (
    <>
      <div className="space-y-5">
      <Alert className="border-info/25 bg-info-soft text-info">
        <div className="flex items-start gap-2">
          <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <p>
            UI preview for UC82. These example policy values are provided for
            documentation and will be replaced by the approved governance
            policy API.
          </p>
        </div>
      </Alert>

      <div className="flex justify-end">
        <Button type="button" onClick={() => updateDialog.current?.showModal()}>
          <Pencil aria-hidden="true" className="size-4" />
          Update policy
        </Button>
      </div>

      <ProductPanel
        title="Current event data governance policy"
        description="Retention, archival, and lifecycle rules applied to security event data."
      >
        <dl className="grid gap-px bg-border sm:grid-cols-2 xl:grid-cols-4">
          <PolicyFact label="Policy version" value="EVT-GOV-2.1" />
          <PolicyFact label="Effective date" value="01 Oct 2026" />
          <PolicyFact label="Policy owner" value="Security Administration" />
          <div className="bg-surface p-4">
            <dt className="text-muted text-xs font-medium tracking-wide uppercase">
              Status
            </dt>
            <dd className="mt-2">
              <StatusBadge tone="success">Active</StatusBadge>
            </dd>
          </div>
        </dl>
      </ProductPanel>

      <ProductPanel
        title="Retention schedule"
        description="How long each event-data category remains active and archived."
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-background text-muted border-border border-b text-xs tracking-wide uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Data category</th>
                <th className="px-4 py-3 font-medium">Active retention</th>
                <th className="px-4 py-3 font-medium">Archive retention</th>
                <th className="px-4 py-3 font-medium">End-of-life action</th>
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {retentionRules.map((rule) => (
                <tr key={rule.dataClass}>
                  <td className="px-4 py-3 font-medium">{rule.dataClass}</td>
                  <td className="px-4 py-3">{rule.activeRetention}</td>
                  <td className="px-4 py-3">{rule.archiveRetention}</td>
                  <td className="px-4 py-3">{rule.finalAction}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ProductPanel>

      <div className="grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
        <ProductPanel
          title="Data lifecycle"
          description="Standard handling from collection through final disposition."
        >
          <ol className="divide-border divide-y px-4">
            {lifecycleSteps.map((step, index) => (
              <li className="flex gap-3 py-4" key={step.name}>
                <span className="bg-brand-soft text-brand grid size-8 shrink-0 place-items-center rounded-lg text-sm font-semibold">
                  {index + 1}
                </span>
                <div>
                  <p className="text-sm font-semibold">{step.name}</p>
                  <p className="text-muted mt-1 text-sm leading-6">
                    {step.description}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </ProductPanel>

        <ProductPanel
          title="Archival safeguards"
          description="Controls applied while retained data is archived."
        >
          <ul className="space-y-4 p-4 text-sm">
            <Safeguard
              icon={Archive}
              text="Encrypted archival storage with access restricted to authorized administrators."
            />
            <Safeguard
              icon={ShieldCheck}
              text="Legal holds suspend disposal for records linked to an active investigation."
            />
            <Safeguard
              icon={Database}
              text="Integrity metadata is retained to support traceability and evidence review."
            />
            <Safeguard
              icon={Clock3}
              text="Retention jobs run daily and record archival or disposal outcomes in the audit log."
            />
          </ul>
        </ProductPanel>
      </div>
      </div>

      <Dialog
        className="max-h-[calc(100dvh-2rem)] max-w-3xl overflow-y-auto"
        dialogRef={updateDialog}
        title="Update event data governance policy"
      >
        <form
          className="space-y-6"
          onSubmit={(event) => {
            event.preventDefault();
            updateDialog.current?.close();
            toast.info(
              "Policy settings validated",
              "UI preview only. No governance settings were saved to the backend.",
            );
          }}
        >
          <Alert>
            This preview validates the form locally. Saving to the active
            policy requires the governance API.
          </Alert>

          <fieldset className="space-y-4">
            <legend className="text-sm font-semibold">Retention periods</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <NumberField
                defaultValue="90"
                id="normalized-active-days"
                label="Normalized events — active days"
                min="1"
              />
              <NumberField
                defaultValue="12"
                id="normalized-archive-months"
                label="Normalized events — archive months"
                min="1"
              />
              <NumberField
                defaultValue="24"
                id="audit-active-months"
                label="Audit records — active months"
                min="1"
              />
              <NumberField
                defaultValue="7"
                id="audit-archive-years"
                label="Audit records — archive years"
                min="1"
              />
            </div>
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="text-sm font-semibold">Archival rules</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <NumberField
                defaultValue="90"
                id="archive-threshold-days"
                label="Archive after inactive days"
                min="1"
              />
              <div className="space-y-1.5">
                <Label htmlFor="archive-storage-tier">Archive storage tier</Label>
                <Select id="archive-storage-tier" defaultValue="encrypted-cold">
                  <option value="encrypted-cold">Encrypted cold storage</option>
                  <option value="encrypted-warm">Encrypted warm storage</option>
                </Select>
                <p className="text-muted text-xs">
                  Applies after the active retention period ends.
                </p>
              </div>
            </div>
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="text-sm font-semibold">Lifecycle rules</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="end-of-life-action">Default end-of-life action</Label>
                <Select id="end-of-life-action" defaultValue="secure-delete">
                  <option value="secure-delete">Secure deletion</option>
                  <option value="compliance-review">Compliance review</option>
                  <option value="retain">Retain indefinitely</option>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="retention-job-frequency">Retention job frequency</Label>
                <Select id="retention-job-frequency" defaultValue="daily">
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </Select>
              </div>
            </div>
            <label className="border-border flex min-h-11 items-start gap-3 rounded-lg border p-3 text-sm">
              <Checkbox defaultChecked id="honor-legal-holds" />
              <span>
                <span className="block font-medium">Honor legal holds</span>
                <span className="text-muted mt-1 block leading-5">
                  Suspend archival disposal when records are linked to an active
                  legal hold or investigation.
                </span>
              </span>
            </label>
          </fieldset>

          <div className="border-border flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => updateDialog.current?.close()}
            >
              Cancel
            </Button>
            <Button type="submit">Save policy</Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}

function NumberField({
  defaultValue,
  id,
  label,
  min,
}: {
  defaultValue: string;
  id: string;
  label: string;
  min: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        defaultValue={defaultValue}
        id={id}
        inputMode="numeric"
        min={min}
        required
        type="number"
      />
      <p className="text-muted text-xs">Enter a whole number of at least {min}.</p>
    </div>
  );
}

function PolicyFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface p-4">
      <dt className="text-muted text-xs font-medium tracking-wide uppercase">
        {label}
      </dt>
      <dd className="mt-2 text-sm font-semibold">{value}</dd>
    </div>
  );
}

function Safeguard({
  icon: Icon,
  text,
}: {
  icon: typeof Archive;
  text: string;
}) {
  return (
    <li className="flex gap-3">
      <span className="bg-neutral-soft text-muted grid size-9 shrink-0 place-items-center rounded-lg">
        <Icon aria-hidden="true" className="size-4" strokeWidth={1.8} />
      </span>
      <span className="leading-6">{text}</span>
    </li>
  );
}
