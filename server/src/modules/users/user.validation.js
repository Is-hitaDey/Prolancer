import { z } from "zod";

const optionalUrl = z
  .string()
  .trim()
  .url("Please enter a valid URL")
  .or(z.literal(""));

const profileUpdateSchema = z.object({
  headline: z.string().trim().max(100).optional(),

  bio: z.string().trim().max(500).optional(),

  avatarUrl: optionalUrl.optional(),

  skills: z
    .array(z.string().trim().min(1).max(40))
    .max(30)
    .optional(),

  experienceLevel: z
    .enum(["beginner", "intermediate", "advanced"])
    .optional(),

  interests: z
    .array(z.string().trim().min(1).max(50))
    .max(15)
    .optional(),

  githubUrl: optionalUrl.optional(),

  linkedinUrl: optionalUrl.optional(),

  portfolioUrl: optionalUrl.optional(),

  profileVisibility: z
    .enum(["public", "private"])
    .optional(),
}).strict();

export const updateProfileSchema = z
  .object({
    name: z.string().trim().min(2).max(50).optional(),

    profile: profileUpdateSchema.optional(),
  })
  .strict()
  .refine(
    (data) => Object.keys(data).length > 0,
    "At least one field must be provided"
  );