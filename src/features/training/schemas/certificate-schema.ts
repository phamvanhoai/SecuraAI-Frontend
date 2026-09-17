import { z } from "zod";

export const trainingCertificateSchema = z.object({
  enrollmentId: z.uuid(),
  learnerName: z.string(),
  courseTitle: z.string(),
  campaignTitle: z.string(),
  completedAt: z.iso.datetime({ offset: true }).nullable(),
  eligible: z.boolean(),
  certificate: z
    .object({
      id: z.uuid(),
      number: z.string().min(1).max(100),
      issuedAt: z.iso.datetime({ offset: true }),
      issuedBy: z.string().nullable(),
    })
    .nullable(),
});
