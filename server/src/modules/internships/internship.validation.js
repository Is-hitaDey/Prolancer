
import { z } from "zod";

const objectIdSchema = z.string().regex(
  /^[0-9a-fA-F]{24}$/,
  "Invalid ID"
);

const internshipFields = {
  title: z.string().trim().min(5).max(100),

  shortDescription: z.string().trim().min(10).max(200),

  description: z.string().trim().min(20),

  category: z.string().trim().min(2),

  skills: z.array(z.string().trim().min(1)).min(1),

  difficulty: z.enum([
    "beginner",
    "intermediate",
    "advanced",
  ]),

  durationWeeks: z.coerce.number().int().min(1),

  startDate: z.coerce.date(),

  endDate: z.coerce.date(),

  maxParticipants: z.coerce.number().int().min(1).max(10000),
};

export const createInternshipSchema = z.object({
  body: z.object(internshipFields).superRefine((data, ctx) => {
    if (data.endDate <= data.startDate) {
      ctx.addIssue({
        code: "custom",
        path: ["endDate"],
        message: "End date must be after start date.",
      });
    }
  }),
});

export const updateInternshipSchema = z.object({
  params: z.object({
    internshipId: objectIdSchema,
  }),

  body: z.object({
    title: internshipFields.title.optional(),
    shortDescription: internshipFields.shortDescription.optional(),
    description: internshipFields.description.optional(),
    category: internshipFields.category.optional(),
    skills: internshipFields.skills.optional(),
    difficulty: internshipFields.difficulty.optional(),
    durationWeeks: internshipFields.durationWeeks.optional(),
    startDate: internshipFields.startDate.optional(),
    endDate: internshipFields.endDate.optional(),
    maxParticipants: internshipFields.maxParticipants.optional(),
  }).strict().refine(
    (data) => Object.keys(data).length > 0,
    "Provide at least one field to update."
  ),
});

export const internshipStatusSchema = z.object({
  params: z.object({
    internshipId: objectIdSchema,
  }),

  body: z.object({
    status: z.enum([
      "draft",
      "published",
      "closed",
      "cancelled",
    ]),
  }),
});

export const internshipIdSchema = z.object({
  params: z.object({
    internshipId: objectIdSchema,
  }),
});

export const enrollmentQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
    status: z.enum([
      "enrolled",
      "active",
      "completed",
      "withdrawn",
    ]).optional(),
  }),
});

export const internshipListQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
    category: z.string().trim().optional(),
    difficulty: z.enum([
      "beginner",
      "intermediate",
      "advanced",
    ]).optional(),
    search: z.string().trim().optional(),
    sort: z.enum(["newest", "oldest", "upcoming"]).default("newest"),
  }),
});

export const enrollmentIdSchema = z.object({
  params: z.object({
    enrollmentId: objectIdSchema,
  }),
});

export const participantsQuerySchema = z.object({
  params: z.object({
    internshipId: objectIdSchema,
  }),
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
    status: z.enum([
      "enrolled",
      "active",
      "completed",
      "withdrawn",
    ]).optional(),
  }),
});