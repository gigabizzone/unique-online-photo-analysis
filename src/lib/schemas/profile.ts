// Server-safe profile schema. Lives outside any "use client" module so
// it can be imported from both the client form (ProfileSection) and from
// server API routes (e.g. /api/analysis/*) without Next.js complaining
// about cross-boundary references.

import { z } from "zod";

export const profileSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  gender: z.enum(["Male", "Female", "Other"]),
  email: z.string().trim().email("Enter a valid email"),
  whatsapp: z
    .string()
    .trim()
    .regex(
      /^\+[1-9]\d{7,14}$/,
      "WhatsApp number must be E.164 format, e.g. +91XXXXXXXXXX"
    ),
});

export type ProfileFormData = z.infer<typeof profileSchema>;
