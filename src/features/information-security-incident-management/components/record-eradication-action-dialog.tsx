"use client";

import { Info, ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { StatusBadge } from "@/components/data-display/static-product";
import { useToast } from "@/components/feedback/toast";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { Incident } from "../schemas/report-incident-schema";

type View = "record" | "history";

const previewHistory = [
  {
    id: "ERA-2026-0018",
    action: "Removed malicious scheduled task",
    target: "FIN-WS-014",
    performedBy: "securityofficer@gmail.com",
    performedAt: "2026-10-06T08:42:00Z",
    verification: "Verified",
  },
  {
    id: "ERA-2026-0017",
    action: "Reset compromised privileged credentials",
    target: "admin-finance account",
    performedBy: "securityofficer@gmail.com",
    performedAt: "2026-10-06T08:15:00Z",
    verification: "Monitoring",
  },
] as const;

export function RecordEradicationActionDialog({
  incident,
  onClose,
}: {
  incident: Incident | undefined;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [view, setView] = useState<View>("record");
  const toast = useToast();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (incident && !dialog.open) {
      setView("record");
      dialog.showModal();
    }
    if (!incident && dialog.open) dialog.close();
  }, [incident]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    toast.info(
      "Eradication action validated",
      "UI preview only. The action was not saved to the incident backend.",
    );
    setView("history");
  };

  return (
    <Dialog
      className="max-h-[calc(100dvh-2rem)] w-[min(46rem,calc(100%-2rem))] overflow-y-auto"
      dialogRef={dialogRef}
      onClose={onClose}
      title="Record eradication action"
    >
      {incident ? (
        <div className="space-y-5">
          <div className="border-border border-b pb-4">
            <p className="text-muted font-mono text-xs">{incident.incidentCode}</p>
            <p className="mt-1 font-semibold">{incident.title}</p>
          </div>
          <div
            aria-label="Eradication action views"
            className="border-border bg-background inline-flex w-full gap-1 rounded-lg border p-1 sm:w-auto"
            role="tablist"
          >
            <Tab active={view === "record"} label="Record action" onClick={() => setView("record")} />
            <Tab active={view === "history"} label="Action history" onClick={() => setView("history")} />
          </div>

          {view === "record" ? (
            <form className="space-y-5" onSubmit={submit}>
              <Alert className="border-info/25 bg-info-soft text-info">
                <div className="flex items-start gap-2">
                  <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                  <p>
                    UI preview for UC61. Record only actions actually completed
                    to remove the root cause, malicious components, or threats.
                  </p>
                </div>
              </Alert>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Action type" htmlFor="eradication-action-type">
                  <Select id="eradication-action-type" defaultValue="malware-removal" required>
                    <option value="malware-removal">Remove malicious component</option>
                    <option value="credential-reset">Reset compromised credentials</option>
                    <option value="vulnerability-remediation">Remediate vulnerability</option>
                    <option value="persistence-removal">Remove persistence mechanism</option>
                    <option value="configuration-fix">Correct insecure configuration</option>
                    <option value="other">Other eradication action</option>
                  </Select>
                </Field>
                <Field label="Performed at" htmlFor="eradication-performed-at">
                  <Input id="eradication-performed-at" type="datetime-local" required />
                </Field>
              </div>
              <Field label="Action summary" htmlFor="eradication-summary">
                <Input id="eradication-summary" minLength={5} maxLength={160} placeholder="e.g. Removed malicious scheduled task" required />
              </Field>
              <Field label="Affected asset, account, or component" htmlFor="eradication-target">
                <Input id="eradication-target" minLength={2} maxLength={160} placeholder="e.g. FIN-WS-014 or privileged account" required />
              </Field>
              <Field label="Threat or root cause removed" htmlFor="eradication-threat">
                <Textarea id="eradication-threat" minLength={10} maxLength={1000} placeholder="Describe the malicious component, persistence mechanism, vulnerability, or root cause removed." required />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Verification result" htmlFor="eradication-verification">
                  <Select id="eradication-verification" defaultValue="verified" required>
                    <option value="verified">Verified removed</option>
                    <option value="monitoring">Removed — monitoring required</option>
                    <option value="follow-up">Follow-up action required</option>
                  </Select>
                </Field>
                <Field label="Evidence reference" htmlFor="eradication-evidence">
                  <Input id="eradication-evidence" maxLength={120} placeholder="Optional evidence ID or log reference" />
                </Field>
              </div>
              <Field label="Implementation and validation notes" htmlFor="eradication-notes">
                <Textarea id="eradication-notes" minLength={10} maxLength={2000} placeholder="Record commands or procedures used, validation performed, and any remaining monitoring requirements." required />
              </Field>
              <Alert>
                Recording an eradication action does not automatically resolve
                or close the incident. Update incident progress separately after
                verification is complete.
              </Alert>
              <div className="border-border flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
                <Button type="button" variant="secondary" onClick={onClose}>Close</Button>
                <Button type="submit"><ShieldCheck aria-hidden="true" className="size-4" />Record action</Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <Alert>Example history for documentation. Production records will come from the incident action API.</Alert>
              <div className="space-y-3">
                {previewHistory.map((entry) => (
                  <article className="border-border rounded-lg border p-4" key={entry.id}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{entry.action}</p>
                        <p className="text-muted mt-1 font-mono text-xs">{entry.id}</p>
                      </div>
                      <StatusBadge tone={entry.verification === "Verified" ? "success" : "warning"}>{entry.verification}</StatusBadge>
                    </div>
                    <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                      <HistoryDetail label="Target" value={entry.target} />
                      <HistoryDetail label="Analyst" value={entry.performedBy} />
                      <HistoryDetail label="Performed" value={formatDate(entry.performedAt)} />
                    </dl>
                  </article>
                ))}
              </div>
              <div className="border-border flex justify-end border-t pt-4">
                <Button type="button" variant="secondary" onClick={onClose}>Close</Button>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </Dialog>
  );
}

function Tab({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return <button aria-selected={active} className={cn("focus-visible:outline-brand min-h-10 flex-1 rounded-md px-3 text-sm font-semibold whitespace-nowrap focus-visible:outline-2 sm:flex-none", active ? "bg-brand text-white" : "text-muted hover:bg-neutral-soft hover:text-foreground")} onClick={onClick} role="tab" type="button">{label}</button>;
}

function Field({ children, htmlFor, label }: { children: ReactNode; htmlFor: string; label: string }) {
  return <div className="space-y-1.5"><Label htmlFor={htmlFor}>{label}</Label>{children}</div>;
}

function HistoryDetail({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-muted text-xs font-medium uppercase">{label}</dt><dd className="mt-1 break-words">{value}</dd></div>;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(new Date(value));
}
