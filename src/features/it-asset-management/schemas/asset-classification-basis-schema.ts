import { z } from "zod";

export const assetClassificationBasisSchema = z.object({
  dataClassificationBasis: z.string().nullable().default(null),
  dataClassificationMethodVersion: z.string().nullable().default(null),
  confidentialityImpact: z.number().int().min(1).max(5),
  integrityImpact: z.number().int().min(1).max(5),
  availabilityImpact: z.number().int().min(1).max(5),
  businessImpact: z.number().int().min(1).max(5),
  rationale: z.string(),
  methodVersion: z.string(),
  assessedAt: z.iso.datetime({ offset: true }),
  assessedBy: z
    .object({ id: z.uuid(), fullName: z.string(), inactive: z.boolean() })
    .nullable(),
});
