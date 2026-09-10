import { z } from "zod";

export const permissionSchema = z.object({
  id: z.uuid(),
  code: z.string(),
  module: z.string(),
  action: z.string(),
  description: z.string().nullable(),
});

export const roleSchema = z.object({
  id: z.uuid(),
  code: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  isSystem: z.boolean(),
  permissions: z.array(permissionSchema),
  assignedUserCount: z.number().int().nonnegative(),
  workflowStepCount: z.number().int().nonnegative(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const roleListSchema = z.object({
  items: z.array(roleSchema),
  pagination: z.object({
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  }),
});

export const permissionListSchema = z.object({
  items: z.array(permissionSchema),
  pagination: z.object({
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  }),
});

export const roleFormSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2, "Role code must contain at least 2 characters")
    .max(50, "Role code must not exceed 50 characters")
    .regex(/^[A-Z][A-Z0-9_]*$/, "Use uppercase letters, numbers, and underscores only"),
  name: z
    .string()
    .trim()
    .min(2, "Role name must contain at least 2 characters")
    .max(100, "Role name must not exceed 100 characters"),
  description: z.string().trim().max(1000, "Description must not exceed 1,000 characters"),
  permissionIds: z.array(z.uuid()).max(200),
});

export type Permission = z.infer<typeof permissionSchema>;
export type PermissionList = z.infer<typeof permissionListSchema>;
export type Role = z.infer<typeof roleSchema>;
export type RoleList = z.infer<typeof roleListSchema>;
export type RoleFormInput = z.input<typeof roleFormSchema>;
export type RoleFormValues = z.output<typeof roleFormSchema>;
