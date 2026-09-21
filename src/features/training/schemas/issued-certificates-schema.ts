import { z } from "zod";

export const issuedCertificatesSchema = z.object({
  items: z.array(
    z.object({
      id: z.uuid(),
      number: z.string().min(1),
      issuedAt: z.iso.datetime({ offset: true }),
      issuedBy: z.string().nullable(),
      enrollmentId: z.uuid(),
      completedAt: z.iso.datetime({ offset: true }).nullable(),
      learner: z.object({
        name: z.string().min(1),
        email: z.email(),
        employeeCode: z.string().nullable(),
        department: z.string().nullable(),
      }),
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

export type IssuedCertificate = z.infer<
  typeof issuedCertificatesSchema
>["items"][number];
