import { z } from "zod";

export const accountAvailabilityBodySchema = z.strictObject({
  reason: z.string().normalize("NFKC").trim()
    .min(10, "Reason must contain at least 10 characters.")
    .max(1000, "Reason must not exceed 1,000 characters."),
});
export const accountAvailabilityResultSchema = z.object({
  id: z.uuid(),
  status: z.enum(["active", "inactive", "locked", "disabled"]),
  disabledAt: z.iso.datetime({ offset: true }).nullable(),
  deletedAt: z.iso.datetime({ offset: true }).nullable(),
  updatedAt: z.iso.datetime({ offset: true }),
  changed: z.boolean(),
});
export type AccountAvailabilityAction = "deactivate" | "remove";
export type AccountAvailabilityInput = z.infer<typeof accountAvailabilityBodySchema>;
export type AccountAvailabilityResult = z.infer<typeof accountAvailabilityResultSchema>;
