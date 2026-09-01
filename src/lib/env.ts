import { z } from "zod";

export const publicEnvSchema = z.object({
  NEXT_PUBLIC_APP_NAME: z.string().trim().min(1).default("SecuraAI"),
  NEXT_PUBLIC_API_BASE_URL: z.url().default("http://localhost:3001/api/v1"),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;

export function parsePublicEnv(source: Record<string, string | undefined>): PublicEnv {
  return publicEnvSchema.parse(source);
}

export const env = parsePublicEnv({
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
});
