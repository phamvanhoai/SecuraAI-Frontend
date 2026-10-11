import { z } from "zod";

export const identifyThreatSchema = z.object({
  name: z.string().trim().min(2, "Enter at least 2 characters.").max(255),
  description: z
    .string()
    .trim()
    .min(3, "Describe how the threat could affect this scope.")
    .max(3000),
  vulnerabilityIds: z
    .array(z.uuid())
    .min(1, "Select at least one related vulnerability.")
    .max(50),
});
export const identifiedThreatSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  description: z.string().nullable(),
  vulnerabilities: z.array(z.object({ id: z.uuid(), name: z.string() })),
  createdAt: z.iso.datetime({ offset: true }),
});
export type IdentifyThreatInput = z.infer<typeof identifyThreatSchema>;
export type IdentifiedThreat = z.infer<typeof identifiedThreatSchema>;
