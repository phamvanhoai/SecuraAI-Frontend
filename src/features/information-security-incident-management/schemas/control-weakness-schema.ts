import { z } from "zod";
const control = z.object({
  id: z.uuid(),
  controlCode: z.string(),
  name: z.string(),
  implementationStatus: z.string(),
});
export const controlWeaknessOptionsSchema = z.object({
  incident: z.object({
    id: z.uuid(),
    incidentCode: z.string(),
    title: z.string(),
    status: z.string(),
  }),
  controls: z.array(control.extend({ hasOpenWeakness: z.boolean() })),
});
export const recordControlWeaknessFormSchema = z.object({
  controlId: z.uuid("Select a linked control"),
  severity: z.enum(["low", "medium", "high", "critical"]),
  description: z
    .string()
    .trim()
    .min(20, "Describe the weakness in at least 20 characters")
    .max(5000),
});
export const recordedControlWeaknessSchema = z.object({
  id: z.uuid(),
  findingType: z.literal("control_weakness"),
  severity: z.string().nullable(),
  description: z.string(),
  source: z.literal("incident"),
  status: z.string(),
  identifiedAt: z.iso.datetime({ offset: true }),
  incident: z.object({
    id: z.uuid(),
    incidentCode: z.string(),
    title: z.string(),
  }),
  control,
});
export const controlWeaknessHistorySchema = z.object({
  incident: z.object({
    id: z.uuid(),
    incidentCode: z.string(),
    title: z.string(),
  }),
  items: z.array(
    z.object({
      id: z.uuid(),
      severity: z.string().nullable(),
      description: z.string(),
      status: z.string(),
      identifiedAt: z.iso.datetime({ offset: true }),
      resolvedAt: z.iso.datetime({ offset: true }).nullable(),
      control: z.object({
        id: z.uuid(),
        controlCode: z.string(),
        name: z.string(),
      }),
      identifiedBy: z.object({
        id: z.uuid(),
        fullName: z.string(),
      }),
    }),
  ),
  pagination: z.object({
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  }),
});
export type ControlWeaknessHistoryItem = z.infer<
  typeof controlWeaknessHistorySchema
>["items"][number];
export type RecordControlWeaknessForm = z.infer<
  typeof recordControlWeaknessFormSchema
>;
