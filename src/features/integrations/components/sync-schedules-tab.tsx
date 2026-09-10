"use client";

import { Calendar, Clock, Plus, Power, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useToast } from "@/components/feedback/toast";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCreateSyncSchedule,
  useDeleteSyncSchedule,
  useSyncSchedules,
  useUpdateSyncSchedule,
} from "../hooks/use-integrations";
import type { SyncSchedule } from "../schemas/integration-schema";

const CRON_PRESETS = [
  { label: "Every 15 min", expr: "*/15 * * * *" },
  { label: "Hourly", expr: "0 * * * *" },
  { label: "Every 6 hours", expr: "0 */6 * * *" },
  { label: "Daily at midnight", expr: "0 0 * * *" },
] as const;

export function SyncSchedulesTab({
  integrationId,
}: {
  integrationId: string;
}) {
  const toast = useToast();
  const schedulesQuery = useSyncSchedules(integrationId);
  const createMutation = useCreateSyncSchedule();
  const updateMutation = useUpdateSyncSchedule();
  const deleteMutation = useDeleteSyncSchedule();

  const [newCron, setNewCron] = useState("*/15 * * * *");
  const [showAddForm, setShowAddForm] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [scheduleToDelete, setScheduleToDelete] = useState<SyncSchedule | null>(
    null,
  );
  const deleteDialogRef = useRef<HTMLDialogElement>(null);

  const schedules: readonly SyncSchedule[] = schedulesQuery.data ?? [];

  useEffect(() => {
    const dialog = deleteDialogRef.current;
    if (!dialog) return;
    if (scheduleToDelete && !dialog.open) dialog.showModal();
    if (!scheduleToDelete && dialog.open) dialog.close();
  }, [scheduleToDelete]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    try {
      await createMutation.mutateAsync({
        integrationId,
        input: {
          scheduleExpression: newCron.trim(),
          isActive: true,
        },
      });
      toast.success("Schedule Added", `Cron: ${newCron}`);
      setShowAddForm(false);
    } catch {
      setErrorMsg("Unable to create sync schedule. Please verify the cron expression format.");
    }
  }

  async function handleToggle(schedule: SyncSchedule) {
    try {
      await updateMutation.mutateAsync({
        integrationId,
        scheduleId: schedule.id,
        input: { isActive: !schedule.isActive },
      });
      toast.success(
        schedule.isActive ? "Schedule Paused" : "Schedule Activated",
        schedule.scheduleExpression,
      );
    } catch {
      toast.error("Action Failed", "Could not update sync schedule status.");
    }
  }

  async function handleConfirmDelete() {
    if (!scheduleToDelete) return;
    try {
      await deleteMutation.mutateAsync({
        integrationId,
        scheduleId: scheduleToDelete.id,
      });
      toast.success(
        "Schedule Deleted",
        `Cron: ${scheduleToDelete.scheduleExpression}`,
      );
      setScheduleToDelete(null);
    } catch {
      toast.error("Delete Failed", "An error occurred while deleting the schedule.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Automatic Log Synchronization Schedules</h3>
          <p className="text-muted text-xs">
            The system periodically pulls and ingests event logs based on these schedules.
          </p>
        </div>
        <Button
          className="min-h-9 px-3 text-xs bg-surface text-foreground ring-border hover:bg-neutral-soft ring-1"
          onClick={() => setShowAddForm(!showAddForm)}
          type="button"
        >
          <Plus className="mr-1 size-3.5" />
          {showAddForm ? "Hide" : "Add Schedule"}
        </Button>
      </div>

      {showAddForm ? (
        <form
          className="border-border bg-neutral-soft/40 space-y-3 rounded-lg border p-3.5 text-xs"
          onSubmit={handleCreate}
        >
          {errorMsg ? (
            <Alert className="border-danger/25 bg-danger-soft text-danger">
              <p>{errorMsg}</p>
            </Alert>
          ) : null}

          <div className="space-y-1.5">
            <Label className="text-xs" htmlFor="cron-input">
              Cron Expression (5 fields: minute hour day month weekday)
            </Label>
            <Input
              className="font-mono text-xs"
              id="cron-input"
              onChange={(e) => setNewCron(e.target.value)}
              placeholder="*/15 * * * *"
              required
              value={newCron}
            />
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            <span className="text-muted self-center text-[11px]">Quick Presets:</span>
            {CRON_PRESETS.map((preset) => (
              <button
                className={`rounded-md border px-2 py-1 text-[11px] transition-colors ${
                  newCron === preset.expr
                    ? "border-brand bg-brand-soft text-brand font-medium"
                    : "border-border bg-surface hover:bg-neutral-soft text-foreground"
                }`}
                key={preset.expr}
                onClick={() => setNewCron(preset.expr)}
                type="button"
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              className="min-h-8 px-2.5 text-xs bg-surface text-foreground ring-border hover:bg-neutral-soft ring-1"
              onClick={() => setShowAddForm(false)}
              type="button"
            >
              Cancel
            </Button>
            <Button
              className="min-h-8 px-2.5 text-xs"
              disabled={createMutation.isPending || !newCron.trim()}
              type="submit"
            >
              {createMutation.isPending ? "Creating..." : "Create Schedule"}
            </Button>
          </div>
        </form>
      ) : null}

      {schedulesQuery.isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      ) : schedules.length === 0 ? (
        <div className="border-border rounded-lg border border-dashed p-6 text-center text-xs text-muted">
          No automatic synchronization schedules configured for this integration yet.
        </div>
      ) : (
        <div className="divide-border border-border divide-y rounded-lg border">
          {schedules.map((schedule) => (
            <div
              className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between"
              key={schedule.id}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="bg-neutral-soft font-mono text-xs font-semibold px-2 py-0.5 rounded border border-border">
                    {schedule.scheduleExpression}
                  </span>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${
                      schedule.isActive
                        ? "bg-success-soft text-success border border-success/20"
                        : "bg-neutral-soft text-muted border border-border"
                    }`}
                  >
                    {schedule.isActive ? "Active" : "Paused"}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-[11px] text-muted">
                  <span className="flex items-center gap-1">
                    <Clock className="size-3" />
                    Last run:{" "}
                    {schedule.lastRunAt
                      ? new Date(schedule.lastRunAt).toLocaleString("en-US")
                      : "Never run"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="size-3" />
                    Next run:{" "}
                    {schedule.nextRunAt
                      ? new Date(schedule.nextRunAt).toLocaleString("en-US")
                      : "—"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  className="min-h-8 px-2.5 text-xs bg-surface text-foreground ring-border hover:bg-neutral-soft ring-1"
                  onClick={() => handleToggle(schedule)}
                  type="button"
                >
                  <Power
                    className={`mr-1 size-3 ${schedule.isActive ? "text-success" : "text-muted"}`}
                  />
                  {schedule.isActive ? "Pause" : "Activate"}
                </Button>
                <Button
                  aria-label="Delete schedule"
                  className="min-h-8 px-2 text-xs bg-surface text-danger ring-border hover:bg-neutral-soft ring-1"
                  onClick={() => setScheduleToDelete(schedule)}
                  type="button"
                >
                  <Trash2 className="size-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Confirm Delete Schedule */}
      <Dialog
        className="w-[min(28rem,calc(100%-2rem))]"
        dialogRef={deleteDialogRef}
        onCancel={(e) => {
          e.preventDefault();
          setScheduleToDelete(null);
        }}
        onClose={() => setScheduleToDelete(null)}
        title="Confirm Delete Schedule"
      >
        <div className="space-y-4">
          <Alert className="border-danger/25 bg-danger-soft text-danger text-xs">
            This action will permanently delete this synchronization schedule from the system.
          </Alert>
          <p className="text-xs text-foreground leading-relaxed">
            Are you sure you want to delete the schedule expression{" "}
            <strong className="bg-neutral-soft font-mono px-1.5 py-0.5 rounded border border-border">
              {scheduleToDelete?.scheduleExpression}
            </strong>
            ?
          </p>
          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button
              className="min-h-9 px-3 text-xs bg-surface text-foreground ring-border hover:bg-neutral-soft ring-1"
              onClick={() => setScheduleToDelete(null)}
              type="button"
            >
              Cancel
            </Button>
            <Button
              className="min-h-9 px-3 text-xs bg-danger text-white hover:opacity-90"
              disabled={deleteMutation.isPending}
              onClick={handleConfirmDelete}
              type="button"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Schedule"}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
