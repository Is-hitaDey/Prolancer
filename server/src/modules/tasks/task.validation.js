
import { z } from "zod";

const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ID.");

const sprintSchema = z.object({
  number: z.coerce.number().int().min(1),

  title: z.string().trim().min(2).max(100),

  startDay: z.coerce.number().int().min(1),

  endDay: z.coerce.number().int().min(1),
}).refine(
  (data) => data.endDay >= data.startDay,
  {
    message: "Sprint end day must be greater than or equal to start day.",
    path: ["endDay"],
  }
);

const deliverableSchema = z.object({
  type: z.enum([
    "github_repository",
    "deployment_url",
    "document",
    "other",
  ]),

  title: z.string().trim().min(2).max(100),

  description: z.string().trim().optional(),

  required: z.boolean().default(true),
});

const evaluationCriteriaSchema = z.object({
  title: z.string().trim().min(2).max(100),

  description: z.string().trim().optional(),

  weight: z.coerce.number().min(0).max(100).default(0),
});

const evaluationCriteriaArraySchema = z
  .array(evaluationCriteriaSchema)
  .default([])
  .refine(
    (criteria) =>
      criteria.reduce((total, item) => total + item.weight, 0) <= 100,
    {
      message: "Total evaluation weight cannot exceed 100%.",
    }
  );

const taskFields = {
  title: z.string().trim().min(5).max(150),

  description: z.string().trim().min(10),

  internship: objectIdSchema,

  template: objectIdSchema.nullable().optional(),

  sprint: sprintSchema,

  difficulty: z.enum([
    "beginner",
    "intermediate",
    "advanced",
  ]),

  category: z.string().trim().min(2).max(100),

  instructions: z.array(z.string().trim().min(1)).default([]),

  acceptanceCriteria: z.array(z.string().trim().min(1)).default([]),

  deliverables: z.array(deliverableSchema).default([]),

  estimatedHours: z.coerce.number().int().min(1),

  evaluationCriteria: evaluationCriteriaArraySchema,

  order: z.coerce.number().int().min(0).default(0),
};

const createTaskSchema = z.object(taskFields);

const updateTaskSchema = z.object({
  title: taskFields.title.optional(),
  description: taskFields.description.optional(),
  template: taskFields.template,
  sprint: taskFields.sprint.optional(),
  difficulty: taskFields.difficulty.optional(),
  category: taskFields.category.optional(),
  instructions: taskFields.instructions.optional(),
  acceptanceCriteria: taskFields.acceptanceCriteria.optional(),
  deliverables: taskFields.deliverables.optional(),
  estimatedHours: taskFields.estimatedHours.optional(),
  evaluationCriteria: taskFields.evaluationCriteria.optional(),
  order: taskFields.order.optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  {
    message: "At least one field is required for an update.",
  }
);

const taskQuerySchema = z.object({
  internshipId: objectIdSchema,

  page: z.coerce.number().int().min(1).default(1),

  limit: z.coerce.number().int().min(1).max(100).default(10),

  difficulty: z.enum([
    "beginner",
    "intermediate",
    "advanced",
  ]).optional(),

  category: z.string().trim().optional(),

  sprint: z.coerce.number().int().min(1).optional(),

  status: z.enum([
    "draft",
    "published",
    "archived",
  ]).optional(),

  search: z.string().trim().optional(),
});

const taskIdSchema = z.object({
  taskId: objectIdSchema,
});

// Reusable validation middleware
const validate = (schema, source) => {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const error = new Error("Validation failed.");
      error.statusCode = 400;
      error.errors = result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));

      return next(error);
    }

    req.validated = req.validated || {};
    req.validated[source] = result.data;

    next();
  };
};

export const validateCreateTask = validate(
  createTaskSchema,
  "body"
);

export const validateUpdateTask = validate(
  updateTaskSchema,
  "body"
);

export const validateTaskQuery = validate(
  taskQuerySchema,
  "query"
);

export const validateTaskId = validate(
  taskIdSchema,
  "params"
);

