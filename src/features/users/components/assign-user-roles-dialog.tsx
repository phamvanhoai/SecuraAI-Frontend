"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useToast } from "@/components/feedback/toast";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog } from "@/components/ui/dialog";
import { useAssignUserRoles, useAssignableRoles } from "../hooks/use-assign-user-roles";
import { useUserDetail } from "../hooks/use-user-detail";

export function AssignUserRolesDialog({ userId, onClose }: { userId: string | null; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [message, setMessage] = useState<string>();
  const detail = useUserDetail(userId);
  const roles = useAssignableRoles(userId !== null);
  const mutation = useAssignUserRoles();
  const toast = useToast();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (userId && !dialog.open) dialog.showModal();
    if (!userId && dialog.open) dialog.close();
  }, [userId]);

  function close(): void {
    if (mutation.isPending) return;
    setSelected([]);
    setMessage(undefined);
    mutation.reset();
    onClose();
  }

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!userId || selected.length === 0 || mutation.isPending) return;
    setMessage(undefined);
    try {
      const result = await mutation.mutateAsync({ userId, roleCodes: selected });
      toast.success("Roles assigned", `${result.assignedRoleCodes.length} role(s) added. The user must sign in again to receive new permissions.`);
      close();
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : "Unable to assign roles. Try again.");
    }
  }

  const assigned = new Set(detail.data?.roles.map((role) => role.code) ?? []);
  const available = roles.data?.filter((role) => !assigned.has(role.code)) ?? [];
  return (
    <Dialog dialogRef={dialogRef} title="Assign user roles" onClose={close}
      onCancel={(event) => { event.preventDefault(); close(); }}
      className="max-h-[calc(100dvh-2rem)] w-[min(36rem,calc(100%-2rem))] overflow-y-auto">
      {userId ? <form className="space-y-4" onSubmit={(event) => { void submit(event); }} aria-busy={mutation.isPending}>
        <div className="bg-neutral-soft rounded-lg p-3">
          <p className="font-semibold break-words">{detail.data?.fullName ?? "Loading user…"}</p>
          <p className="text-muted mt-1 text-sm">Existing roles are kept. The user signs in again for new permissions.</p>
        </div>
        {detail.isError || roles.isError ? <Alert className="border-danger/25 bg-danger-soft text-danger">
          Unable to load user or role options. <Button type="button" variant="secondary" onClick={() => { void detail.refetch(); void roles.refetch(); }}>Try again</Button>
        </Alert> : null}
        {detail.isPending || roles.isPending ? <p className="text-muted py-6 text-sm">Loading roles…</p> : null}
        {!detail.isPending && !roles.isPending && !detail.isError && !roles.isError ? <>
          <fieldset className="space-y-2">
            <legend className="text-sm font-semibold">Roles to add</legend>
            {available.length === 0 ? <p className="text-muted text-sm">All available roles are already assigned.</p> :
              available.map((role) => <label key={role.code} className="border-border flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border p-3">
                <Checkbox value={role.code} checked={selected.includes(role.code)} disabled={mutation.isPending}
                  onChange={(event) => setSelected((current) => event.target.checked ? [...current, role.code] : current.filter((code) => code !== role.code))} />
                <span><span className="block text-sm font-medium">{role.name}</span>
                  <span className="text-muted block text-xs">{role.code}{role.description ? ` — ${role.description}` : ""}</span></span>
              </label>)}
          </fieldset>
          {selected.includes("ADMIN") ? <Alert className="border-warning/25 bg-warning-soft text-warning">
            ADMIN grants broad account-management access. Confirm the recipient before assigning.
          </Alert> : null}
          {message ? <Alert className="border-danger/25 bg-danger-soft text-danger">{message}</Alert> : null}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={close} disabled={mutation.isPending}>Cancel</Button>
            <Button type="submit" disabled={mutation.isPending || selected.length === 0}>
              {mutation.isPending ? "Assigning…" : "Assign roles"}
            </Button>
          </div>
        </> : null}
      </form> : null}
    </Dialog>
  );
}
