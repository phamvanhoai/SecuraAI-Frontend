import { z } from "zod";
import { businessServiceSchema } from "./business-service-schema";

export const deactivateBusinessServiceSchema = z
  .object({
    expectedUpdatedAt: z.iso.datetime({ offset: true }),
    confirmationName: z
      .string()
      .trim()
      .transform((value) => value.replace(/\s+/g, " "))
      .pipe(z.string().min(1).max(255)),
    reason: z
      .string()
      .trim()
      .min(1, "Enter a reason for deactivation.")
      .max(2000),
  })
  .strict();
export type DeactivateBusinessServiceInput = z.infer<
  typeof deactivateBusinessServiceSchema
>;
export const businessServiceDeactivationCheckSchema = z
  .object({
    service: businessServiceSchema,
    activeAssetsCount: z.number().int().nonnegative(),
    unresolvedRisksCount: z.number().int().nonnegative(),
    canDeactivate: z.boolean(),
  })
  .refine(
    (value) =>
      value.canDeactivate ===
      (value.service.status === "active" &&
        value.activeAssetsCount === 0 &&
        value.unresolvedRisksCount === 0),
    "Inconsistent deactivation eligibility.",
  );
export type BusinessServiceDeactivationCheck = z.infer<
  typeof businessServiceDeactivationCheckSchema
>;
