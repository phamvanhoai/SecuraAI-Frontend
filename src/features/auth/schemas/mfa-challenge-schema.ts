import { z } from "zod";

export const mfaChallengeSchema = z.object({
  code: z
    .string()
    .regex(
      /^(?:\d{6}|[A-Za-z0-9]{4}(?:-[A-Za-z0-9]{4}){2})$/,
      "Enter a 6-digit authentication code or recovery code.",
    ),
});

export type MfaChallengeInput = z.infer<typeof mfaChallengeSchema>;
