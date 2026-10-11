import { z } from "zod";
export const applicabilitySchema = z.enum([
  "applicable",
  "not_applicable",
  "under_review",
]);
export const implementationSchema = z.enum([
  "not_implemented",
  "planned",
  "partially_implemented",
  "implemented",
]);
const fields = {
  name: z.string().trim().min(3, "Enter at least 3 characters").max(255),
  description: z
    .string()
    .trim()
    .min(10, "Describe the control in at least 10 characters")
    .max(5000),
  ownerUserId: z.uuid().nullable(),
  applicability: applicabilitySchema,
  implementationStatus: implementationSchema,
};
export const createControlSchema = z
  .object({
    controlCode: z
      .string()
      .trim()
      .min(3)
      .max(100)
      .regex(
        /^[A-Za-z0-9][A-Za-z0-9._-]*$/,
        "Use letters, numbers, dots, underscores or hyphens",
      ),
    ...fields,
  })
  .strict();
export const editControlSchema = z
  .object({
    ...fields,
    expectedUpdatedAt: z.iso.datetime({ offset: true }),
    expectedRevision: z.string().regex(/^[a-f0-9]{64}$/),
    reason: z
      .string()
      .trim()
      .min(10, "Explain the change in at least 10 characters")
      .max(2000),
  })
  .strict();
export const catalogControlSchema = z.object({
  id: z.uuid(),
  controlCode: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  owner: z
    .object({ id: z.uuid(), fullName: z.string(), status: z.string() })
    .nullable(),
  applicability: applicabilitySchema,
  implementationStatus: implementationSchema,
  createdAt: z.iso.datetime({ offset: true }),
  updatedAt: z.iso.datetime({ offset: true }),
  configurationLocked: z.boolean(),
  revision: z.string().regex(/^[a-f0-9]{64}$/),
});
export const controlOwnersSchema = z.object({
  items: z.array(z.object({ id: z.uuid(), fullName: z.string() })).max(10),
});
export type CatalogControl = z.infer<typeof catalogControlSchema>;
export type CreateControl = z.infer<typeof createControlSchema>;
export type EditControl = z.infer<typeof editControlSchema>;
