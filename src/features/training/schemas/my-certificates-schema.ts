import { z } from "zod";

export const myCertificatesSchema = z.object({
  items: z.array(
    z.object({
      id: z.uuid(),
      number: z.string().min(1),
      issuedAt: z.iso.datetime({ offset: true }),
      issuedBy: z.string().nullable(),
      enrollmentId: z.uuid(),
      completedAt: z.iso.datetime({ offset: true }).nullable(),
      campaignTitle: z.string(),
      courseTitle: z.string(),
    }),
  ),
  pagination: z.object({
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().positive(),
  }),
});

export type MyCertificate = z.infer<
  typeof myCertificatesSchema
>["items"][number];
