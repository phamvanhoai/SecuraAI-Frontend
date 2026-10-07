"use client";

import { BookOpenCheck, Info } from "lucide-react";
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

type View = "analysis" | "history";
const previewHistory = [
  { id: "RCA-2026-0008", version: "Version 2", cause: "Privileged service account remained exempt from MFA enforcement.", analyst: "securityofficer@gmail.com", completedAt: "2026-10-06T14:10:00Z", status: "Final" },
  { id: "RCA-2026-0007", version: "Version 1", cause: "Initial evidence indicated an authentication control gap.", analyst: "securityofficer@gmail.com", completedAt: "2026-10-06T11:30:00Z", status: "Superseded" },
] as const;

export function RootCauseAnalysisDialog({ incident, onClose }: { incident: Incident | undefined; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [view, setView] = useState<View>("analysis");
  const toast = useToast();
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (incident && !dialog.open) { setView("analysis"); dialog.showModal(); }
    if (!incident && dialog.open) dialog.close();
  }, [incident]);
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    toast.info("Root cause analysis validated", "UI preview only. Findings were not saved to the incident backend.");
    setView("history");
  };
  return (
    <Dialog className="max-h-[calc(100dvh-2rem)] w-[min(48rem,calc(100%-2rem))] overflow-y-auto" dialogRef={dialogRef} onClose={onClose} title="Root cause analysis & lessons learned">
      {incident ? <div className="space-y-5">
        <div className="border-border border-b pb-4"><p className="text-muted font-mono text-xs">{incident.incidentCode}</p><p className="mt-1 font-semibold">{incident.title}</p></div>
        <div aria-label="Root cause analysis views" className="border-border bg-background inline-flex w-full gap-1 rounded-lg border p-1 sm:w-auto" role="tablist">
          <Tab active={view === "analysis"} label="Document findings" onClick={() => setView("analysis")} />
          <Tab active={view === "history"} label="Analysis history" onClick={() => setView("history")} />
        </div>
        {view === "analysis" ? <form className="space-y-5" onSubmit={submit}>
          <Alert className="border-info/25 bg-info-soft text-info"><div className="flex items-start gap-2"><Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" /><p>UI preview for UC63. Base conclusions on verified investigation evidence and distinguish the root cause from the incident symptoms.</p></div></Alert>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Root cause category" htmlFor="rca-category"><Select id="rca-category" defaultValue="process" required><option value="people">People</option><option value="process">Process</option><option value="technology">Technology</option><option value="third-party">Third party</option><option value="control-gap">Security control gap</option><option value="multiple">Multiple causes</option></Select></Field>
            <Field label="Analysis completed at" htmlFor="rca-completed-at"><Input id="rca-completed-at" type="datetime-local" required /></Field>
          </div>
          <Field label="Identified root cause" htmlFor="rca-root-cause"><Textarea id="rca-root-cause" minLength={20} maxLength={2000} placeholder="Describe the verified underlying condition that allowed the incident to occur." required /></Field>
          <Field label="Contributing factors" htmlFor="rca-contributing-factors"><Textarea id="rca-contributing-factors" minLength={10} maxLength={2000} placeholder="Record control gaps, process failures, environmental conditions, or human factors that increased impact or likelihood." required /></Field>
          <Field label="Lessons learned" htmlFor="rca-lessons"><Textarea id="rca-lessons" minLength={20} maxLength={2500} placeholder="Explain what worked, what failed, and what the organization should do differently in future incidents." required /></Field>
          <Field label="Recommended improvements" htmlFor="rca-improvements"><Textarea id="rca-improvements" minLength={20} maxLength={2500} placeholder="List preventive control, process, monitoring, training, or technology improvements." required /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Improvement owner" htmlFor="rca-owner"><Input id="rca-owner" minLength={2} maxLength={120} placeholder="Team or responsible person" required /></Field>
            <Field label="Target completion date" htmlFor="rca-target-date"><Input id="rca-target-date" type="date" required /></Field>
          </div>
          <Field label="Evidence and related records" htmlFor="rca-evidence"><Input id="rca-evidence" maxLength={300} placeholder="Evidence IDs, control findings, risks, or investigation references" /></Field>
          <Alert>Saving an RCA documents findings for prevention and improvement. It does not automatically complete improvement actions or close the incident.</Alert>
          <div className="border-border flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end"><Button type="button" variant="secondary" onClick={onClose}>Close</Button><Button type="submit"><BookOpenCheck aria-hidden="true" className="size-4" />Save findings</Button></div>
        </form> : <div className="space-y-4">
          <Alert>Example version history for documentation. Production findings will come from the incident analysis API.</Alert>
          <div className="space-y-3">{previewHistory.map((entry) => <article className="border-border rounded-lg border p-4" key={entry.id}><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-semibold">{entry.version}</p><p className="text-muted mt-1 font-mono text-xs">{entry.id}</p></div><StatusBadge tone={entry.status === "Final" ? "success" : "neutral"}>{entry.status}</StatusBadge></div><p className="mt-3 text-sm leading-6">{entry.cause}</p><dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2"><Detail label="Analyst" value={entry.analyst} /><Detail label="Completed" value={formatDate(entry.completedAt)} /></dl></article>)}</div>
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
