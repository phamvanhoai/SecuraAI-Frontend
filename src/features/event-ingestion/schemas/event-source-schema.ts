import { z } from "zod";

export const eventFamilies = [
  "AUTHENTICATION",
  "VPN_SSO",
  "APPLICATION_ACCESS",
] as const;

export const ingestionMethods = ["API", "FILE"] as const;
export const eventSourceStatuses = ["ACTIVE", "INACTIVE"] as const;

export const registerEventSourceFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Source name cannot be empty")
      .max(255, "Source name cannot exceed 255 characters"),
    sourceType: z
      .string()
      .trim()
      .min(1, "Source type cannot be empty")
      .max(100, "Source type cannot exceed 100 characters")
      .default("WAZUH"),
    endpoint: z
      .string()
      .trim()
      .max(2048, "Endpoint cannot exceed 2048 characters")
      .optional()
      .or(z.literal("")),
    ingestionMethod: z.enum(ingestionMethods).default("API"),
    authenticationType: z
      .string()
      .trim()
      .max(100, "Authentication method cannot exceed 100 characters")
      .default("BEARER_TOKEN"),
    secretToken: z
      .string()
      .trim()
      .max(255, "Secret token cannot exceed 255 characters")
      .optional()
      .or(z.literal("")),
    username: z
      .string()
      .trim()
      .max(255, "Username cannot exceed 255 characters")
      .optional()
      .or(z.literal("")),
    password: z
      .string()
      .max(255, "Password cannot exceed 255 characters")
      .optional()
      .or(z.literal("")),
    status: z.enum(eventSourceStatuses).default("ACTIVE"),
    description: z
      .string()
      .trim()
      .max(2000, "Description cannot exceed 2000 characters")
      .optional()
      .or(z.literal("")),
    eventFamilies: z
      .array(z.enum(eventFamilies))
      .min(1, "Select at least one event family"),
  })
  .refine(
    (data) => {
      if (data.ingestionMethod === "API") {
        return Boolean(data.endpoint && data.endpoint.trim().length > 0);
      }
      return true;
    },
    {
      message: "Connection endpoint is required when ingestion method is API",
      path: ["endpoint"],
    },
  );

export type RegisterEventSourceFormValues = z.infer<typeof registerEventSourceFormSchema>;

export const eventSourceResponseSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  sourceType: z.string(),
  endpoint: z.string().nullable(),
  ingestionMethod: z.enum(ingestionMethods),
  authenticationType: z.string().nullable(),
  status: z.enum(eventSourceStatuses),
  description: z.string().nullable(),
  eventFamilies: z.array(z.enum(eventFamilies)),
  createdBy: z.uuid(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type EventSourceResponse = z.infer<typeof eventSourceResponseSchema>;
