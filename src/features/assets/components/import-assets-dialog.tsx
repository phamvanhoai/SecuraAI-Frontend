"use client";

import {
  CheckCircle2,
  CopyX,
  FileSpreadsheet,
  FileUp,
  TriangleAlert,
} from "lucide-react";
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
      toast.success("Import completed", imported.summary.message);
    } catch (error: unknown) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to import the Excel file.",
      );
    }
  };
  return (
    <>
      <Button
        type="button"
        className="bg-surface text-foreground ring-border hover:bg-neutral-soft ring-1"
        onClick={() => dialog.current?.showModal()}
      >
        <FileUp className="size-4" aria-hidden="true" /> Import Excel
      </Button>
      <Dialog
        dialogRef={dialog}
        title="Import Assets from Excel"
        onClose={close}
      >
        <div className="space-y-4">
          <p className="text-muted text-sm">
            Only .xlsx files are accepted, up to 5 MB and 1,000 data rows.
            Invalid rows do not prevent valid rows from being imported.
          </p>
          <input
            ref={input}
            aria-label="Asset Excel file"
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={(event) => chooseFile(event.target.files?.[0])}
          />
          {file ? (
            <p className="text-sm font-medium">Selected: {file.name}</p>
          ) : null}
          {message ? (
            <Alert className="border-danger/25 bg-danger-soft text-danger">
              {message}
            </Alert>
          ) : null}
          {result ? (
            <div className="border-border space-y-4 rounded-lg border p-4 text-sm">
              <div>
                <p className="font-semibold">Import summary</p>
                <p className="text-muted mt-1">{result.summary.message}</p>
              </div>
              <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <SummaryItem
                  icon={FileSpreadsheet}
                  label="Total rows"
                  value={result.summary.totalRows}
                />
                <SummaryItem
                  icon={CheckCircle2}
                  label="Imported"
                  value={result.summary.importedRows}
                  tone="success"
                />
                <SummaryItem
                  icon={CopyX}
                  label="Duplicates"
                  value={result.summary.duplicateRows}
                  tone="warning"
                />
                <SummaryItem
                  icon={TriangleAlert}
                  label="Invalid"
                  value={result.summary.invalidRows}
                  tone="danger"
                />
              </dl>
              {result.errors.length > 0 ? (
                <div>
                  <p className="font-medium">Rows requiring attention</p>
                  <ul className="text-danger mt-2 list-disc space-y-1 pl-5">
                    {result.errors.slice(0, 10).map((error, index) => (
                      <li key={`${error.row}-${error.code}-${index}`}>
                        Row {error.row}: {error.message}
                      </li>
                    ))}
                  </ul>
                  {result.errors.length > 10 ? (
                    <p className="text-muted mt-2">
                      Showing the first 10 of {result.errors.length} issues.
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              className="bg-surface text-foreground ring-border hover:bg-neutral-soft ring-1"
              onClick={close}
            >
              {result ? "Done" : "Close"}
            </Button>
            {!result ? (
              <Button
                type="button"
                disabled={!file || mutation.isPending}
                onClick={submit}
              >
                {mutation.isPending ? "Importing…" : "Import assets"}
              </Button>
            ) : null}
          </div>
        </div>
      </Dialog>
    </>
  );
}

type SummaryTone = "neutral" | "success" | "warning" | "danger";

const summaryToneClasses: Record<SummaryTone, string> = {
  neutral: "bg-neutral-soft text-foreground",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
};

function SummaryItem({
  icon: Icon,
  label,
  value,
  tone = "neutral",
}: {
  icon: typeof FileSpreadsheet;
  label: string;
  value: number;
  tone?: SummaryTone;
}) {
  return (
    <div className={`rounded-lg p-3 ${summaryToneClasses[tone]}`}>
      <dt className="flex items-center gap-1.5 text-xs font-medium">
        <Icon className="size-3.5" aria-hidden="true" />
        {label}
      </dt>
      <dd className="mt-1 text-xl font-semibold tabular-nums">{value}</dd>
    </div>
  );
}
