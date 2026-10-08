import type { SystemLogSearchQuery } from "./search-system-logs";

export type ExportInvestigationLogsInput = {
  format: "CSV" | "JSON" | "XLSX" | "PDF";
  scope: "SELECTED" | "FILTERED";
  selectedIds: string[];
  filters: Omit<SystemLogSearchQuery, "page" | "limit">;
  reason: string;
};

export async function exportInvestigationLogs(
  input: ExportInvestigationLogsInput,
) {
  const response = await fetch("/api/system-logs/export", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    const message =
      typeof body === "object" &&
      body &&
      "error" in body &&
      typeof body.error === "object" &&
      body.error &&
      "message" in body.error &&
      typeof body.error.message === "string"
        ? body.error.message
        : "Unable to export investigation logs.";
    throw new Error(message);
  }
  const disposition = response.headers.get("content-disposition") ?? "";
  const filename =
    /filename="([^"]+)"/.exec(disposition)?.[1] ??
    `investigation-logs.${input.format.toLowerCase()}`;
  const sha256 = response.headers.get("x-content-sha256");
  const url = URL.createObjectURL(await response.blob());
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
  return { filename, sha256 };
}
