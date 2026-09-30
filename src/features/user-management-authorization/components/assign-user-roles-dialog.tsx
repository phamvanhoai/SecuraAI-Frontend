"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useToast } from "@/components/feedback/toast";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useAccessAssignmentOptions, useAssignUserAccess, useUserAccessAssignment } from "../hooks/use-assign-user-roles";
import type { AccessAssignmentPayload, AccessScopeInput } from "../api/assign-user-roles";

type RoleCode = AccessAssignmentPayload["role"];
type DraftScope = AccessScopeInput & { key: string };
const ownershipLabels = {
  businessServices: "Business services", assets: "Assets", risks: "Risks",
  treatmentPlans: "Treatment plans", treatmentActions: "Treatment actions",
  securityControls: "Security controls", evidenceItems: "Evidence items", policies: "Policies",
} as const;
const toDatetimeLocal = (value: string | null): string => value ? value.slice(0, 16) : "";

export function AssignUserRolesDialog({ userId, onClose }: { userId: string | null; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const initializedUserId = useRef<string | null>(null);
  const assignment = useUserAccessAssignment(userId);
  // Load these requests sequentially. Both BFF calls may need to rotate the same
  // refresh token, so starting them together can invalidate the user's session.
  const options = useAccessAssignmentOptions(userId !== null && assignment.isSuccess);
  const mutation = useAssignUserAccess();
  const toast = useToast();
  const [role, setRole] = useState<RoleCode>("EMPLOYEE");
  const [scopes, setScopes] = useState<DraftScope[]>([]);
  const [message, setMessage] = useState<string>();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (userId && !dialog?.open) dialog?.showModal();
    if (!userId && dialog?.open) dialog.close();
  }, [userId]);
  useEffect(() => {
    if (!assignment.data || initializedUserId.current === assignment.data.user.id) return;
    initializedUserId.current = assignment.data.user.id;
    setRole(assignment.data.role);
    setScopes(assignment.data.scopes.map((scope) => ({
      key: scope.id, scopeCode: scope.scopeCode, targetType: scope.targetType,
      ...(scope.targetId ? { targetId: scope.targetId } : {}),
      ...(scope.expiresAt ? { expiresAt: toDatetimeLocal(scope.expiresAt) } : {}),
    })));
  }, [assignment.data]);

  function close(): void {
    if (mutation.isPending) return;
    initializedUserId.current = null;
    setMessage(undefined);
    mutation.reset();
    onClose();
  }
  function updateScope(key: string, patch: Partial<DraftScope>): void {
    setScopes((current) => current.map((scope) => scope.key === key ? { ...scope, ...patch } : scope));
  }
  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!userId || mutation.isPending) return;
    if (scopes.some((scope) => !scope.scopeCode || (scope.targetType !== "GLOBAL" && !scope.targetId))) {
      setMessage("Choose a permission code and target for every access scope.");
      return;
    }
    const payloadScopes: AccessScopeInput[] = scopes.map((scope) => ({
      scopeCode: scope.scopeCode,
      targetType: scope.targetType,
      ...(scope.targetType !== "GLOBAL" && scope.targetId ? { targetId: scope.targetId } : {}),
      expiresAt: scope.expiresAt ? new Date(scope.expiresAt).toISOString() : null,
    }));
    try {
      const result = await mutation.mutateAsync({ userId, payload: { role, scopes: payloadScopes } });
      toast.success("Access assignment saved", result.changed ? "Role and supplemental access scopes were updated." : "No access changes were needed.");
      close();
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : "Unable to save access assignment.");
    }
  }

  const loading = assignment.isPending || options.isPending;
  const failed = assignment.isError || options.isError;
  return <Dialog dialogRef={dialogRef} title="Assign role, scope & ownership" onClose={close} onCancel={(event) => { event.preventDefault(); close(); }} className="max-h-[calc(100dvh-2rem)] w-[min(52rem,calc(100%-2rem))] overflow-y-auto">
    {userId ? <form className="space-y-5" onSubmit={(event) => void submit(event)}>
      <div className="bg-neutral-soft rounded-lg p-3"><p className="font-semibold">{assignment.data?.user.fullName ?? "Loading user..."}</p><p className="text-muted text-sm">{assignment.data?.user.email}</p></div>
      {failed ? <Alert className="border-danger/25 bg-danger-soft text-danger">Unable to load access settings. <Button type="button" variant="secondary" onClick={() => { void assignment.refetch(); void options.refetch(); }}>Try again</Button></Alert> : null}
      {loading ? <p className="text-muted py-6 text-sm">Loading access settings...</p> : null}
      {!loading && !failed && options.data && assignment.data ? <>
        <section className="border-border space-y-3 rounded-xl border p-4"><h3 className="font-semibold">Role</h3><Select aria-label="Role" value={role} onChange={(event) => setRole(event.target.value as RoleCode)}>{options.data.roles.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}</Select>{role === "ADMIN" ? <Alert className="border-warning/25 bg-warning-soft text-warning">Administrator grants broad system access.</Alert> : null}</section>
        <section className="border-border space-y-4 rounded-xl border p-4">
          <div className="flex items-center justify-between gap-3"><div><h3 className="font-semibold">Supplemental access scopes</h3><p className="text-muted text-sm">Each scope grants one allow-listed permission globally or for one business service or asset.</p></div><Button type="button" variant="secondary" onClick={() => setScopes((current) => [...current, { key: crypto.randomUUID(), scopeCode: options.data!.scopeCodes[0]?.code ?? "", targetType: "GLOBAL" }])}><Plus className="size-4" />Add scope</Button></div>
          {scopes.length === 0 ? <p className="text-muted text-sm">No supplemental scopes assigned.</p> : null}
          {scopes.map((scope) => <div className="border-border grid gap-3 rounded-lg border p-3 md:grid-cols-[1.4fr_1fr_1.4fr_1fr_auto]" key={scope.key}>
            <label><span className="mb-1 block text-xs font-medium">Permission</span><Select aria-label={`Permission ${scope.key}`} value={scope.scopeCode} onChange={(event) => updateScope(scope.key, { scopeCode: event.target.value })}>{options.data.scopeCodes.map((item) => <option key={item.code} value={item.code}>{item.name} ({item.code})</option>)}</Select></label>
            <label><span className="mb-1 block text-xs font-medium">Target type</span><Select aria-label={`Target type ${scope.key}`} value={scope.targetType} onChange={(event) => updateScope(scope.key, { targetType: event.target.value as DraftScope["targetType"], targetId: undefined })}><option value="GLOBAL">Global</option><option value="BUSINESS_SERVICE">Business service</option><option value="ASSET">Asset</option></Select></label>
            <label><span className="mb-1 block text-xs font-medium">Target</span><Select aria-label={`Target ${scope.key}`} value={scope.targetId ?? ""} disabled={scope.targetType === "GLOBAL"} onChange={(event) => updateScope(scope.key, { targetId: event.target.value || undefined })}><option value="">{scope.targetType === "GLOBAL" ? "Whole organization" : "Select target"}</option>{scope.targetType === "BUSINESS_SERVICE" ? options.data.businessServices.map((item) => <option key={item.id} value={item.id}>{item.name}</option>) : null}{scope.targetType === "ASSET" ? options.data.assets.map((item) => <option key={item.id} value={item.id}>{item.code} — {item.name}</option>) : null}</Select></label>
            <label><span className="mb-1 block text-xs font-medium">Expires</span><Input aria-label={`Expires ${scope.key}`} type="datetime-local" value={scope.expiresAt ?? ""} onChange={(event) => updateScope(scope.key, { expiresAt: event.target.value || null })} /></label>
            <Button type="button" variant="secondary" aria-label={`Remove scope ${scope.scopeCode}`} onClick={() => setScopes((current) => current.filter((item) => item.key !== scope.key))}><Trash2 className="size-4" /></Button>
          </div>)}
        </section>
        <section className="border-border space-y-3 rounded-xl border p-4"><h3 className="font-semibold">Ownership overview</h3><p className="text-muted text-sm">Ownership is managed in each responsible module to protect business workflows. This page only shows the current totals.</p><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{Object.entries(ownershipLabels).map(([key, label]) => <div className="bg-neutral-soft rounded-lg p-3" key={key}><p className="text-muted text-xs">{label}</p><p className="text-lg font-semibold">{assignment.data.ownershipSummary[key as keyof typeof ownershipLabels]}</p></div>)}</div></section>
        {message ? <Alert className="border-danger/25 bg-danger-soft text-danger">{message}</Alert> : null}
        <div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={close}>Cancel</Button><Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Saving..." : "Save"}</Button></div>
      </> : null}
    </form> : null}
  </Dialog>;
}
