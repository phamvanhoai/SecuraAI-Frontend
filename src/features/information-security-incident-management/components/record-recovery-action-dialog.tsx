"use client";

import { HeartPulse, Info } from "lucide-react";
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
  { id: "REC-2026-0012", action: "Restored finance workstation from verified image", target: "FIN-WS-014", availability: "Operational", analyst: "securityofficer@gmail.com", performedAt: "2026-10-06T10:20:00Z" },
  { id: "REC-2026-0011", action: "Re-enabled VPN access after credential validation", target: "Corporate VPN", availability: "Monitoring", analyst: "securityofficer@gmail.com", performedAt: "2026-10-06T09:35:00Z" },
] as const;

export function RecordRecoveryActionDialog({ incident, onClose }: { incident: Incident | undefined; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [view, setView] = useState<View>("record");
  const toast = useToast();
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (incident && !dialog.open) { setView("record"); dialog.showModal(); }
    if (!incident && dialog.open) dialog.close();
  }, [incident]);
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    toast.info("Recovery action validated", "UI preview only. The action was not saved to the incident backend.");
    setView("history");
  };
  return (
    <Dialog className="max-h-[calc(100dvh-2rem)] w-[min(46rem,calc(100%-2rem))] overflow-y-auto" dialogRef={dialogRef} onClose={onClose} title="Record recovery action">
      {incident ? <div className="space-y-5">
        <div className="border-border border-b pb-4"><p className="text-muted font-mono text-xs">{incident.incidentCode}</p><p className="mt-1 font-semibold">{incident.title}</p></div>
        <div aria-label="Recovery action views" className="border-border bg-background inline-flex w-full gap-1 rounded-lg border p-1 sm:w-auto" role="tablist">
          <Tab active={view === "record"} label="Record action" onClick={() => setView("record")} />
          <Tab active={view === "history"} label="Action history" onClick={() => setView("history")} />
        </div>
        {view === "record" ? <form className="space-y-5" onSubmit={submit}>
          <Alert className="border-info/25 bg-info-soft text-info"><div className="flex items-start gap-2"><Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" /><p>UI preview for UC62. Record completed steps used to restore affected systems or services to normal operation.</p></div></Alert>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Recovery action type" htmlFor="recovery-action-type"><Select id="recovery-action-type" defaultValue="system-restore" required><option value="system-restore">Restore system or service</option><option value="backup-restore">Restore from backup</option><option value="access-restore">Restore user or network access</option><option value="rebuild">Rebuild affected component</option><option value="configuration-restore">Restore secure configuration</option><option value="other">Other recovery action</option></Select></Field>
            <Field label="Performed at" htmlFor="recovery-performed-at"><Input id="recovery-performed-at" type="datetime-local" required /></Field>
          </div>
          <Field label="Action summary" htmlFor="recovery-summary"><Input id="recovery-summary" minLength={5} maxLength={160} placeholder="e.g. Restored workstation from verified image" required /></Field>
          <Field label="Restored asset or service" htmlFor="recovery-target"><Input id="recovery-target" minLength={2} maxLength={160} placeholder="e.g. FIN-WS-014 or Corporate VPN" required /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Operational status" htmlFor="recovery-status"><Select id="recovery-status" defaultValue="operational" required><option value="operational">Fully operational</option><option value="degraded">Operational with limitations</option><option value="monitoring">Restored — under monitoring</option><option value="failed">Recovery unsuccessful</option></Select></Field>
            <Field label="Monitoring period (hours)" htmlFor="recovery-monitoring-hours"><Input id="recovery-monitoring-hours" defaultValue="24" min="0" max="720" type="number" required /></Field>
          </div>
          <Field label="Validation performed" htmlFor="recovery-validation"><Textarea id="recovery-validation" minLength={10} maxLength={1200} placeholder="Describe health checks, service tests, user validation, or integrity verification completed after restoration." required /></Field>
          <Field label="Recovery notes and remaining limitations" htmlFor="recovery-notes"><Textarea id="recovery-notes" minLength={10} maxLength={2000} placeholder="Record recovery steps, remaining restrictions, follow-up monitoring, and handover details." required /></Field>
          <Alert>Recording recovery work supports progress tracking but does not automatically resolve or close the incident.</Alert>
          <div className="border-border flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end"><Button type="button" variant="secondary" onClick={onClose}>Close</Button><Button type="submit"><HeartPulse aria-hidden="true" className="size-4" />Record action</Button></div>
        </form> : <div className="space-y-4">
          <Alert>Example history for documentation. Production records will come from the incident action API.</Alert>
          <div className="space-y-3">{previewHistory.map((entry) => <article className="border-border rounded-lg border p-4" key={entry.id}><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-semibold">{entry.action}</p><p className="text-muted mt-1 font-mono text-xs">{entry.id}</p></div><StatusBadge tone={entry.availability === "Operational" ? "success" : "warning"}>{entry.availability}</StatusBadge></div><dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3"><Detail label="Restored target" value={entry.target} /><Detail label="Analyst" value={entry.analyst} /><Detail label="Performed" value={formatDate(entry.performedAt)} /></dl></article>)}</div>
          <div className="border-border flex justify-end border-t pt-4"><Button type="button" variant="secondary" onClick={onClose}>Close</Button></div>
        </div>}
      </div> : null}
    </Dialog>
  );
}

function Tab({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) { return <button aria-selected={active} className={cn("focus-visible:outline-brand min-h-10 flex-1 rounded-md px-3 text-sm font-semibold whitespace-nowrap focus-visible:outline-2 sm:flex-none", active ? "bg-brand text-white" : "text-muted hover:bg-neutral-soft hover:text-foreground")} onClick={onClick} role="tab" type="button">{label}</button>; }
function Field({ children, htmlFor, label }: { children: ReactNode; htmlFor: string; label: string }) { return <div className="space-y-1.5"><Label htmlFor={htmlFor}>{label}</Label>{children}</div>; }
function Detail({ label, value }: { label: string; value: string }) { return <div><dt className="text-muted text-xs font-medium uppercase">{label}</dt><dd className="mt-1 break-words">{value}</dd></div>; }
function formatDate(value: string) { return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(new Date(value)); }
