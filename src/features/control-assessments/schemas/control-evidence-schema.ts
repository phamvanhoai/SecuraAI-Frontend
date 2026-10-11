import { z } from "zod";
export const evidenceDocumentUrlSchema = z
  .string()
  .trim()
  .max(2048)
  .refine(
    (value) =>
      !Array.from(value).some(
        (char) => char.charCodeAt(0) <= 32 || char.charCodeAt(0) === 127,
      ),
    "Document URL cannot contain whitespace or control characters",
  )
  .url()
  .refine((value) => {
    try {
      const url = new URL(value);
      return url.protocol === "https:" && !url.username && !url.password;
    } catch {
      return false;
    }
  }, "Use an HTTPS document URL without embedded credentials")
  .transform((value) => new URL(value).href);
export const addControlEvidenceSchema = z
  .object({
    requestId: z.uuid(),
    name: z
      .string()
      .trim()
      .min(3, "Enter an evidence name (at least 3 characters)")
      .max(255),
    source: z
      .string()
      .trim()
      .min(3, "Describe the source (at least 3 characters)")
      .max(255),
    description: z
      .string()
      .trim()
      .min(10, "Explain the test results and scope (at least 10 characters)")
      .max(5000),
    documentUrl: evidenceDocumentUrlSchema,
    collectedAt: z.iso.datetime({ offset: true }),
    validUntil: z.iso.datetime({ offset: true }).nullable(),
  })
  .strict()
  .refine(
    (value) =>
      !value.validUntil ||
      new Date(value.validUntil) > new Date(value.collectedAt),
    { path: ["validUntil"], message: "Validity must end after collection" },
  );
export const linkControlEvidenceSchema = z
  .object({ evidenceId: z.uuid(), reason: z.string().trim().min(10).max(2000) })
  .strict();
export const listControlEvidenceQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).max(100000).default(1),
    limit: z.coerce.number().int().min(1).max(10).default(10),
    q: z.string().trim().max(100).default(""),
    view: z.enum(["linked", "available"]).default("linked"),
  })
  .strict();
const person = z.object({ id: z.uuid(), fullName: z.string() });
export const controlEvidenceItemSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  source: z.string(),
  description: z.string().nullable(),
  documentUrl: evidenceDocumentUrlSchema.nullable(),
  status: z.enum(["active", "expired", "invalid", "archived"]),
  usable: z.boolean(),
  collectedAt: z.iso.datetime({ offset: true }),
  validFrom: z.iso.datetime({ offset: true }).nullable(),
  validUntil: z.iso.datetime({ offset: true }).nullable(),
  owner: person.nullable(),
  reviewedAt: z.iso.datetime({ offset: true }).nullable(),
  reviewedBy: person.nullable(),
  createdAt: z.iso.datetime({ offset: true }),
});
export const controlEvidenceListSchema = z.object({
  control: z.object({
    id: z.uuid(),
    controlCode: z.string(),
    name: z.string(),
  }),
  canAdd: z.boolean(),
  canLink: z.boolean(),
  items: z
    .array(
      controlEvidenceItemSchema.extend({
        linkedAt: z.iso.datetime({ offset: true }).nullable(),
        linkedBy: person.nullable(),
      }),
    )
    .max(10),
  pagination: z.object({
    page: z.number().int(),
    limit: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
  }),
});
export const addControlEvidenceResultSchema = z.object({
  evidence: controlEvidenceItemSchema,
  created: z.boolean(),
});
export const linkControlEvidenceResultSchema = z.object({
  evidence: controlEvidenceItemSchema,
  linked: z.boolean(),
});
export type AddControlEvidence = z.infer<typeof addControlEvidenceSchema>;
export type LinkControlEvidence = z.infer<typeof linkControlEvidenceSchema>;
export type ControlEvidenceQuery = z.infer<
  typeof listControlEvidenceQuerySchema
>;
export type ControlEvidenceItem = z.infer<
  typeof controlEvidenceListSchema
>["items"][number];
