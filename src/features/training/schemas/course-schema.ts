import { z } from "zod";

export const createCourseSchema = z.object({
  title: z.string().trim().min(3, "Enter at least 3 characters.").max(255),
  description: z.string().trim().max(2000),
  content: z.string().trim().min(10, "Enter at least 10 characters.").max(50000),
});

export const courseSchema = z.object({
  id: z.uuid(), title: z.string(), description: z.string().nullable(),
  content: z.string().nullable(), status: z.enum(["draft", "published", "archived"]),
  createdByUserId: z.uuid().nullable(),
  createdAt: z.iso.datetime({ offset: true }),
  updatedAt: z.iso.datetime({ offset: true }),
});

export const courseListSchema = z.object({
  items: z.array(courseSchema),
  pagination: z.object({
    page: z.number().int().min(1), limit: z.number().int().min(1).max(100),
    total: z.number().int().min(0), totalPages: z.number().int().min(0),
  }),
});

export type Course = z.infer<typeof courseSchema>;
export type CreateCourseInput = z.infer<typeof createCourseSchema>;
