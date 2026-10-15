"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { FileSpreadsheet, Upload } from "lucide-react";
import { useToast } from "@/components/feedback/toast";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useImportUsers } from "../hooks/use-import-users";
import type { UserImportResult } from "../schemas/user-schema";

export function ImportUsersDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File>();
  const [error, setError] = useState<string>();
  const [result, setResult] = useState<UserImportResult>();
  const mutation = useImportUsers();
  const toast = useToast();

  function resetAndClose(): void {
    setFile(undefined);
    setError(undefined);
    setResult(undefined);
    if (fileInputRef.current) fileInputRef.current.value = "";
    onClose();
  }

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!file) return setError("Choose an Excel file before importing.");
    if (!file.name.toLowerCase().endsWith(".xlsx"))
      return setError("Only .xlsx files are supported.");
    if (file.size > 5 * 1024 * 1024)
      return setError("Excel files may not exceed 5 MB.");
    setError(undefined);
    setResult(undefined);
    try {
      const imported = await mutation.mutateAsync(file);
      if (imported.failed > 0) {
        setResult(imported);
        return;
      }
      resetAndClose();
      toast.success(
        "Users imported successfully",
        `${imported.imported} user${imported.imported === 1 ? "" : "s"} added to the user list.`,
      );
    } catch (reason: unknown) {
      setError(
        reason instanceof Error ? reason.message : "Unable to import users.",
      );
    }
  }

  return (
    <Dialog
      dialogRef={dialogRef}
      title="Import users from Excel"
      onClose={resetAndClose}
    >
      <form className="space-y-4" onSubmit={submit}>
        <div>
          <Label htmlFor="user-import-file">Excel file</Label>
          <input
            ref={fileInputRef}
            id="user-import-file"
            className="sr-only"
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={(event) => {
              setFile(event.target.files?.[0]);
              setError(undefined);
              setResult(undefined);
            }}
            required
          />
          <label
            htmlFor="user-import-file"
            className="border-border bg-surface hover:bg-neutral-soft focus-within:outline-brand mt-1.5 flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border px-4 text-sm font-medium transition-colors focus-within:outline-2 focus-within:outline-offset-2"
          >
            <FileSpreadsheet
              className="text-brand size-5 shrink-0"
              strokeWidth={1.8}
              aria-hidden="true"
            />
            <span className={file ? "truncate" : "text-muted"}>
              {file?.name ?? "Choose Excel file"}
            </span>
          </label>
          <p className="text-muted mt-1 text-xs">
            Maximum 5 MB and 1,000 data rows.
          </p>
          {error ? (
            <p className="text-danger mt-2 text-sm" role="alert">
              {error}
            </p>
          ) : null}
        </div>
        {result ? (
          <Alert
            className={
              result.imported > 0
                ? "border-warning/30 bg-warning/10 text-warning"
                : "border-danger/25 bg-danger/5 text-danger"
            }
          >
            <strong className="block">
              {result.imported > 0
                ? "Import completed with warnings"
                : "Import failed"}
            </strong>
            <p className="mt-1">
              {result.imported > 0
                ? `${result.imported} user${result.imported === 1 ? "" : "s"} imported successfully.`
                : "No users were imported."}
            </p>
            <p>
              {result.failed} row{result.failed === 1 ? " was" : "s were"}{" "}
              {result.imported > 0 ? "skipped." : "not imported."}
            </p>
            {result.errors.length ? (
              <ul className="mt-2 max-h-36 list-disc overflow-auto pl-5 text-sm">
                {result.errors.map((item) => (
                  <li key={`${item.row}-${item.code}`}>
                    Row {item.row}: {item.message}
                  </li>
                ))}
              </ul>
            ) : null}
          </Alert>
        ) : null}
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            disabled={mutation.isPending}
            onClick={resetAndClose}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? (
              <FileSpreadsheet className="size-4" aria-hidden="true" />
            ) : (
              <Upload className="size-4" aria-hidden="true" />
            )}
            {mutation.isPending ? "Importing…" : "Import"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
