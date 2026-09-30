import { z } from "zod";

export const incidentAssetOptionsSchema = z.object({
  incident: z.object({
    id: z.uuid(),
    incidentCode: z.string(),
    title: z.string(),
    status: z.string(),
  }),
  assets: z.array(
    z.object({
      id: z.uuid(),
      assetCode: z.string(),
      name: z.string(),
      assetType: z.string(),
      criticality: z.string(),
      linked: z.boolean(),
    }),
  ),
});

export const linkIncidentAssetFormSchema = z.object({
  assetId: z.uuid("Select an active asset"),
});

export const linkedIncidentAssetSchema = z.object({
  incident: z.object({
    id: z.uuid(),
    incidentCode: z.string(),
    title: z.string(),
  }),
  asset: z.object({
    id: z.uuid(),
    assetCode: z.string(),
    name: z.string(),
    criticality: z.string(),
  }),
  linkedAt: z.iso.datetime({ offset: true }),
});

export type LinkIncidentAssetForm = z.infer<typeof linkIncidentAssetFormSchema>;
