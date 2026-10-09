import { z } from "zod";
export const createBusinessServiceSchema = z
  .object({
    name: z
      .string()
      .trim()
      .transform((value) => value.replace(/\s+/g, " "))
      .pipe(
        z
          .string()
          .min(1, "Enter a service name.")
          .max(255, "Use at most 255 characters."),
      )
      .refine(
        (value) =>
          Array.from(value).every(
            (char) => char.charCodeAt(0) >= 32 && char.charCodeAt(0) !== 127,
          ),
        "Invalid control characters.",
      ),
    description: z
      .string()
      .trim()
      .max(5000, "Use at most 5000 characters.")
      .refine(
        (value) => !value.includes("\u0000"),
        "Invalid control characters.",
      )
      .nullable()
      .optional(),
    ownerUserId: z.uuid().nullable().optional(),
  })
  .strict();
export type CreateBusinessServiceInput = z.input<
  typeof createBusinessServiceSchema
>;
export type CreateBusinessServiceOutput = z.output<
  typeof createBusinessServiceSchema
>;
export const businessServiceOwnerQuerySchema = z
  .object({ q: z.string().trim().max(100).optional() })
  .strict();
export const businessServiceOwnersSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.uuid(),
        fullName: z.string(),
        role: z.enum(["ADMIN", "SECURITY_OFFICER", "EMPLOYEE", "EXECUTIVE"]),
      }),
    )
    .max(10),
});
