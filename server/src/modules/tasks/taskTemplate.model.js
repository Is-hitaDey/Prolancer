
import mongoose from "mongoose";

const deliverableSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        "github_repository",
        "deployment_url",
        "document",
        "other",
      ],
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },

    required: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false }
);

const evaluationCriteriaSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },

    weight: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
  },
  { _id: false }
);

const taskTemplateSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 150,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      required: true,
      trim: true,
    },

    difficulty: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      required: true,
    },

    instructions: {
      type: [String],
      default: [],
    },

    acceptanceCriteria: {
      type: [String],
      default: [],
    },

    deliverables: {
      type: [deliverableSchema],
      default: [],
    },

    estimatedHours: {
      type: Number,
      required: true,
      min: 1,
    },

    evaluationCriteria: {
      type: [evaluationCriteriaSchema],
      default: [],
    },

    status: {
      type: String,
      enum: ["draft", "active", "archived"],
      default: "draft",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Template discovery indexes
taskTemplateSchema.index({
  status: 1,
  category: 1,
  difficulty: 1,
});

const TaskTemplate = mongoose.model(
  "TaskTemplate",
  taskTemplateSchema
);

export default TaskTemplate;
