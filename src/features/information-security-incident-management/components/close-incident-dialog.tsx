"use client";

import { CheckCircle2, Info } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { StatusBadge } from "@/components/data-display/static-product";
import { useToast } from "@/components/feedback/toast";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { Incident } from "../schemas/report-incident-schema";

type View = "close" | "history";
const requirements = [
  ["response", "Required response and containment actions are complete"],
  ["eradication", "Eradication actions and verification are recorded"],
  ["recovery", "Affected systems or services have been recovered"],
  ["analysis", "Root cause and lessons learned are documented"],
] as const;

export function CloseIncidentDialog({ incident, onClose }: { incident: Incident | undefined; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [view, setView] = useState<View>("close");
  const [confirmed, setConfirmed] = useState<string[]>([]);
  const [error, setError] = useState("");
  const toast = useToast();
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (incident && !dialog.open) { setView("close"); setConfirmed([]); setError(""); dialog.showModal(); }
    if (!incident && dialog.open) dialog.close();
  }, [incident]);
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (confirmed.length !== requirements.length) { setError("Confirm every closure requirement before closing the incident."); return; }
    setError("");
    toast.info("Incident closure validated", "UI preview only. The incident status was not changed in the backend.");
    setView("history");
  };
  return (
    <Dialog className="max-h-[calc(100dvh-2rem)] w-[min(46rem,calc(100%-2rem))] overflow-y-auto" dialogRef={dialogRef} onClose={onClose} title="Close incident">
      {incident ? <div className="space-y-5">
        <div className="border-border flex flex-wrap items-start justify-between gap-3 border-b pb-4"><div><p className="text-muted font-mono text-xs">{incident.incidentCode}</p><p className="mt-1 font-semibold">{incident.title}</p></div><StatusBadge tone="success">Resolved</StatusBadge></div>
        <div aria-label="Incident closure views" className="border-border bg-background inline-flex w-full gap-1 rounded-lg border p-1 sm:w-auto" role="tablist"><Tab active={view === "close"} label="Closure review" onClick={() => setView("close")} /><Tab active={view === "history"} label="Closure history" onClick={() => setView("history")} /></div>
        {view === "close" ? <form className="space-y-5" onSubmit={submit}>
          <Alert className="border-warning/25 bg-warning-soft text-warning"><div className="flex items-start gap-2"><Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" /><p>UI preview for UC64. Closing an incident ends active handling. Verify all required records before confirming.</p></div></Alert>
          <fieldset className="space-y-2"><legend className="text-sm font-semibold">Closure requirements</legend>{requirements.map(([value, label]) => <label className="border-border flex min-h-11 items-start gap-3 rounded-lg border p-3 text-sm" key={value}><Checkbox checked={confirmed.includes(value)} onChange={(event) => { setConfirmed((current) => event.target.checked ? [...current, value] : current.filter((item) => item !== value)); setError(""); }} /><span>{label}</span></label>)}{error ? <p className="text-danger text-sm" role="alert">{error}</p> : null}</fieldset>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5"><Label htmlFor="incident-closure-classification">Closure classification</Label><Select id="incident-closure-classification" defaultValue="resolved" required><option value="resolved">Resolved — root cause removed</option><option value="mitigated">Mitigated — residual limitation accepted</option><option value="duplicate">Duplicate incident</option><option value="false-positive">False positive</option></Select></div>
            <div className="space-y-1.5"><Label htmlFor="incident-closed-at">Closed at</Label><Input id="incident-closed-at" type="datetime-local" required /></div>
          </div>
          <div className="space-y-1.5"><Label htmlFor="incident-closure-summary">Closure summary</Label><Textarea id="incident-closure-summary" minLength={20} maxLength={2500} placeholder="Summarize the response outcome, recovery status, root cause conclusion, and reason the incident is ready to close." required /></div>
          <div className="space-y-1.5"><Label htmlFor="incident-follow-up">Outstanding follow-up</Label><Textarea id="incident-follow-up" maxLength={1500} placeholder="Optional monitoring, control improvement, risk treatment, or ownership follow-up that continues after closure." /></div>
          <div className="border-border flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end"><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit"><CheckCircle2 aria-hidden="true" className="size-4" />Close incident</Button></div>
        </form> : <div className="space-y-4">
          <Alert>Example closure history for documentation. Production history will be retained by the incident and audit APIs.</Alert>
          <article className="border-border rounded-lg border p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-semibold">Incident closure recorded</p><p className="text-muted mt-1 font-mono text-xs">CLS-2026-0004</p></div><StatusBadge tone="success">Closed</StatusBadge></div><dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3"><Detail label="Closed by" value="securityofficer@gmail.com" /><Detail label="Closed at" value="06 Oct 2026, 16:25 UTC" /><Detail label="Classification" value="Resolved" /></dl><p className="text-muted mt-4 text-sm leading-6">Recovery validation completed and preventive improvements were assigned for follow-up.</p></article>
          <div className="border-border flex justify-end border-t pt-4"><Button type="button" variant="secondary" onClick={onClose}>Close</Button></div>
        </div>}
      </div> : null}
    </Dialog>
  );
}

function Tab({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) { return <button aria-selected={active} className={cn("focus-visible:outline-brand min-h-10 flex-1 rounded-md px-3 text-sm font-semibold whitespace-nowrap focus-visible:outline-2 sm:flex-none", active ? "bg-brand text-white" : "text-muted hover:bg-neutral-soft hover:text-foreground")} onClick={onClick} role="tab" type="button">{label}</button>; }
function Detail({ label, value }: { label: string; value: string }) { return <div><dt className="text-muted text-xs font-medium uppercase">{label}</dt><dd className="mt-1 break-words">{value}</dd></div>; }
