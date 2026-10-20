import { z } from "zod";

export const assetTypes = ["APPLICATION", "SERVER", "DATABASE", "ENDPOINT", "NETWORK_DEVICE", "OTHER"] as const;

export const assetTypeSchema = z.enum(assetTypes, { error: "Select a supported asset type" });

export const assetTypeLabels: Record<z.infer<typeof assetTypeSchema>, string> = {
  APPLICATION: "Application",
  SERVER: "Server",
  DATABASE: "Database",
  ENDPOINT: "Endpoint",
  NETWORK_DEVICE: "Network device",
  OTHER: "Other",
};

export function assetTypeLabel(value: string): string {
  const result = assetTypeSchema.safeParse(value);
  return result.success ? assetTypeLabels[result.data] : value;
}
