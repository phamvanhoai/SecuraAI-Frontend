"use client";

import { FileUp } from "lucide-react";
import { useRef, useState } from "react";
import { useToast } from "@/components/feedback/toast";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useImportAssets } from "../hooks/use-import-assets";
import type { AssetImportResult } from "../schemas/asset-import-schema";

const maxFileSize = 5 * 1024 * 1024;

export function ImportAssetsDialog() {
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File>();
  const [message, setMessage] = useState<string>();
  const [result, setResult] = useState<AssetImportResult>();
  const mutation = useImportAssets();
  const toast = useToast();
  const close = (): void => {
    setFile(undefined);
    setMessage(undefined);
    setResult(undefined);
    dialog.current?.close();
  };
  const chooseFile = (selected: File | undefined): void => {
    setResult(undefined);
    if (!selected) return setFile(undefined);
    if (!selected.name.toLowerCase().endsWith(".xlsx")) {
      setFile(undefined);
      setMessage("Only .xlsx Excel files are accepted.");
      return;
    }
    if (selected.size > maxFileSize) {
      setFile(undefined);
      setMessage("The Excel file must not exceed 5 MB.");
      return;
    }
    setMessage(undefined);
    setFile(selected);
  };
  const submit = async (): Promise<void> => {
    if (!file) return setMessage("Select an Excel file to import.");
    setMessage(undefined);
    try {
      const imported = await mutation.mutateAsync(file);
      setResult(imported);
      toast.success("Import file processed", `${imported.successRows}/${imported.totalRows} rows succeeded.`);
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : "Unable to import the Excel file.");
    }
  };
  return (
    <>
      <Button type="button" className="bg-surface text-foreground ring-border hover:bg-neutral-soft ring-1" onClick={() => dialog.current?.showModal()}>
        <FileUp className="size-4" aria-hidden="true" /> Import Excel
      </Button>
      <Dialog dialogRef={dialog} title="Import Assets from Excel" onClose={close}>
        <div className="space-y-4">
          <p className="text-muted text-sm">Only .xlsx files are accepted, up to 5 MB and 1,000 data rows. Invalid rows do not prevent valid rows from being imported.</p>
          <input ref={input} aria-label="Asset Excel file" type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={(event) => chooseFile(event.target.files?.[0])} />
          {file ? <p className="text-sm font-medium">Selected: {file.name}</p> : null}
          {message ? <Alert className="border-danger/25 bg-danger-soft text-danger">{message}</Alert> : null}
          {result ? (
            <div className="border-border rounded-lg border p-3 text-sm">
              <p>Completed: {result.successRows}/{result.totalRows} rows succeeded, {result.failedRows} rows failed.</p>
              {result.errors.length > 0 ? <ul className="text-danger mt-2 list-disc pl-5">{result.errors.slice(0, 10).map((error) => <li key={`${error.row}-${error.code}`}>Row {error.row}: {error.message}</li>)}</ul> : null}
            </div>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button type="button" className="bg-surface text-foreground ring-border hover:bg-neutral-soft ring-1" onClick={close}>Close</Button>
            <Button type="button" disabled={!file || mutation.isPending} onClick={submit}>{mutation.isPending ? "Importing…" : "Import assets"}</Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
