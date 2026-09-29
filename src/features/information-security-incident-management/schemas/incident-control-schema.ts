import { z } from "zod";

const controlSchema = z.object({
  id: z.uuid(),
  controlCode: z.string(),
  name: z.string(),
  applicability: z.string(),
  implementationStatus: z.string(),
});

export const incidentControlOptionsSchema = z.object({
  incident: z.object({
    id: z.uuid(),
    incidentCode: z.string(),
    title: z.string(),
    status: z.string(),
  }),
  controls: z.array(controlSchema.extend({ linked: z.boolean() })),
});
export const linkIncidentControlFormSchema = z.object({
  controlId: z.uuid("Select a security control"),
});
export const linkedIncidentControlSchema = z.object({
  incident: z.object({
    id: z.uuid(),
    incidentCode: z.string(),
    title: z.string(),
  }),
  control: controlSchema,
  linkedAt: z.iso.datetime({ offset: true }),
});
export type LinkIncidentControlForm = z.infer<
  typeof linkIncidentControlFormSchema
>;
