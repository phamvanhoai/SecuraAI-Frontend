import { z } from "zod";

export const createUserSchema = z.object({
  email: z.email("Enter a valid email address."),
  fullName: z.string().trim().min(1, "Full name is required."),
  employeeCode: z.string().trim().min(1, "Employee code is required."),
  departmentId: z.uuid("Enter a valid department ID."),
  roleCodes: z.string().trim().min(1, "Enter at least one role code."),
});

export type CreateUserInput = z.input<typeof createUserSchema>;

export type CreateUserPayload = {
  email: string;
  fullName: string;
  employeeCode: string;
  departmentId: string;
  roleCodes: string[];
};

export const createdUserSchema = z.object({
  id: z.string(),
  email: z.email(),
  fullName: z.string(),
  message: z.string().optional(),
});

export type CreatedUser = z.infer<typeof createdUserSchema>;

const userStatusSchema = z.preprocess(
  (value) => (typeof value === "string" ? value.toLowerCase() : value),
  z.enum(["active", "inactive", "locked", "disabled"]),
);

export const userListItemSchema = z.object({
  id: z.coerce.string(),
  email: z.email(),
  fullName: z.string(),
  employeeCode: z.string().nullish().transform((code) => code ?? "Not assigned"),
  status: userStatusSchema,
  department: z
    .object({
      id: z.coerce.string(),
      code: z.string(),
      name: z.string(),
    })
    .nullish(),
  roles: z
    .array(z.object({ code: z.string(), name: z.string() }))
    .nullish()
    .transform((roles) => roles ?? []),
});

export const userListResponseSchema = z.object({
  items: z.array(userListItemSchema),
  pagination: z.object({
    page: z.coerce.number().int().positive(),
    limit: z.coerce.number().int().positive(),
    total: z.coerce.number().int().nonnegative(),
    totalPages: z.coerce.number().int().nonnegative(),
  }),
  summary: z.object({
    active: z.coerce.number().int().nonnegative(),
    inactive: z.coerce.number().int().nonnegative(),
    locked: z.coerce.number().int().nonnegative(),
    disabled: z.coerce.number().int().nonnegative(),
  }),
});

export type UserListQuery = {
  page: number;
  limit: number;
  search?: string;
};

export type UserListResponse = z.infer<typeof userListResponseSchema>;